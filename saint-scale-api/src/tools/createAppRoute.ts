import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import type { JWTPayload } from "jose";
import { notFound, onError } from "stoker/middlewares";
import { configureOpenApi } from "./configureApp.js";

export type AppEnv = {
	Variables: {
		jwtPayload: JWTPayload;
		id_igreja: number;
		idCargoFk?: number | null;
		permissoes?: string[] | null;
	};
};

export function createApp() {
	const app = new OpenAPIHono<AppEnv>();

	app.onError(onError);
	app.notFound(notFound);

	// CORS_ORIGIN em .env: "*" para dev/mobile, ou domínio específico para produção web.
	// Apps React Native nativos não enviam Origin, então qualquer valor funciona para eles.
	const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:8081";
	app.use(
		"*",
		cors({
			origin: corsOrigin,
		}),
	);

	// Normaliza trailing slash: POST /api/user/ → 308 → POST /api/user
	// Preserva método e corpo (308). fetch segue redirecionamento 308 automaticamente.
	app.use("*", async (c, next) => {
		const url = new URL(c.req.url);
		if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
			url.pathname = url.pathname.slice(0, -1);
			return c.redirect(url.toString(), 308);
		}
		await next();
	});

	configureOpenApi(app);

	return app;
}

export function createRouter() {
	return new OpenAPIHono<AppEnv>();
}
