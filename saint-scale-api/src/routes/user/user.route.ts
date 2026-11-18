import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "stoker/http-status-codes";

import {
	AlterBirthdaySchema,
	AlterEmailSchema,
	AlterLogradouroSchema,
	AlterTelephoneSchema,
	CreateUserSchema,
	ForgotPasswordSchema,
	MeSchema,
	PasswordResetRequestSchema,
	PatchResponseSchema,
	UserPublicSchema,
} from "../../schemas/user.schemas.js";

const SECURITY = [{ bearerAuth: [] }];
const NOT_FOUND = {
	content: {
		"application/json": { schema: z.object({ message: z.string() }) },
	},
	description: "Membro não encontrado",
} as const;
const UNAUTHORIZED = {
	content: {
		"application/json": { schema: z.object({ message: z.string() }) },
	},
	description: "Token ausente ou inválido",
} as const;

// ── POST / ─────────────────────────────────────────────────────

export const createUser = createRoute({
	method: "post",
	path: "/",
	tags: ["User"],
	request: {
		body: {
			content: { "application/json": { schema: CreateUserSchema } },
			description:
				"Dados do novo membro. usuario é opcional. birth_date em YYYY-MM-DD, telephone apenas dígitos (máx 11). A igreja de destino é definida automaticamente pelo backend (igreja padrão de teste).",
		},
	},
	responses: {
		[HttpStatusCode.CREATED]: {
			content: { "application/json": { schema: UserPublicSchema } },
			description: "Membro criado. A senha nunca é retornada.",
		},
		[HttpStatusCode.BAD_REQUEST]: {
			content: {
				"application/json": { schema: z.object({ message: z.string() }) },
			},
			description: "Código de entrada inválido, e-mail/usuário duplicado ou dados ausentes.",
		},
	},
});

// ── GET / ───────────────────────────────────────────────────────

export const getUsers = createRoute({
	method: "get",
	path: "/",
	tags: ["User"],
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: z.array(UserPublicSchema) } },
			description: "Lista todos os membros. A senha nunca é retornada.",
		},
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── GET /me ─────────────────────────────────────────────────────

export const getMe = createRoute({
	method: "get",
	path: "/me",
	tags: ["User"],
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: MeSchema } },
			description: "Perfil completo do membro autenticado (via JWT).",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── PATCH /alterEmail ───────────────────────────────────────────

export const alterEmail = createRoute({
	method: "patch",
	path: "/alterEmail",
	tags: ["User"],
	security: SECURITY,
	request: {
		body: { content: { "application/json": { schema: AlterEmailSchema } } },
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "E-mail atualizado.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.CONFLICT]: {
			content: {
				"application/json": { schema: z.object({ message: z.string() }) },
			},
			description: "E-mail já está em uso por outro membro.",
		},
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── POST /request-password-reset ────────────────────────────────
// Público: solicita token de redefinição de senha por email.

export const requestPasswordReset = createRoute({
	method: "post",
	path: "/request-password-reset",
	tags: ["User"],
	request: {
		body: {
			content: { "application/json": { schema: PasswordResetRequestSchema } },
			description: "Email do membro para solicitar redefinição de senha.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "Token enviado por email (ou exposto em desenvolvimento).",
		},
	},
});

// ── PATCH /forgotPassword ───────────────────────────────────────
// Público: identifica o membro pelo email + token de recuperação.

export const forgotPassword = createRoute({
	method: "patch",
	path: "/forgotPassword",
	tags: ["User"],
	request: {
		body: {
			content: { "application/json": { schema: ForgotPasswordSchema } },
			description: "Email + nova senha. Não requer autenticação.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "Senha atualizada.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.FORBIDDEN]: {
			content: {
				"application/json": { schema: z.object({ message: z.string() }) },
			},
			description:
				"Recuperação de senha requer token de validação (não implementado).",
		},
	},
});

// ── PATCH /alterLogradouro ──────────────────────────────────────
// Recebe rua+numero; faz upsert internamente no backend.

export const alterLogradouro = createRoute({
	method: "patch",
	path: "/alterLogradouro",
	tags: ["User"],
	security: SECURITY,
	request: {
		body: {
			content: { "application/json": { schema: AlterLogradouroSchema } },
			description:
				"Rua e número do novo endereço. O backend cria ou reutiliza o logradouro.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "Endereço atualizado.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── PATCH /alterBirthday ────────────────────────────────────────

export const alterBirthday = createRoute({
	method: "patch",
	path: "/alterBirthday",
	tags: ["User"],
	security: SECURITY,
	request: {
		body: {
			content: { "application/json": { schema: AlterBirthdaySchema } },
			description: "Data de nascimento em YYYY-MM-DD.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "Data de nascimento atualizada.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── PATCH /alterTelephone ───────────────────────────────────────

export const alterTelephone = createRoute({
	method: "patch",
	path: "/alterTelephone",
	tags: ["User"],
	security: SECURITY,
	request: {
		body: {
			content: { "application/json": { schema: AlterTelephoneSchema } },
			description: "Telefone com apenas dígitos, máx 11 chars.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: PatchResponseSchema } },
			description: "Telefone atualizado.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── GET /funcoes ────────────────────────────────────────────────

export const getFuncoes = createRoute({
	method: "get",
	path: "/funcoes",
	tags: ["User"],
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": {
					schema: z.array(z.object({ id: z.number().int(), nome: z.string() })),
				},
			},
			description: "Funções disponíveis na igreja do membro autenticado.",
		},
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// ── PATCH /funcoes ──────────────────────────────────────────────

export const setFuncoes = createRoute({
	method: "patch",
	path: "/funcoes",
	tags: ["User"],
	security: SECURITY,
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						funcoes: z.array(z.string().min(1)).openapi({
							example: ["Guitarrista", "Vocal"],
						}),
					}),
				},
			},
			description: "Lista completa de nomes de funções do membro. Funções novas são criadas automaticamente na igreja.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": {
					schema: z.array(z.object({ id: z.number().int(), nome: z.string() })),
				},
			},
			description: "Lista atualizada de funções do membro.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});
