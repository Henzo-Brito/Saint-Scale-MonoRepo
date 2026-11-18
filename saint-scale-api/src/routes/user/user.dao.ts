import argon2 from "argon2";
import * as crypto from "node:crypto";
import { pool } from "../../db/index.js";
import type {
	AlterBirthday,
	AlterEmail,
	AlterLogradouro,
	AlterTelephone,
	CreateUser,
	ForgotPassword,
	Me,
	PasswordResetRequest,
	UserPublic,
} from "../../schemas/user.schemas.js";

// ── Igreja padrão ───────────────────────────────────────────────────────
async function obterIdIgrejaPadrao(): Promise<number> {
	const env = process.env.NODE_ENV || "development";
	const isProduction = env === "production";

	// 1. DEFAULT_IGREJA_ID
	const idEnv = process.env.DEFAULT_IGREJA_ID;
	if (idEnv) {
		const id = Number(idEnv);
		if (!Number.isNaN(id)) {
			const [rows] = await pool.execute<any[]>(
				`SELECT id_igreja FROM igrejas WHERE id_igreja = ? LIMIT 1`,
				[id],
			);
			if ((rows as any[]).length > 0) return id;
			if (isProduction) {
				throw new Error("Igreja padrão configurada (DEFAULT_IGREJA_ID) não encontrada no banco.");
			}
		}
	}

	// 2. DEFAULT_IGREJA_NOME
	const nomeEnv = process.env.DEFAULT_IGREJA_NOME;
	if (nomeEnv) {
		const [rows] = await pool.execute<any[]>(
			`SELECT id_igreja FROM igrejas WHERE nome = ? LIMIT 1`,
			[nomeEnv.trim()],
		);
		if ((rows as any[]).length > 0) return Number((rows as any[])[0].id_igreja);
		if (isProduction) {
			throw new Error("Igreja padrão configurada (DEFAULT_IGREJA_NOME) não encontrada no banco.");
		}
	}

	// 3. Desenvolvimento/teste: fallback "Igreja Central"
	if (!isProduction) {
		const [existente] = await pool.execute<any[]>(
			`SELECT id_igreja FROM igrejas WHERE nome = ? LIMIT 1`,
			["Igreja Central"],
		);
		if ((existente as any[]).length > 0) {
			return Number((existente as any[])[0].id_igreja);
		}

		const [result] = await pool.execute<any>(
			`INSERT INTO igrejas (nome) VALUES (?)`,
			["Igreja Central"],
		);
		const insertResult = result as any;
		if (insertResult.insertId) {
			return Number(insertResult.insertId);
		}
	}

	throw new Error("Igreja padrão não configurada. Defina DEFAULT_IGREJA_ID ou DEFAULT_IGREJA_NOME.");
}

// ── Código de entrada ────────────────────────────────────────────────────
const CODIGO_SECRET = process.env.CODIGO_ENTRADA_SECRET ?? "saint-scale-codigo-entrada-secreto";
const CODIGO_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function gerarCodigo(tipo: string, id: number): string {
	const hash = crypto.createHmac("sha256", CODIGO_SECRET).update(`${tipo}-${id}`).digest();
	return Array.from({ length: 6 }, (_, i) => CODIGO_LETRAS[hash[i] % CODIGO_LETRAS.length]).join("");
}

async function resolverIgrejaPeloCodigo(codigoEntrada: string): Promise<number | null> {
	const codigo = String(codigoEntrada || "").trim().toUpperCase();
	if (!codigo) return null;

	const [igrejas] = await pool.execute<any[]>(`SELECT id_igreja FROM igrejas`);
	for (const row of igrejas as any[]) {
		if (gerarCodigo("igreja", Number(row.id_igreja)) === codigo) {
			return Number(row.id_igreja);
		}
	}

	const [ministerios] = await pool.execute<any[]>(`SELECT id_ministerio, id_igreja_fk FROM ministerios`);
	for (const row of ministerios as any[]) {
		if (gerarCodigo("ministerio", Number(row.id_ministerio)) === codigo) {
			return Number(row.id_igreja_fk);
		}
	}

	return null;
}

