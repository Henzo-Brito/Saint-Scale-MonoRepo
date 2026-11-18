import { z } from "@hono/zod-openapi";

export const SignInSchema = z
	.object({
		email: z.string().email().optional(),
		login: z.string().min(1).max(255).optional(),
		password: z.string().min(8).max(255),
	})
	.refine((data) => data.email || data.login, {
		message: "email ou login é obrigatório",
		path: ["email"],
	})
	.openapi("SignIn");

export const JWTSchema = z
	.object({
		accessToken: z.string(),
		tokenType: z.literal("Bearer"),
	})
	.openapi("JWT");

export const UNAUTHORIZEDSchema = z
	.object({
		message: z.string(),
	})
	.openapi("Unauthorized");

export type SignIn = z.infer<typeof SignInSchema>;
export type JWT = z.infer<typeof JWTSchema>;
export type UNAUTHORIZED = z.infer<typeof UNAUTHORIZEDSchema>;
