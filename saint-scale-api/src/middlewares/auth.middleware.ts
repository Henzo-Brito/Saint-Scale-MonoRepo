import type { Context, Next } from "hono";
import { jwtVerify } from "jose";
import { pool } from "../db/index.js";
import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
	throw new Error("JWT_SECRET não está configurado");
}

const secret = new TextEncoder().encode(jwtSecret);

export const authMiddleware = async (c: Context, next: Next) => {
	const authorization = c.req.header("Authorization");

	if (!authorization) {
		return c.json({ message: "Token não informado" }, 401);
	}

	const [type, token] = authorization.split(" ");

	if (type !== "Bearer" || !token) {
		return c.json({ message: "Token inválido" }, 401);
	}

	try {
		const { payload } = await jwtVerify(token, secret);

		const idMember = Number((payload as { sub?: string }).sub);
		if (!idMember) {
			return c.json({ message: "Token inválido" }, 401);
		}

		// C5 — verificar status do membro no banco a cada requisição protegida
		const [rows] = await pool.execute<any[]>(
			`SELECT status, id_igreja_fk FROM membros WHERE id_membro = ? LIMIT 1`,
			[idMember],
		);

		const membro = (rows as any[])[0];
		if (!membro) {
			return c.json({ message: "Membro não encontrado" }, 401);
		}

		if (membro.status !== "aprovado") {
			return c.json({ message: "Acesso não autorizado" }, 401);
		}

		c.set("jwtPayload", payload);
		c.set("id_igreja", membro.id_igreja_fk);

		await next();
	} catch {
		return c.json({ message: "Token inválido ou expirado" }, 401);
	}
};