// Converte Date do MySQL para YYYY-MM-DD (ISO, sem timezone shift).
function formatBirthDate(raw: Date | string | null): string | null {
	if (!raw) return null;
	const d = raw instanceof Date ? raw : new Date(raw);
	const year = d.getUTCFullYear();
	const month = String(d.getUTCMonth() + 1).padStart(2, "0");
	const day = String(d.getUTCDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

function mapRow(row: Record<string, unknown>): UserPublic {
	return {
		id_member: row.id_member as number,
		name: row.name as string,
		register_date:
			row.register_date instanceof Date
				? row.register_date.toISOString()
				: String(row.register_date),
		birth_date: formatBirthDate(row.birth_date as Date | string | null),
		telephone: (row.telephone as string | null) ?? null,
		email: row.email as string,
		role: row.role as string,
		id_logradouro: (row.id_logradouro as number | null) ?? null,
	};
}

export type AlterEmailResult =
	| { ok: true }
	| { ok: false; reason: "not-found" }
	| { ok: false; reason: "duplicate" };

export const userDao = {
	// ── POST / ───────────────────────────────────────────────────────

	async createUser(user: CreateUser): Promise<UserPublic> {
		let idIgreja: number;
		if (user.codigoEntrada && user.codigoEntrada.trim() !== "") {
			const idPorCodigo = await resolverIgrejaPeloCodigo(user.codigoEntrada);
			if (!idPorCodigo) {
				const error = new Error("Código de entrada inválido.") as { status?: number };
				error.status = 400;
				throw error;
			}
			idIgreja = idPorCodigo;
		} else {
			idIgreja = await obterIdIgrejaPadrao();
		}

		// Duplicidade de email
		const [existeEmailRows] = await pool.execute<any[]>(
			`SELECT 1 FROM membros WHERE email = ? LIMIT 1`,
			[user.email],
		);
		if ((existeEmailRows as any[]).length > 0) {
			const error = new Error("Este e-mail já tem cadastro.") as { status?: number };
			error.status = 400;
			throw error;
		}

		// Duplicidade de usuario
		if (user.usuario) {
			const [existeUsuarioRows] = await pool.execute<any[]>(
				`SELECT 1 FROM membros WHERE usuario = ? LIMIT 1`,
				[user.usuario],
			);
			if ((existeUsuarioRows as any[]).length > 0) {
				const error = new Error("Este nome de usuário já está em uso.") as { status?: number };
				error.status = 400;
				throw error;
			}
		}

		const hashedPassword = await argon2.hash(user.password, { type: argon2.argon2id });

		const [result] = await pool.execute<any>(
			`INSERT INTO membros (nome, data_nascimento, telefone, email, senha, cargo, usuario, id_igreja_fk, status)
			 VALUES (?, ?, ?, ?, ?, 'membro', ?, ?, 'pendente')`,
			[user.name, user.birth_date ?? null, user.telephone ?? null, user.email, hashedPassword, user.usuario ?? null, idIgreja],
		);
		const insertResult = result as any;
		const newId = insertResult.insertId;

		// Busca o registro recém-criado para retornar
		const [rows] = await pool.execute<any[]>(
			`SELECT
				id_membro        AS id_member,
				nome             AS name,
				data_registro    AS register_date,
				data_nascimento  AS birth_date,
				telefone         AS telephone,
				email,
				cargo            AS role,
				id_logradouro_fk AS id_logradouro
			FROM membros WHERE id_membro = ?`,
			[newId],
		);

		return mapRow((rows as any[])[0]);
	},

	// ── GET / ────────────────────────────────────────────────────────

	async getUsers(idIgreja?: number | null): Promise<UserPublic[]> {
		if (idIgreja == null) return [];
		const [rows] = await pool.execute<any[]>(
			`SELECT
				id_membro        AS id_member,
				nome             AS name,
				data_registro    AS register_date,
				data_nascimento  AS birth_date,
				telefone         AS telephone,
				email,
				cargo            AS role,
				id_logradouro_fk AS id_logradouro
			FROM membros
			WHERE id_igreja_fk = ?`,
			[idIgreja],
		);
		return (rows as any[]).map(mapRow);
	},

	async getUserChurchId(idMember: number): Promise<number | null> {
		const [rows] = await pool.execute<any[]>(
			`SELECT id_igreja_fk FROM membros WHERE id_membro = ? LIMIT 1`,
			[idMember],
		);
		return (rows as any[])[0]?.id_igreja_fk ?? null;
	},

	// ── GET /me ──────────────────────────────────────────────────────

	async getMe(idMember: number): Promise<Me | null> {
		const [memberRows] = await pool.execute<any[]>(
			`SELECT
				m.id_membro       AS id_membro,
				m.nome            AS nome,
				m.email           AS email,
				m.img_id          AS img_id,
				m.cargo           AS cargo,
				m.data_nascimento AS data_nascimento,
				m.telefone        AS telefone,
				m.data_registro   AS data_registro,
				l.rua             AS rua,
				l.numero          AS numero
			FROM membros m
			LEFT JOIN logradouros l ON l.id_logradouro = m.id_logradouro_fk
			WHERE m.id_membro = ?
			LIMIT 1`,
			[idMember],
		);

		if (!(memberRows as any[])[0]) return null;
		const m = (memberRows as any[])[0];

		const [funcoesRows] = await pool.execute<any[]>(
			`SELECT f.nome
			FROM membros_funcoes mf
			JOIN funcoes f ON f.id_funcao = mf.id_funcoes_fk
			WHERE mf.id_membros_fk = ?`,
			[idMember],
		);

		const [equipesRows] = await pool.execute<any[]>(
			`SELECT
				e.img_id                        AS img_id,
				e.title                         AS title,
				COUNT(em2.id_membros_fk)        AS quant_part
			FROM equipes_membros em1
			JOIN equipes e ON e.id_equipes = em1.id_equipes_fk
			LEFT JOIN equipes_membros em2 ON em2.id_equipes_fk = e.id_equipes
			WHERE em1.id_membros_fk = ?
			GROUP BY e.id_equipes, e.img_id, e.title`,
			[idMember],
		);

		const [ministeriosRows] = await pool.execute<any[]>(
			`SELECT
				mi.id_ministerio AS id,
				mi.nome          AS nome
			FROM membros_ministerios mm
			JOIN ministerios mi ON mi.id_ministerio = mm.id_ministerio_fk
			WHERE mm.id_membro_fk = ?
			ORDER BY mi.nome`,
			[idMember],
		);

		return {
			id_membro: m.id_membro,
			nome: m.nome,
			email: m.email,
			img_id: m.img_id ?? null,
			cargo: m.cargo,
			funcoes: (funcoesRows as any[]).map((r) => r.nome),
			data_nascimento: formatBirthDate(m.data_nascimento),
			telefone: m.telefone ?? null,
			logradouro: m.rua != null ? { rua: m.rua, numero: m.numero } : null,
			equipes: (equipesRows as any[]).map((r) => ({
				img_id: r.img_id ?? null,
				title: r.title,
				quant_part: Number(r.quant_part),
			})),
			ministerios: (ministeriosRows as any[]).map((r) => ({
				id: r.id,
				nome: r.nome,
			})),
			data_registro:
				m.data_registro instanceof Date
					? m.data_registro.toISOString()
					: String(m.data_registro),
		};
	},

	// ── PATCH email ──────────────────────────────────────────────────

	async alterEmail(idMember: number, data: AlterEmail): Promise<AlterEmailResult> {
		try {
			const [result] = await pool.execute<any>(
				`UPDATE membros SET email = ? WHERE id_membro = ?`,
				[data.email, idMember],
			);
			if ((result as any).affectedRows > 0) {
				return { ok: true };
			}
			return { ok: false, reason: "not-found" };
		} catch (error: unknown) {
			const mysqlError = error as { code?: string };
			if (mysqlError.code === "ER_DUP_ENTRY") {
				return { ok: false, reason: "duplicate" };
			}
			throw error;
		}
	},

	// ── Esqueci senha ────────────────────────────────────────────────

	async forgotPassword(data: ForgotPassword): Promise<boolean> {
		const [memberRows] = await pool.execute<any[]>(
			`SELECT id_membro FROM membros WHERE email = ? LIMIT 1`,
			[data.email],
		);
		if (!(memberRows as any[])[0]) return false;
		const idMembro = (memberRows as any[])[0].id_membro;

		const [tokenRows] = await pool.execute<any[]>(
			`SELECT id, token_hash, expires_at, used_at
			FROM password_reset_tokens
			WHERE id_membro_fk = ?
			AND used_at IS NULL
			AND expires_at > NOW()
			ORDER BY created_at DESC
			LIMIT 1`,
			[idMembro],
		);
		const tokenRow = (tokenRows as any[])[0];
		if (!tokenRow) return false;

		const tokenValido = await argon2.verify(tokenRow.token_hash, data.token);
		if (!tokenValido) return false;

		const hashedPassword = await argon2.hash(data.password, { type: argon2.argon2id });

		await pool.execute(
			`UPDATE membros SET senha = ? WHERE id_membro = ?`,
			[hashedPassword, idMembro],
		);

		await pool.execute(
			`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`,
			[tokenRow.id],
		);

		await pool.execute(
			`UPDATE password_reset_tokens SET used_at = NOW()
			WHERE id_membro_fk = ? AND used_at IS NULL AND id <> ?`,
			[idMembro, tokenRow.id],
		);

		return true;
	},

	async createPasswordResetToken(data: PasswordResetRequest): Promise<{ token?: string }> {
		const [memberRows] = await pool.execute<any[]>(
			`SELECT id_membro FROM membros WHERE email = ? LIMIT 1`,
			[data.email],
		);
		if (!(memberRows as any[])[0]) return {};
		const idMembro = (memberRows as any[])[0].id_membro;

		const token = crypto.randomBytes(32).toString("hex");
		const tokenHash = await argon2.hash(token, { type: argon2.argon2id });
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
			.toISOString()
			.slice(0, 19)
			.replace("T", " ");

		await pool.execute(
			`INSERT INTO password_reset_tokens (id_membro_fk, token, token_hash, expires_at)
			VALUES (?, ?, ?, ?)`,
			[idMembro, token, tokenHash, expiresAt],
		);

		if (process.env.NODE_ENV !== "production") {
			return { token };
		}
		return {};
	},

	// ── Logradouro ───────────────────────────────────────────────────

	async alterLogradouro(idMember: number, data: AlterLogradouro): Promise<boolean> {
		// Tenta inserir; se já existir (ON DUPLICATE KEY), não faz nada
		await pool.execute(
			`INSERT INTO logradouros (rua, numero)
			 VALUES (?, ?)
			 ON DUPLICATE KEY UPDATE rua = rua`,
			[data.rua, data.numero],
		);

		// Busca o id do logradouro (existente ou recém-criado)
		const [rows] = await pool.execute<any[]>(
			`SELECT id_logradouro FROM logradouros WHERE rua = ? AND numero = ? LIMIT 1`,
			[data.rua, data.numero],
		);
		if (!(rows as any[])[0]) return false;
		const idLogradouro = (rows as any[])[0].id_logradouro;

		const [result] = await pool.execute<any>(
			`UPDATE membros SET id_logradouro_fk = ? WHERE id_membro = ?`,
			[idLogradouro, idMember],
		);
		return (result as any).affectedRows > 0;
	},

	async alterBirthday(idMember: number, data: AlterBirthday): Promise<boolean> {
		const [result] = await pool.execute<any>(
			`UPDATE membros SET data_nascimento = ? WHERE id_membro = ?`,
			[data.birth_date, idMember],
		);
		return (result as any).affectedRows > 0;
	},

	async alterTelephone(idMember: number, data: AlterTelephone): Promise<boolean> {
		const [result] = await pool.execute<any>(
			`UPDATE membros SET telefone = ? WHERE id_membro = ?`,
			[data.telephone, idMember],
		);
		return (result as any).affectedRows > 0;
	},

	// ── GET /funcoes ─────────────────────────────────────────────────

	async getFuncoes(idIgreja: number): Promise<{ id: number; nome: string }[]> {
		const [rows] = await pool.execute<any[]>(
			`SELECT id_funcao AS id, nome FROM funcoes WHERE id_igreja_fk = ? ORDER BY nome`,
			[idIgreja],
		);
		return rows as any[];
	},

	// ── PATCH /funcoes ───────────────────────────────────────────────

	async setFuncoes(idMember: number, idIgreja: number, nomes: string[]): Promise<{ id: number; nome: string }[]> {
		const nomesLimpos = [...new Set(nomes.map((n) => n.trim()).filter(Boolean))];

		const ids: number[] = [];
		for (const nome of nomesLimpos) {
			const [existing] = await pool.execute<any[]>(
				`SELECT id_funcao FROM funcoes WHERE LOWER(nome) = LOWER(?) AND id_igreja_fk = ? LIMIT 1`,
				[nome, idIgreja],
			);
			if ((existing as any[]).length > 0) {
				ids.push((existing as any[])[0].id_funcao);
			} else {
				const [inserted] = await pool.execute<any>(
					`INSERT INTO funcoes (nome, id_igreja_fk) VALUES (?, ?)`,
					[nome, idIgreja],
				);
				ids.push((inserted as any).insertId);
			}
		}

		// Substitui funções dentro de uma transação
		const conn = await pool.getConnection();
		try {
			await conn.beginTransaction();
			await conn.execute(`DELETE FROM membros_funcoes WHERE id_membros_fk = ?`, [idMember]);
			for (const idFuncao of ids) {
				await conn.execute(
					`INSERT INTO membros_funcoes (id_membros_fk, id_funcoes_fk) VALUES (?, ?)`,
					[idMember, idFuncao],
				);
			}
			await conn.commit();
		} catch (err) {
			await conn.rollback();
			throw err;
		} finally {
			conn.release();
		}

		const [result] = await pool.execute<any[]>(
			`SELECT f.id_funcao AS id, f.nome
			 FROM membros_funcoes mf
			 JOIN funcoes f ON f.id_funcao = mf.id_funcoes_fk
			 WHERE mf.id_membros_fk = ?
			 ORDER BY f.nome`,
			[idMember],
		);
		return result as any[];
	},
};
