import { pool } from "../../db/index.js";

export const SignInDAO = {
	async findUserByLogin(login: string) {
		const [rows] = await pool.execute<any[]>(
			`SELECT
				id_membro     AS id_member,
				email,
				senha         AS password,
				cargo         AS role,
				status,
				id_igreja_fk  AS id_igreja
			FROM membros
			WHERE email = ? OR usuario = ?
			LIMIT 1`,
			[login, login],
		);

		return (rows as any[])[0] ?? null;
	},
};
