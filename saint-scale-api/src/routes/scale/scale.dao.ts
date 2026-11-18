import { pool } from "../../db/index.js";

const DAYS_OF_WEEK = [
	"domingo", "segunda-feira", "terça-feira", "quarta-feira",
	"quinta-feira", "sexta-feira", "sábado",
];

function formatDate(d: Date): string {
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export const scaleDao = {
	// GET /scale/{id}
	async getScale(id: string, idIgreja: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT CAST(id_escala AS CHAR) AS id_escala, nome_escala AS nome, data_hora
			 FROM escalas
			 WHERE id_escala = ?
			   AND id_igreja_fk = ?`,
			[id, idIgreja],
		);

		if ((rows as any[]).length === 0) return null;
		const r = (rows as any[])[0];
		const d = new Date(r.data_hora);

		return {
			id_escala: r.id_escala,
			nome: r.nome,
			dia: String(d.getDate()).padStart(2, "0"),
			dia_da_semana: DAYS_OF_WEEK[d.getDay()],
			data: formatDate(d),
		};
	},

	// GET /scale/{id}/musics
	async getScaleMusics(id: string, idIgreja: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(me.id_musica_escala AS CHAR)  AS id_music_escalas,
				m.nome                             AS nome,
				m.autor                            AS banda,
				COALESCE(me.ordem, 0)              AS ordem,
				COALESCE(me.tom, m.tom, '')        AS tom,
				COALESCE(m.img_id, '')             AS image_id
			FROM musicas_escalas me
			JOIN musicas m ON m.id_musica = me.id_musica_fk
			JOIN escalas e ON e.id_escala = me.id_escala_fk
			WHERE me.id_escala_fk = ?
			  AND e.id_igreja_fk = ?
			ORDER BY COALESCE(me.ordem, 0)`,
			[id, idIgreja],
		);

		return (rows as any[]).map((r) => ({
			id_music_escalas: r.id_music_escalas,
			nome: r.nome,
			banda: r.banda,
			ordem: r.ordem,
			tom: r.tom,
			image_id: r.image_id,
		}));
	},

	// GET /scale/{id}/music/{id_music_escalas}
	async getScaleMusicDetail(id: string, idMusicEscalas: string, idIgreja: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(m.id_musica AS CHAR)       AS id_musica,
				m.nome                          AS nome,
				m.autor                         AS autor,
				COALESCE(me.tom, '')            AS tom_atual,
				COALESCE(m.tom, '')             AS tom_original,
				m.bpm                           AS bpm,
				COALESCE(me.ordem, 0)           AS ordem,
				COALESCE(m.link_spotify, '')    AS link_spotify,
				COALESCE(m.link_youtube, '')    AS link_youtube,
				COALESCE(m.link_cifra, '')      AS link_cifra,
				COALESCE(m.link_letra, '')      AS link_letra,
				m.duracao                       AS duracao,
				COALESCE(m.img_id, '')          AS img_id
			FROM musicas_escalas me
			JOIN musicas m ON m.id_musica = me.id_musica_fk
			JOIN escalas e ON e.id_escala = me.id_escala_fk
			WHERE me.id_escala_fk = ?
			  AND me.id_musica_escala = ?
			  AND e.id_igreja_fk = ?`,
			[id, idMusicEscalas, idIgreja],
		);

		if ((rows as any[]).length === 0) return null;
		const r = (rows as any[])[0];
		return {
			id_musica: r.id_musica,
			nome: r.nome,
			autor: r.autor,
			tom_atual: r.tom_atual,
			tom_original: r.tom_original,
			bpm: r.bpm ?? null,
			ordem: r.ordem,
			link_spotify: r.link_spotify,
			link_youtube: r.link_youtube,
			link_cifra: r.link_cifra,
			link_letra: r.link_letra,
			duracao: r.duracao,
			img_id: r.img_id,
		};
	},

	// GET /music/{id_music_escalas}
	async getMusicByEscalaId(idMusicEscalas: string, idIgreja: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(m.id_musica AS CHAR)       AS id_musica,
				m.nome                          AS nome,
				m.autor                         AS autor,
				COALESCE(me.tom, '')            AS tom_atual,
				COALESCE(m.tom, '')             AS tom_original,
				m.bpm                           AS bpm,
				COALESCE(me.ordem, 0)           AS ordem,
				COALESCE(m.link_spotify, '')    AS link_spotify,
				COALESCE(m.link_youtube, '')    AS link_youtube,
				COALESCE(m.link_cifra, '')      AS link_cifra,
				COALESCE(m.link_letra, '')      AS link_letra,
				m.duracao                       AS duracao,
				COALESCE(m.img_id, '')          AS img_id
			FROM musicas_escalas me
			JOIN musicas m ON m.id_musica = me.id_musica_fk
			JOIN escalas e ON e.id_escala = me.id_escala_fk
			WHERE me.id_musica_escala = ?
			  AND e.id_igreja_fk = ?`,
			[idMusicEscalas, idIgreja],
		);

		if ((rows as any[]).length === 0) return null;
		const r = (rows as any[])[0];
		return {
			id_musica: r.id_musica,
			nome: r.nome,
			autor: r.autor,
			tom_atual: r.tom_atual,
			tom_original: r.tom_original,
			bpm: r.bpm ?? null,
			ordem: r.ordem,
			link_spotify: r.link_spotify,
			link_youtube: r.link_youtube,
			link_cifra: r.link_cifra,
			link_letra: r.link_letra,
			duracao: r.duracao,
			img_id: r.img_id,
		};
	},

	// GET /scale/{id}/info
	async getScaleInfo(id: string, idIgreja: number, idMembro: number) {
		const [scaleRows] = await pool.execute<any[]>(
			`SELECT
				CAST(e.id_escala AS CHAR) AS id_escala,
				e.local                   AS local,
				COUNT(CASE WHEN me.disponibilidade = 'confirmado' THEN 1 END) AS membros_confirmados
			FROM escalas e
			LEFT JOIN membros_escalas me ON me.id_escala_fk = e.id_escala
			WHERE e.id_escala = ?
			  AND e.id_igreja_fk = ?
			GROUP BY e.id_escala, e.local`,
			[id, idIgreja],
		);

		if ((scaleRows as any[]).length === 0) return null;

		const [minhaDispRows] = await pool.execute<any[]>(
			`SELECT disponibilidade FROM membros_escalas
			 WHERE id_escala_fk = ? AND id_membro_fk = ?
			 LIMIT 1`,
			[id, idMembro],
		);

		const [indispRows] = await pool.execute<any[]>(
			`SELECT
				COALESCE(m.img_id, '') AS image_id,
				m.nome                 AS name,
				COALESCE(f.nome, '')   AS funcao
			FROM membros_escalas me
			JOIN membros m ON m.id_membro = me.id_membro_fk
			LEFT JOIN funcoes f ON f.id_funcao = me.id_funcao_fk
			WHERE me.id_escala_fk = ?
			  AND me.disponibilidade = 'indisponível'`,
			[id],
		);

		const row = (scaleRows as any[])[0];
		return {
			id_escala: row.id_escala,
			membros_confirmados: Number(row.membros_confirmados),
			local: row.local ?? null,
			minha_disponibilidade: (minhaDispRows as any[])[0]?.disponibilidade ?? null,
			indisponibilidades: (indispRows as any[]).map((i) => ({
				image_id: i.image_id,
				name: i.name,
				funcao: i.funcao,
			})),
		};
	},

	// GET /scale/{id}/members
	async getScaleMembers(id: string, idIgreja: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(me.id_membro_escala AS CHAR) AS id_membro_escala,
				m.nome                            AS nome,
				COALESCE(f.nome, '')              AS funcao,
				me.disponibilidade                AS disponibilidade,
				COALESCE(m.img_id, '')            AS image_id
			FROM membros_escalas me
			JOIN membros m ON m.id_membro = me.id_membro_fk
			LEFT JOIN funcoes f ON f.id_funcao = me.id_funcao_fk
			JOIN escalas e ON e.id_escala = me.id_escala_fk
			WHERE me.id_escala_fk = ?
			  AND e.id_igreja_fk = ?
			ORDER BY m.nome`,
			[id, idIgreja],
		);

		return (rows as any[]).map((r) => ({
			id_membro_escala: r.id_membro_escala,
			nome: r.nome,
			funcao: r.funcao,
			disponibilidade: r.disponibilidade,
			image_id: r.image_id,
		}));
	},

	// POST /scale/sair
	async sair(idEscala: string, idMembro: string, idIgreja: number): Promise<boolean> {
		// MySQL não suporta UPDATE com subquery correlacionada da mesma forma
		// Usamos JOIN no UPDATE para verificar o tenant
		const [result] = await pool.execute<any>(
			`UPDATE membros_escalas me
			 JOIN escalas e ON e.id_escala = me.id_escala_fk
			 SET me.disponibilidade = 'indisponível'
			 WHERE me.id_escala_fk = ?
			   AND me.id_membro_fk = ?
			   AND e.id_igreja_fk = ?`,
			[idEscala, idMembro, idIgreja],
		);
		return (result as any).affectedRows > 0;
	},

	// POST /scale/confirmar
	async confirmar(idEscala: string, idMembro: string, idIgreja: number): Promise<boolean> {
		const [result] = await pool.execute<any>(
			`UPDATE membros_escalas me
			 JOIN escalas e ON e.id_escala = me.id_escala_fk
			 SET me.disponibilidade = 'confirmado'
			 WHERE me.id_escala_fk = ?
			   AND me.id_membro_fk = ?
			   AND e.id_igreja_fk = ?`,
			[idEscala, idMembro, idIgreja],
		);
		return (result as any).affectedRows > 0;
	},

	// POST /scale/substituir
	async substituir(idMembroEscala: string, idMembroAtual: string, idIgreja: number) {
		const [lookupRows] = await pool.execute<any[]>(
			`SELECT me.id_escala_fk
			 FROM membros_escalas me
			 JOIN escalas e ON e.id_escala = me.id_escala_fk
			 WHERE me.id_membro_escala = ?
			   AND e.id_igreja_fk = ?`,
			[idMembroEscala, idIgreja],
		);

		if ((lookupRows as any[]).length === 0) return null;
		const idEscala = (lookupRows as any[])[0].id_escala_fk;

		await pool.execute(
			`UPDATE membros_escalas
			 SET id_membro_fk = ?, disponibilidade = 'confirmado'
			 WHERE id_membro_escala = ?`,
			[idMembroAtual, idMembroEscala],
		);

		return scaleDao.getScaleMembers(String(idEscala), idIgreja);
	},
};
