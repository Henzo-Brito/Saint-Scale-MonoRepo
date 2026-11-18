import argon2 from "argon2";
import { pool } from "../../db/index.js";
import * as crypto from "node:crypto";

const CODIGO_SECRET =
	process.env.CODIGO_ENTRADA_SECRET ?? "saint-scale-codigo-entrada-secreto";
const CODIGO_LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function formatDate(d: Date): string {
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function gerarCodigo(tipo: string, id: number): string {
	const hash = crypto.createHmac("sha256", CODIGO_SECRET).update(`${tipo}-${id}`).digest();
	return Array.from({ length: 6 }, (_, i) => CODIGO_LETRAS[hash[i] % CODIGO_LETRAS.length]).join("");
}

type MembroCargo = {
	id_cargo_fk: number | null;
	id_igreja_fk: number | null;
};

export async function getMembroCargo(idMembro: number): Promise<MembroCargo | null> {
	const [rows] = await pool.execute<any[]>(
		`SELECT m.id_cargo_fk, m.id_igreja_fk FROM membros m WHERE m.id_membro = ?`,
		[idMembro],
	);
	return (rows as any[])[0] ?? null;
}

export function ehAdmin(idCargoFk: number | null): boolean {
	return idCargoFk === 1;
}

export function ehMembro(idCargoFk: number | null): boolean {
	return idCargoFk !== 1;
}

export async function getDashboard(idMembro: number, idIgreja: number, idCargoFk: number | null) {
	const admin = ehAdmin(idCargoFk);

	const [igrejaRows] = await pool.execute<any[]>(
		`SELECT id_igreja AS id, nome FROM igrejas WHERE id_igreja = ?`,
		[idIgreja],
	);
	const igreja = (igrejaRows as any[])[0];
	if (!igreja) throw new Error("Igreja não encontrada");

	const [
		[ministeriosRows],
		[equipesRows],
		[logradourosRows],
		[musicasRows],
		[escalasRows],
		[membrosRows],
		[cargosRows],
	] = await Promise.all([
		pool.execute<any[]>(`SELECT id_ministerio AS id, nome FROM ministerios WHERE id_igreja_fk = ? ORDER BY nome`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_equipes AS id, title AS nome FROM equipes WHERE id_igreja_fk = ? ORDER BY title`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_logradouro AS id, rua AS nome FROM logradouros WHERE id_igreja_fk = ? ORDER BY rua`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_musica AS id, nome FROM musicas WHERE id_igreja_fk = ? ORDER BY nome`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_escala AS id, nome_escala AS nome FROM escalas WHERE id_igreja_fk = ? ORDER BY nome_escala`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_membro AS id, nome, email, cargo, status FROM membros WHERE id_igreja_fk = ? ORDER BY nome`, [idIgreja]),
		pool.execute<any[]>(`SELECT id_cargo, nome, id_igreja_fk FROM cargos WHERE id_cargo = 1 OR id_igreja_fk = ? ORDER BY nome`, [idIgreja]),
	]);

	const ministerios = ministeriosRows as any[];
	const equipes = equipesRows as any[];
	const locais = logradourosRows as any[];
	const musicas = musicasRows as any[];
	const escalas = escalasRows as any[];
	const membros = membrosRows as any[];
	const cargos = (cargosRows as any[]).map((c: any) => ({ id: c.id_cargo, nome: c.nome }));

	const eu = membros.find((m: any) => m.id === idMembro);
	if (!eu) throw new Error("Membro não encontrado");

	const [[vinculosRows]] = await Promise.all([
		pool.execute<any[]>(
			`SELECT mm.id_membro_fk AS membro, mm.id_ministerio_fk AS ministerio
			 FROM membros_ministerios mm
			 JOIN ministerios mi ON mi.id_ministerio = mm.id_ministerio_fk
			 WHERE mi.id_igreja_fk = ?`,
			[idIgreja],
		),
	]);
	const vinculos = vinculosRows as any[];

	let meusMinisterios: typeof ministerios;
	if (admin) {
		meusMinisterios = ministerios;
	} else {
		meusMinisterios = ministerios.filter((m: any) =>
			vinculos.some((v: any) => v.membro === idMembro && v.ministerio === m.id),
		);
	}

	const [[membrosEquipesRows]] = await Promise.all([
		pool.execute<any[]>(
			`SELECT me.id_membros_fk AS membro, me.id_equipes_fk AS equipe
			 FROM equipes_membros me
			 JOIN equipes e ON e.id_equipes = me.id_equipes_fk
			 WHERE e.id_igreja_fk = ?`,
			[idIgreja],
		),
	]);
	const membrosEquipes = membrosEquipesRows as any[];

	const igrejaComCodigo = { ...igreja, codigo: undefined as string | undefined };

	return {
		versao: "igrejas-4",
		igrejas: igrejaComCodigo ? [igrejaComCodigo] : [],
		ministerios,
		equipes,
		locais,
		musicas,
		escalas,
		membros,
		cargos,
		eu: { id: eu.id, nome: eu.nome, usuario: eu.email, admin },
		igreja: { id: igrejaComCodigo.id, nome: igrejaComCodigo.nome },
		vinculos,
		meusMinisterios,
		membrosEquipes,
	};
}

export async function escolherMinisterio(idMembro: number, idIgreja: number, idCargoFk: number | null, idMinisterio: number): Promise<boolean> {
	if (ehAdmin(idCargoFk)) {
		const [rows] = await pool.execute<any[]>(
			`SELECT 1 FROM ministerios WHERE id_ministerio = ? AND id_igreja_fk = ?`,
			[idMinisterio, idIgreja],
		);
		return (rows as any[]).length > 0;
	}
	const [rows] = await pool.execute<any[]>(
		`SELECT 1 FROM membros_ministerios WHERE id_membro_fk = ? AND id_ministerio_fk = ?`,
		[idMembro, idMinisterio],
	);
	return (rows as any[]).length > 0;
}

export async function adicionarMembroAoMinisterio(idMinisterio: number, idMembro: number, idIgreja: number): Promise<boolean> {
	const [[minRows], [memRows]] = await Promise.all([
		pool.execute<any[]>(`SELECT 1 FROM ministerios WHERE id_ministerio = ? AND id_igreja_fk = ?`, [idMinisterio, idIgreja]),
		pool.execute<any[]>(`SELECT 1 FROM membros WHERE id_membro = ? AND id_igreja_fk = ?`, [idMembro, idIgreja]),
	]);
	if ((minRows as any[]).length === 0 || (memRows as any[]).length === 0) return false;
	await pool.execute(
		`INSERT IGNORE INTO membros_ministerios (id_membro_fk, id_ministerio_fk) VALUES (?, ?)`,
		[idMembro, idMinisterio],
	);
	return true;
}

export async function removerMembroDoMinisterio(idMinisterio: number, idMembro: number, idIgreja: number): Promise<boolean> {
	const [minRows] = await pool.execute<any[]>(
		`SELECT 1 FROM ministerios WHERE id_ministerio = ? AND id_igreja_fk = ?`,
		[idMinisterio, idIgreja],
	);
	if ((minRows as any[]).length === 0) return false;

	await pool.execute(
		`DELETE FROM membros_ministerios WHERE id_ministerio_fk = ? AND id_membro_fk = ?`,
		[idMinisterio, idMembro],
	);

	// Remove equipes da mesma igreja
	await pool.execute(
		`DELETE em FROM equipes_membros em
		 JOIN equipes e ON e.id_equipes = em.id_equipes_fk
		 WHERE em.id_membros_fk = ? AND e.id_igreja_fk = ?`,
		[idMembro, idIgreja],
	);
	return true;
}

export async function adicionarMembroAEquipe(idEquipe: number, idMembro: number, idIgreja: number): Promise<boolean> {
	const [[eqRows], [memRows]] = await Promise.all([
		pool.execute<any[]>(`SELECT 1 FROM equipes WHERE id_equipes = ? AND id_igreja_fk = ?`, [idEquipe, idIgreja]),
		pool.execute<any[]>(`SELECT 1 FROM membros WHERE id_membro = ? AND id_igreja_fk = ?`, [idMembro, idIgreja]),
	]);
	if ((eqRows as any[]).length === 0 || (memRows as any[]).length === 0) return false;
	await pool.execute(
		`INSERT IGNORE INTO equipes_membros (id_membros_fk, id_equipes_fk) VALUES (?, ?)`,
		[idMembro, idEquipe],
	);
	return true;
}

export async function removerMembroDeEquipe(idEquipe: number, idMembro: number, idIgreja: number): Promise<boolean> {
	// Verifica que a equipe pertence à igreja antes de deletar
	const [eqRows] = await pool.execute<any[]>(
		`SELECT 1 FROM equipes WHERE id_equipes = ? AND id_igreja_fk = ?`,
		[idEquipe, idIgreja],
	);
	if ((eqRows as any[]).length === 0) return false;
	const [result] = await pool.execute<any>(
		`DELETE FROM equipes_membros WHERE id_equipes_fk = ? AND id_membros_fk = ?`,
		[idEquipe, idMembro],
	);
	return (result as any).affectedRows > 0;
}

export async function listarMembrosEquipe(idEquipe: number, idIgreja: number): Promise<Array<{ id: number; nome: string; email: string }>> {
	const [rows] = await pool.execute<any[]>(
		`SELECT m.id_membro AS id, m.nome, m.email
		 FROM membros m
		 JOIN equipes_membros em ON em.id_membros_fk = m.id_membro
		 JOIN equipes e ON e.id_equipes = em.id_equipes_fk
		 WHERE e.id_equipes = ? AND e.id_igreja_fk = ?
		 ORDER BY m.nome`,
		[idEquipe, idIgreja],
	);
	return rows as any[];
}

export async function listarMembrosMinisterio(idMinisterio: number, idIgreja: number): Promise<Array<{ id: number; nome: string; email: string }>> {
	const [rows] = await pool.execute<any[]>(
		`SELECT m.id_membro AS id, m.nome, m.email
		 FROM membros m
		 JOIN membros_ministerios mm ON mm.id_membro_fk = m.id_membro
		 JOIN ministerios mi ON mi.id_ministerio = mm.id_ministerio_fk
		 WHERE mi.id_ministerio = ? AND mi.id_igreja_fk = ?
		 ORDER BY m.nome`,
		[idMinisterio, idIgreja],
	);
	return rows as any[];
}

export async function listarMembrosEscala(idEscala: number, idIgreja: number): Promise<Array<{ id: number; nome: string; email: string; funcao: string | null; id_funcao_fk: number | null }>> {
	const [rows] = await pool.execute<any[]>(
		`SELECT m.id_membro AS id, m.nome, m.email,
		 me.id_funcao_fk AS id_funcao_fk,
		 COALESCE(f.nome, NULL) AS funcao
		 FROM membros m
		 JOIN membros_escalas me ON me.id_membro_fk = m.id_membro
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 LEFT JOIN funcoes f ON f.id_funcao = me.id_funcao_fk
		 WHERE e.id_escala = ? AND e.id_igreja_fk = ?
		 ORDER BY m.nome`,
		[idEscala, idIgreja],
	);
	return rows as any[];
}

export async function listarFuncoes(): Promise<Array<{ id: number; nome: string }>> {
	const [rows] = await pool.execute<any[]>(
		`SELECT id_funcao AS id, nome FROM funcoes ORDER BY nome`,
	);
	return rows as any[];
}

export async function funcaoExiste(idFuncao: number): Promise<boolean> {
	const [rows] = await pool.execute<any[]>(`SELECT 1 FROM funcoes WHERE id_funcao = ?`, [idFuncao]);
	return (rows as any[]).length > 0;
}

export async function atribuirFuncaoMembroEscala(
	idEscala: number,
	idMembro: number,
	idFuncao: number | null,
	idIgreja: number,
): Promise<boolean> {
	// MySQL: UPDATE com JOIN para verificar tenant
	const [result] = await pool.execute<any>(
		`UPDATE membros_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 SET me.id_funcao_fk = ?
		 WHERE me.id_escala_fk = ?
		   AND me.id_membro_fk = ?
		   AND e.id_igreja_fk = ?`,
		[idFuncao, idEscala, idMembro, idIgreja],
	);
	return (result as any).affectedRows > 0;
}

export async function membroJaEstaNaEscala(idEscala: number, idMembro: number, idIgreja: number): Promise<boolean> {
	const [rows] = await pool.execute<any[]>(
		`SELECT 1 FROM membros_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 WHERE me.id_escala_fk = ? AND me.id_membro_fk = ? AND e.id_igreja_fk = ?
		 LIMIT 1`,
		[idEscala, idMembro, idIgreja],
	);
	return (rows as any[]).length > 0;
}

export async function adicionarMembroAEscala(idEscala: number, idMembro: number, idIgreja: number): Promise<boolean> {
	const [[escRows], [memRows]] = await Promise.all([
		pool.execute<any[]>(`SELECT 1 FROM escalas WHERE id_escala = ? AND id_igreja_fk = ?`, [idEscala, idIgreja]),
		pool.execute<any[]>(`SELECT 1 FROM membros WHERE id_membro = ? AND id_igreja_fk = ?`, [idMembro, idIgreja]),
	]);
	if ((escRows as any[]).length === 0 || (memRows as any[]).length === 0) return false;
	await pool.execute(
		`INSERT INTO membros_escalas (id_escala_fk, id_membro_fk) VALUES (?, ?)`,
		[idEscala, idMembro],
	);
	return true;
}

export async function removerMembroDeEscala(idEscala: number, idMembro: number, idIgreja: number): Promise<boolean> {
	// MySQL não suporta DELETE...USING — usa JOIN
	const [result] = await pool.execute<any>(
		`DELETE me FROM membros_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 WHERE me.id_escala_fk = ?
		   AND me.id_membro_fk = ?
		   AND e.id_igreja_fk = ?`,
		[idEscala, idMembro, idIgreja],
	);
	return (result as any).affectedRows > 0;
}

export async function listarMusicasEscala(
	idEscala: number,
	idIgreja: number,
): Promise<Array<{
	id_music_escalas: string;
	nome: string;
	banda: string;
	ordem: number;
	tom: string;
	tom_original: string;
	image_id: string;
}>> {
	const [rows] = await pool.execute<any[]>(
		`SELECT
			CAST(me.id_musica_escala AS CHAR) AS id_music_escalas,
			m.nome                            AS nome,
			m.autor                           AS banda,
			COALESCE(me.ordem, 0)             AS ordem,
			COALESCE(me.tom, '')              AS tom,
			COALESCE(m.tom, '')               AS tom_original,
			COALESCE(m.img_id, '')            AS image_id
		 FROM musicas_escalas me
		 JOIN musicas m ON m.id_musica = me.id_musica_fk
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 WHERE me.id_escala_fk = ?
		   AND e.id_igreja_fk = ?
		 ORDER BY COALESCE(me.ordem, 0)`,
		[idEscala, idIgreja],
	);
	return rows as any[];
}

export async function musicaJaEstaNaEscala(idEscala: number, idMusica: number, idIgreja: number): Promise<boolean> {
	const [rows] = await pool.execute<any[]>(
		`SELECT 1 FROM musicas_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 WHERE me.id_escala_fk = ? AND me.id_musica_fk = ? AND e.id_igreja_fk = ?
		 LIMIT 1`,
		[idEscala, idMusica, idIgreja],
	);
	return (rows as any[]).length > 0;
}

export async function adicionarMusicaAEscala(idEscala: number, idMusica: number, idIgreja: number): Promise<boolean> {
	const [[escRows], [musRows]] = await Promise.all([
		pool.execute<any[]>(`SELECT 1 FROM escalas WHERE id_escala = ? AND id_igreja_fk = ?`, [idEscala, idIgreja]),
		pool.execute<any[]>(`SELECT 1 FROM musicas WHERE id_musica = ? AND id_igreja_fk = ?`, [idMusica, idIgreja]),
	]);
	if ((escRows as any[]).length === 0 || (musRows as any[]).length === 0) return false;
	await pool.execute(
		`INSERT INTO musicas_escalas (id_escala_fk, id_musica_fk) VALUES (?, ?)`,
		[idEscala, idMusica],
	);
	return true;
}

export async function removerMusicaDeEscala(idEscala: number, idMusicEscalas: number, idIgreja: number): Promise<boolean> {
	const [result] = await pool.execute<any>(
		`DELETE me FROM musicas_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 WHERE me.id_musica_escala = ?
		   AND me.id_escala_fk = ?
		   AND e.id_igreja_fk = ?`,
		[idMusicEscalas, idEscala, idIgreja],
	);
	return (result as any).affectedRows > 0;
}

export async function atualizarTomMusicaEscala(
	idEscala: number,
	idMusicaEscala: number,
	tom: string | null,
	idIgreja: number,
): Promise<boolean> {
	const [result] = await pool.execute<any>(
		`UPDATE musicas_escalas me
		 JOIN escalas e ON e.id_escala = me.id_escala_fk
		 SET me.tom = ?
		 WHERE me.id_musica_escala = ?
		   AND me.id_escala_fk = ?
		   AND e.id_igreja_fk = ?`,
		[tom || null, idMusicaEscala, idEscala, idIgreja],
	);
	return (result as any).affectedRows > 0;
}

type ListaConfig = {
	tabela: string;
	idColuna: string;
	campos: Record<string, string>;
	igreja?: boolean;
};

const LISTAS: Record<string, ListaConfig> = {
	ministerios: { tabela: "ministerios", idColuna: "id_ministerio", campos: { nome: "nome" }, igreja: true },
	equipes: { tabela: "equipes", idColuna: "id_equipes", campos: { nome: "title", imagem: "img_id" }, igreja: true },
	locais: { tabela: "logradouros", idColuna: "id_logradouro", campos: { nome: "rua", endereco: "numero" }, igreja: true },
	musicas: { tabela: "musicas", idColuna: "id_musica", campos: { nome: "nome", artista: "autor", tom: "tom", link: "link_youtube" }, igreja: true },
	escalas: { tabela: "escalas", idColuna: "id_escala", campos: { nome: "nome_escala", data: "data_hora", local: "local", descricao: "descricao" }, igreja: true },
	membros: { tabela: "membros", idColuna: "id_membro", campos: { nome: "nome", email: "email", cargo: "cargo", status: "status", senha: "senha" }, igreja: true },
	funcoes: { tabela: "funcoes", idColuna: "id_funcao", campos: { nome: "nome" }, igreja: true },
};

export function getListaConfig(lista: string): ListaConfig | null {
	return LISTAS[lista] ?? null;
}

export async function listarItens(lista: string, idIgreja: number): Promise<any[] | null> {
	const config = LISTAS[lista];
	if (!config) return null;

	// Para escalas, formata data_hora como "YYYY-MM-DDTHH:MM" (compatível com datetime-local)
	const colunas = Object.entries(config.campos).map(([campo, coluna]) => {
		if (lista === "escalas" && coluna === "data_hora") {
			return `DATE_FORMAT(data_hora, '%Y-%m-%dT%H:%i') AS \`${campo}\``;
		}
		return `${coluna} AS \`${campo}\``;
	});
	const condicoes: string[] = [];
	const params: any[] = [];

	if (config.igreja) {
		if (lista === "cargos") {
			condicoes.push(`(id_cargo = 1 OR id_igreja_fk = ?)`);
			params.push(idIgreja);
		} else {
			condicoes.push(`id_igreja_fk = ?`);
			params.push(idIgreja);
		}
	}

	const filtro = condicoes.length ? ` WHERE ${condicoes.join(" AND ")}` : "";
	const query = `SELECT ${config.idColuna} AS id, ${colunas.join(", ")} FROM ${config.tabela}${filtro} ORDER BY id`;
	const [rows] = await pool.execute<any[]>(query, params);
	return rows as any[];
}

export async function criarItem(lista: string, corpo: Record<string, unknown>, idIgreja: number): Promise<{ ok: boolean } | { error: string; status: number }> {
	const config = LISTAS[lista];
	if (!config) return { error: "Lista não encontrada", status: 404 };

	if (lista === "cargos" && corpo.id === "1") {
		return { error: "O Administrador não pode ser alterado.", status: 403 };
	}

	const colunas: string[] = [];
	const valores: any[] = [];

	for (const campo in config.campos) {
		if (campo in corpo) {
			colunas.push(config.campos[campo]);
			valores.push(corpo[campo] === "" ? null : corpo[campo]);
		}
	}

	// Escalas: data_hora NOT NULL
	if (lista === "escalas") {
		const dataIdx = colunas.indexOf("data_hora");
		if (dataIdx >= 0) {
			const raw = valores[dataIdx];
			if (!raw) {
				valores[dataIdx] = new Date().toISOString().slice(0, 19).replace("T", " ");
			} else {
				const parsed = new Date(String(raw));
				valores[dataIdx] = isNaN(parsed.getTime())
					? new Date().toISOString().slice(0, 19).replace("T", " ")
					: parsed.toISOString().slice(0, 19).replace("T", " ");
			}
		} else {
			colunas.push("data_hora");
			valores.push(new Date().toISOString().slice(0, 19).replace("T", " "));
		}
	}

	// Músicas: autor, tom, duracao NOT NULL
	if (lista === "musicas") {
		const autorIdx = colunas.indexOf("autor");
		if (autorIdx >= 0 && (valores[autorIdx] === null || valores[autorIdx] === undefined)) {
			valores[autorIdx] = "";
		} else if (!colunas.includes("autor")) {
			colunas.push("autor"); valores.push("");
		}
		const tomIdx = colunas.indexOf("tom");
		if (tomIdx >= 0 && (valores[tomIdx] === null || valores[tomIdx] === undefined)) {
			valores[tomIdx] = "";
		} else if (!colunas.includes("tom")) {
			colunas.push("tom"); valores.push("");
		}
		if (!colunas.includes("duracao")) {
			colunas.push("duracao"); valores.push("00:00:00");
		}
	}

	if (config.igreja) {
		colunas.push("id_igreja_fk");
		valores.push(idIgreja);
	}

	// Converte cargo textual para id_cargo_fk
	if (lista === "membros" && typeof corpo.cargo === "string") {
		const cargoIdx = colunas.indexOf("cargo");
		if (cargoIdx >= 0) {
			valores[cargoIdx] = corpo.cargo === "Administrador" ? 1 : null;
			colunas[cargoIdx] = "id_cargo_fk";
		}
	}

	// Hash da senha
	if (lista === "membros" && corpo.senha) {
		const senhaIdx = colunas.indexOf("senha");
		if (senhaIdx >= 0) {
			valores[senhaIdx] = await argon2.hash(String(corpo.senha), { type: argon2.argon2id });
		}
	}

	const placeholders = valores.map(() => "?").join(", ");
	const query = `INSERT INTO ${config.tabela} (${colunas.join(", ")}) VALUES (${placeholders})`;
	await pool.execute(query, valores);
	return { ok: true };
}

export async function atualizarItem(lista: string, id: string, corpo: Record<string, unknown>, idIgreja: number): Promise<{ ok: boolean } | { error: string; status: number }> {
	const config = LISTAS[lista];
	if (!config) return { error: "Lista não encontrada", status: 404 };

	if (lista === "cargos" && id === "1") {
		return { error: "O Administrador não pode ser alterado.", status: 403 };
	}

	const setClauses: string[] = [];
	const valores: any[] = [];

	for (const campo in config.campos) {
		if (campo in corpo) {
			const NOT_NULL_MUSICAS = ["autor", "tom"];
			const coluna = config.campos[campo];
			const valor =
				lista === "musicas" && NOT_NULL_MUSICAS.includes(coluna)
					? (corpo[campo] === "" ? "" : corpo[campo])
					: corpo[campo] === "" ? null : corpo[campo];
			setClauses.push(`${coluna} = ?`);
			valores.push(valor);
		}
	}

	// Escalas: converte data
	if (lista === "escalas") {
		const dataSetIdx = setClauses.findIndex((s) => s.startsWith("data_hora ="));
		if (dataSetIdx >= 0) {
			const raw = valores[dataSetIdx];
			if (!raw) {
				valores[dataSetIdx] = new Date().toISOString().slice(0, 19).replace("T", " ");
			} else {
				const parsed = new Date(String(raw));
				valores[dataSetIdx] = isNaN(parsed.getTime())
					? new Date().toISOString().slice(0, 19).replace("T", " ")
					: parsed.toISOString().slice(0, 19).replace("T", " ");
			}
		}
	}

	// Converte cargo textual para id_cargo_fk
	if (lista === "membros" && typeof corpo.cargo === "string") {
		const cargoSetIdx = setClauses.findIndex((s) => s.startsWith("cargo ="));
		if (cargoSetIdx >= 0) {
			setClauses[cargoSetIdx] = "id_cargo_fk = ?";
			valores[cargoSetIdx] = corpo.cargo === "Administrador" ? 1 : null;
		}
	}

	// Hash da senha
	if (lista === "membros" && corpo.senha) {
		const senhaSetIdx = setClauses.findIndex((s) => s.startsWith("senha ="));
		if (senhaSetIdx >= 0) {
			valores[senhaSetIdx] = await argon2.hash(String(corpo.senha), { type: argon2.argon2id });
		}
	}

	if (setClauses.length === 0) return { ok: true };

	const filtroPartes: string[] = [];
	const filtroParams: any[] = [];

	if (config.igreja) {
		if (lista === "cargos") {
			filtroPartes.push(`(id_cargo = 1 OR id_igreja_fk = ?)`);
			filtroParams.push(idIgreja);
		} else {
			filtroPartes.push(`id_igreja_fk = ?`);
			filtroParams.push(idIgreja);
		}
	}

	const filtro = filtroPartes.length ? ` AND ${filtroPartes.join(" AND ")}` : "";
	const query = `UPDATE ${config.tabela} SET ${setClauses.join(", ")} WHERE ${config.idColuna} = ?${filtro}`;
	const todosParams = [...valores, Number(id), ...filtroParams];
	await pool.execute(query, todosParams);
	return { ok: true };
}

export async function excluirItem(lista: string, id: string, idIgreja: number): Promise<{ ok: boolean } | { error: string; status: number }> {
	const config = LISTAS[lista];
	if (!config) return { error: "Lista não encontrada", status: 404 };

	if (lista === "cargos" && id === "1") {
		return { error: "O Administrador não pode ser alterado.", status: 403 };
	}

	const filtroPartes: string[] = [`${config.idColuna} = ?`];
	const params: any[] = [Number(id)];

	if (config.igreja) {
		if (lista === "cargos") {
			filtroPartes.push(`AND (id_cargo = 1 OR id_igreja_fk = ?)`);
			params.push(idIgreja);
		} else {
			filtroPartes.push(`AND id_igreja_fk = ?`);
			params.push(idIgreja);
		}
	}

	const query = `DELETE FROM ${config.tabela} WHERE ${filtroPartes.join(" ")}`;
	await pool.execute(query, params);
	return { ok: true };
}

// ── Lembretes ───────────────────────────────────────────────────

export async function listarLembretes(idIgreja: number): Promise<Array<{
	id_lembrete: string; name: string; date: string; tempo: string; description: string; functions: string[];
}>> {
	const [[lemRows], [funcRows]] = await Promise.all([
		pool.execute<any[]>(
			`SELECT CAST(id_lembrete AS CHAR) AS id_lembrete, nome AS name, data AS date, tempo AS tempo, descricao AS description
			 FROM lembretes WHERE id_igreja_fk = ? ORDER BY data, tempo`,
			[idIgreja],
		),
		pool.execute<any[]>(
			`SELECT CAST(lf.id_lembrete_fk AS CHAR) AS id_lembrete, f.nome AS nome
			 FROM lembrete_funcoes lf
			 JOIN funcoes f ON f.id_funcao = lf.id_funcao_fk
			 JOIN lembretes l ON l.id_lembrete = lf.id_lembrete_fk
			 WHERE l.id_igreja_fk = ?`,
			[idIgreja],
		),
	]);

	const funcsById = new Map<string, string[]>();
	for (const r of funcRows as any[]) {
		const key = String(r.id_lembrete);
		let arr = funcsById.get(key);
		if (!arr) { arr = []; funcsById.set(key, arr); }
		arr.push(r.nome);
	}

	return (lemRows as any[]).map((r) => ({
		id_lembrete: r.id_lembrete,
		name: r.name,
		date: formatDate(new Date(r.date)),
		tempo: String(r.tempo).slice(0, 5),
		description: r.description ?? "",
		functions: funcsById.get(r.id_lembrete) ?? [],
	}));
}

export async function criarLembrete(
	dados: { nome: string; data: string; tempo: string; descricao?: string | null; funcoes?: number[] },
	idIgreja: number,
): Promise<{ id_lembrete: string }> {
	const [result] = await pool.execute<any>(
		`INSERT INTO lembretes (nome, data, tempo, descricao, id_igreja_fk) VALUES (?, ?, ?, ?, ?)`,
		[dados.nome, dados.data, dados.tempo, dados.descricao ?? null, idIgreja],
	);
	const idLembrete = Number((result as any).insertId);

	if (dados.funcoes && dados.funcoes.length > 0) {
		for (const idFuncao of dados.funcoes) {
			await pool.execute(
				`INSERT INTO lembrete_funcoes (id_lembrete_fk, id_funcao_fk) VALUES (?, ?)`,
				[idLembrete, idFuncao],
			);
		}
	}

	return { id_lembrete: String(idLembrete) };
}

export async function atualizarLembrete(
	idLembrete: number,
	dados: { nome: string; data: string; tempo: string; descricao?: string | null; funcoes?: number[] },
	idIgreja: number,
): Promise<boolean> {
	const [result] = await pool.execute<any>(
		`UPDATE lembretes SET nome = ?, data = ?, tempo = ?, descricao = ? WHERE id_lembrete = ? AND id_igreja_fk = ?`,
		[dados.nome, dados.data, dados.tempo, dados.descricao ?? null, idLembrete, idIgreja],
	);
	if ((result as any).affectedRows === 0) return false;

	await pool.execute(`DELETE FROM lembrete_funcoes WHERE id_lembrete_fk = ?`, [idLembrete]);
	if (dados.funcoes && dados.funcoes.length > 0) {
		for (const idFuncao of dados.funcoes) {
			await pool.execute(
				`INSERT INTO lembrete_funcoes (id_lembrete_fk, id_funcao_fk) VALUES (?, ?)`,
				[idLembrete, idFuncao],
			);
		}
	}
	return true;
}

export async function removerLembrete(idLembrete: number, idIgreja: number): Promise<boolean> {
	const [result] = await pool.execute<any>(
		`DELETE FROM lembretes WHERE id_lembrete = ? AND id_igreja_fk = ?`,
		[idLembrete, idIgreja],
	);
	return (result as any).affectedRows > 0;
}

export async function obterLembrete(idLembrete: number, idIgreja: number): Promise<{
	id_lembrete: string; name: string; date: string; tempo: string; description: string; functions: string[];
} | null> {
	const [[lemRows], [funcRows]] = await Promise.all([
		pool.execute<any[]>(
			`SELECT CAST(id_lembrete AS CHAR) AS id_lembrete, nome AS name, data AS date, tempo AS tempo, descricao AS description
			 FROM lembretes WHERE id_lembrete = ? AND id_igreja_fk = ?`,
			[idLembrete, idIgreja],
		),
		pool.execute<any[]>(
			`SELECT f.nome FROM lembrete_funcoes lf JOIN funcoes f ON f.id_funcao = lf.id_funcao_fk WHERE lf.id_lembrete_fk = ?`,
			[idLembrete],
		),
	]);

	if ((lemRows as any[]).length === 0) return null;
	const l = (lemRows as any[])[0];
	return {
		id_lembrete: l.id_lembrete,
		name: l.name,
		date: formatDate(new Date(l.date)),
		tempo: String(l.tempo).slice(0, 5),
		description: l.description ?? "",
		functions: (funcRows as any[]).map((r) => r.nome),
	};
}

// ── Notificações ────────────────────────────────────────────────

export async function obterEscalaInfo(
	idEscala: number,
	idIgreja: number,
): Promise<{ id_escala: string; nome_escala: string; data_hora: Date } | null> {
	const [rows] = await pool.execute<any[]>(
		`SELECT CAST(id_escala AS CHAR) AS id_escala, nome_escala, data_hora
		 FROM escalas WHERE id_escala = ? AND id_igreja_fk = ?`,
		[idEscala, idIgreja],
	);
	return (rows as any[])[0] ?? null;
}

export async function criarNotificacao(
	idMembro: number,
	idIgreja: number,
	titulo: string,
	conteudo: string | null,
	data: Date,
): Promise<{ id_notificacao: string }> {
	const dataStr = data.toISOString().slice(0, 10);
	const [result] = await pool.execute<any>(
		`INSERT INTO notificacoes (id_membro_fk, id_igreja_fk, titulo, conteudo, data) VALUES (?, ?, ?, ?, ?)`,
		[idMembro, idIgreja, titulo, conteudo ?? null, dataStr],
	);
	return { id_notificacao: String((result as any).insertId) };
}

export async function obterMembroNome(idMembro: number, idIgreja: number): Promise<string | null> {
	const [rows] = await pool.execute<any[]>(
		`SELECT nome FROM membros WHERE id_membro = ? AND id_igreja_fk = ?`,
		[idMembro, idIgreja],
	);
	return (rows as any[])[0]?.nome ?? null;
}

export async function obterFuncaoNome(idFuncao: number): Promise<string | null> {
	const [rows] = await pool.execute<any[]>(
		`SELECT nome FROM funcoes WHERE id_funcao = ?`,
		[idFuncao],
	);
	return (rows as any[])[0]?.nome ?? null;
}
