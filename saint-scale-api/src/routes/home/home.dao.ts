import { pool } from "../../db/index.js";

const MONTH_MAP: Record<string, number> = {
	janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
	julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

function formatDate(d: Date): string {
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatDateTime(d: Date): string {
	return `${formatDate(d)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

export const homeDao = {
	// GET /home/month/{mes}
	async getMonth(mes: string, idIgreja: number) {
		const month = MONTH_MAP[mes];
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(id_escala AS CHAR) AS id_escala,
				data_hora               AS dia
			FROM escalas
			WHERE MONTH(data_hora) = ?
			  AND id_igreja_fk = ?
			ORDER BY data_hora`,
			[month, idIgreja],
		);

		return (rows as any[]).map((r) => ({
			id_escala: r.id_escala,
			dia: formatDate(new Date(r.dia)),
		}));
	},

	// GET /home/unavailability/{mes}
	async getUnavailability(mes: string, idIgreja: number) {
		const month = MONTH_MAP[mes];
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(e.id_escala AS CHAR) AS id_escala,
				m.nome                    AS nome,
				f.nome                    AS funcao,
				COALESCE(m.img_id, '')    AS img_id,
				e.data_hora               AS dia
			FROM membros_escalas me
			JOIN escalas  e ON e.id_escala = me.id_escala_fk
			JOIN membros  m ON m.id_membro = me.id_membro_fk
			LEFT JOIN funcoes f ON f.id_funcao = me.id_funcao_fk
			WHERE MONTH(e.data_hora) = ?
			  AND m.id_igreja_fk = ?
			  AND me.disponibilidade <> 'confirmado'
			ORDER BY e.data_hora`,
			[month, idIgreja],
		);

		return (rows as any[]).map((r) => ({
			id_escala: r.id_escala,
			nome: r.nome,
			funcao: r.funcao ?? "",
			img_id: r.img_id,
			dia: formatDate(new Date(r.dia)),
		}));
	},

	// GET /home/scale/{my_id}
	async getScale(myId: number) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(e.id_escala AS CHAR) AS id_escala,
				e.nome_escala             AS title_scale,
				e.data_hora               AS data_hora,
				f.nome                    AS funcao,
				COUNT(CASE WHEN me2.disponibilidade = 'confirmado' THEN 1 END) AS confirmados,
				(SELECT COUNT(*) FROM musicas_escalas WHERE id_escala_fk = e.id_escala) AS quant_music
			FROM membros_escalas me
			JOIN escalas e ON e.id_escala = me.id_escala_fk
			LEFT JOIN funcoes f ON f.id_funcao = me.id_funcao_fk
			LEFT JOIN membros_escalas me2 ON me2.id_escala_fk = e.id_escala
			WHERE me.id_membro_fk = ?
			GROUP BY e.id_escala, e.nome_escala, e.data_hora, f.nome
			ORDER BY e.data_hora`,
			[myId],
		);

		const result = await Promise.all(
			(rows as any[]).map(async (r) => {
				const [imgs] = await pool.execute<any[]>(
					`SELECT COALESCE(m.img_id, '') AS img_id
					FROM membros_escalas me
					JOIN membros m ON m.id_membro = me.id_membro_fk
					WHERE me.id_escala_fk = ?
					  AND me.disponibilidade = 'confirmado'`,
					[r.id_escala],
				);

				return {
					id_escala: r.id_escala,
					confirmados: Number(r.confirmados),
					title_scale: r.title_scale,
					funcao: r.funcao ?? "",
					img_id: (imgs as any[]).map((i) => i.img_id),
					quant_music: Number(r.quant_music),
					data_hora: formatDateTime(new Date(r.data_hora)),
					dia: formatDate(new Date(r.data_hora)),
				};
			}),
		);

		return result;
	},

	// GET /home/scale/day/{day}  ex: "14112026" (DDMMYYYY)
	async getScaleDay(day: string, idIgreja: number) {
		const dd = day.slice(0, 2);
		const mm = day.slice(2, 4);
		const yyyy = day.slice(4, 8);
		const isoDay = `${yyyy}-${mm}-${dd}`;

		const [rows] = await pool.execute<any[]>(
			`SELECT
				CAST(e.id_escala AS CHAR)  AS id_escala,
				e.nome_escala              AS nome_escala,
				e.data_hora                AS data_hora,
				COUNT(CASE WHEN me.disponibilidade = 'confirmado' THEN 1 END) AS confirmados,
				(SELECT COUNT(*) FROM musicas_escalas WHERE id_escala_fk = e.id_escala) AS quant_music
			FROM escalas e
			LEFT JOIN membros_escalas me ON me.id_escala_fk = e.id_escala
			WHERE DATE(e.data_hora) = ?
			  AND e.id_igreja_fk = ?
			GROUP BY e.id_escala, e.nome_escala, e.data_hora
			ORDER BY e.data_hora`,
			[isoDay, idIgreja],
		);

		const result = await Promise.all(
			(rows as any[]).map(async (r) => {
				const [imgs] = await pool.execute<any[]>(
					`SELECT COALESCE(m.img_id, '') AS img_id
					FROM membros_escalas me
					JOIN membros m ON m.id_membro = me.id_membro_fk
					WHERE me.id_escala_fk = ?
					  AND me.disponibilidade = 'confirmado'`,
					[r.id_escala],
				);

				return {
					id_escala: r.id_escala,
					confirmados: Number(r.confirmados),
					nome_escala: r.nome_escala,
					img_id: (imgs as any[]).map((i) => i.img_id),
					quant_music: Number(r.quant_music),
					data_hora: formatDateTime(new Date(r.data_hora)),
					dia: formatDate(new Date(r.data_hora)),
				};
			}),
		);

		return result;
	},
};
