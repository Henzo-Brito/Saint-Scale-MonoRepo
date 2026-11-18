import { pool } from "../../db/index.js";

function formatDate(d: Date): string {
	return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export const alertDao = {
	// GET /alert/reminder
	async getReminder(idMembro: number, idIgreja: number) {
		const [[alertRows], [notifRows]] = await Promise.all([
			pool.execute<any[]>(
				`SELECT
					CAST(l.id_lembrete AS CHAR) AS id_lembrete,
					l.nome                      AS name,
					l.data                      AS date,
					GROUP_CONCAT(f.nome ORDER BY f.nome SEPARATOR ',') AS functions
				FROM lembretes l
				LEFT JOIN lembrete_funcoes lf ON lf.id_lembrete_fk = l.id_lembrete
				LEFT JOIN funcoes f ON f.id_funcao = lf.id_funcao_fk
				WHERE l.id_igreja_fk = ?
				GROUP BY l.id_lembrete, l.nome, l.data
				ORDER BY l.data`,
				[idIgreja],
			),
			pool.execute<any[]>(
				`SELECT
					CAST(id_notificacao AS CHAR) AS id_notification,
					titulo                       AS title,
					conteudo                     AS conteudo,
					data                         AS date
				FROM notificacoes
				WHERE id_membro_fk = ?
				ORDER BY data`,
				[idMembro],
			),
		]);

		return {
			alert: (alertRows as any[]).map((r) => ({
				id_lembrete: r.id_lembrete,
				name: r.name,
				date: formatDate(new Date(r.date)),
				// GROUP_CONCAT retorna string ou null — split e filtra vazios
				functions: r.functions
					? (r.functions as string).split(",").filter(Boolean)
					: [],
			})),
			notifications: (notifRows as any[]).map((r) => ({
				id_notification: r.id_notification,
				title: r.title,
				conteudo: r.conteudo ?? null,
				date: formatDate(new Date(r.date)),
			})),
		};
	},

	// GET /alert/reminder/{id_reminder}
	async getReminderDetail(idReminder: number, idIgreja: number) {
		const [[lemRows], [funcRows]] = await Promise.all([
			pool.execute<any[]>(
				`SELECT
					CAST(id_lembrete AS CHAR) AS id_lembrete,
					nome                      AS name,
					data                      AS date,
					tempo                     AS tempo,
					descricao                 AS description
				FROM lembretes
				WHERE id_lembrete = ?
				  AND id_igreja_fk = ?`,
				[idReminder, idIgreja],
			),
			pool.execute<any[]>(
				`SELECT f.nome
				FROM lembrete_funcoes lf
				JOIN funcoes f ON f.id_funcao = lf.id_funcao_fk
				WHERE lf.id_lembrete_fk = ?`,
				[idReminder],
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
	},
};
