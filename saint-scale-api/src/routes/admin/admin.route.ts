import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCode from "stoker/http-status-codes";

import {
	AtribuirFuncaoSchema,
	DashboardSchema,
	EquipeMembroSchema,
	EscalaMembroSchema,
	EscolherMinisterioSchema,
	LembreteBodySchema,
	LembreteIdParamSchema,
	LembreteItemSchema,
	MembroListItemSchema,
	MinisterioMembroSchema,
	MusicaEscalaSchema,
	MusicaEscalaParamSchema,
	OkResponseSchema,
} from "../../schemas/admin.schemas.js";
import { ScaleMusicItemSchema } from "../../schemas/scale.schemas.js";

const SECURITY = [{ bearerAuth: [] }];
const TAG = ["admin"];

const NOT_FOUND = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Recurso nÃ£o encontrado",
} as const;

const FORBIDDEN = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Sem permissÃ£o para executar esta aÃ§Ã£o",
} as const;

const BAD_REQUEST = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Dados invÃ¡lidos",
} as const;

const UNAUTHORIZED = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Token ausente ou invÃ¡lido",
} as const;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /dados â€” dashboard da igreja do usuÃ¡rio logado
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const dashboard = createRoute({
	method: "get",
	path: "/dados",
	tags: TAG,
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: DashboardSchema } },
			description: "Dados completos do dashboard para a igreja do usuÃ¡rio.",
		},
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /escolher-ministerio â€” selecionar ministÃ©rio ativo
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const escolherMinisterio = createRoute({
	method: "post",
	path: "/escolher-ministerio",
	tags: TAG,
	security: SECURITY,
	request: {
		body: {
			content: { "application/json": { schema: EscolherMinisterioSchema } },
			description: "ID do ministÃ©rio a ser selecionado.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "MinistÃ©rio selecionado com sucesso.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Params para rotas genÃ©ricas de lista
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ListaParamSchema = z.object({
	lista: z
		.string()
		.describe(
			"Nome da lista: cargos, ministerios, equipes, locais, musicas, escalas, membros",
		),
});

export const ItemIdParamSchema = z.object({
	lista: z.string().describe("Nome da lista"),
	id: z.string().describe("ID do item"),
});

export const MembroParamParamSchema = z.object({
	id: z.string().describe("ID da equipe ou minist\u00e9rio"),
	membro: z.string().describe("ID do membro"),
});

export const SingleParamSchema = z.object({
	id: z.string().describe("ID da equipe ou minist\u00e9rio"),
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /:lista â€” listar itens (genÃ©rico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarItens = createRoute({
	method: "get",
	path: "/{lista}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: ListaParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": { schema: z.array(z.record(z.string(), z.any())) },
			},
			description: "Lista de itens da igreja do usuÃ¡rio autenticado.",
		},
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /:lista â€” criar item (genÃ©rico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const criarItem = createRoute({
	method: "post",
	path: "/{lista}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: ListaParamSchema,
		body: {
			content: {
				"application/json": { schema: z.record(z.string(), z.any()) },
			},
			description: "Campos do item a criar.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Item criado com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PUT /:lista/:id â€” atualizar item (genÃ©rico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const atualizarItem = createRoute({
	method: "put",
	path: "/{lista}/{id}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: ItemIdParamSchema,
		body: {
			content: {
				"application/json": { schema: z.record(z.string(), z.any()) },
			},
			description: "Campos a atualizar.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Item atualizado com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /:lista/:id â€” excluir item (genÃ©rico)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirItem = createRoute({
	method: "delete",
	path: "/{lista}/{id}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: ItemIdParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Item excluÃ­do com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /equipes/{id}/membros â€” adicionar membro Ã  equipe
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const equipeMembro = createRoute({
	method: "post",
	path: "/equipes/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
		body: {
			content: { "application/json": { schema: EquipeMembroSchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro adicionado Ã  equipe.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /equipes/{id}/membros/{membro} â€” remover membro da equipe
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirEquipeMembro = createRoute({
	method: "delete",
	path: "/equipes/{id}/membros/{membro}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MembroParamParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro removido da equipe.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /ministerios/{id}/membros â€” adicionar membro ao ministÃ©rio
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ministerioMembro = createRoute({
	method: "post",
	path: "/ministerios/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
		body: {
			content: { "application/json": { schema: MinisterioMembroSchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro adicionado ao ministÃ©rio.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /ministerios/{id}/membros/{membro} â€” remover membro do ministÃ©rio
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirMinisterioMembro = createRoute({
	method: "delete",
	path: "/ministerios/{id}/membros/{membro}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MembroParamParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro removido do ministÃ©rio.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /equipes/{id}/membros â€” listar membros da equipe
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarMembrosEquipe = createRoute({
	method: "get",
	path: "/equipes/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": { schema: z.array(MembroListItemSchema) },
			},
			description: "Lista de membros da equipe.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /ministerios/{id}/membros â€” listar membros do ministÃ©rio
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarMembrosMinisterio = createRoute({
	method: "get",
	path: "/ministerios/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": { schema: z.array(MembroListItemSchema) },
			},
			description: "Lista de membros do ministÃ©rio.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /escalas/{id}/membros â€” listar membros da escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarMembrosEscala = createRoute({
	method: "get",
	path: "/escalas/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": { schema: z.array(MembroListItemSchema) },
			},
			description: "Lista de membros da escala.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /escalas/{id}/membros â€” adicionar membro Ã  escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const escalaMembro = createRoute({
	method: "post",
	path: "/escalas/{id}/membros",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
		body: {
			content: { "application/json": { schema: EscalaMembroSchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro adicionado Ã  escala.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /escalas/{id}/membros/{membro} â€” remover membro da escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirMembroDeEscala = createRoute({
	method: "delete",
	path: "/escalas/{id}/membros/{membro}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MembroParamParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Membro removido da escala.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /escalas/funcoes â€” listar funÃ§Ãµes disponÃ­veis para atribuiÃ§Ã£o
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarFuncoes = createRoute({
	method: "get",
	path: "/escalas/funcoes",
	tags: TAG,
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": {
					schema: z.array(
						z.object({
							id: z.number().int(),
							nome: z.string(),
						}),
					),
				},
			},
			description: "Lista de funÃ§Ãµes ministeriais disponÃ­veis.",
		},
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH /escalas/{id}/membros/{membro}/funcao â€” atribuir/alterar/remover funÃ§Ã£o
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const atribuirFuncaoMembroEscala = createRoute({
	method: "patch",
	path: "/escalas/{id}/membros/{membro}/funcao",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MembroParamParamSchema,
		body: {
			content: { "application/json": { schema: AtribuirFuncaoSchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "FunÃ§Ã£o atribuÃ­da/alterada/removida com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /escalas/{id}/musicas â€” listar mÃºsicas da escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarMusicasEscala = createRoute({
	method: "get",
	path: "/escalas/{id}/musicas",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: {
				"application/json": { schema: z.array(ScaleMusicItemSchema) },
			},
			description: "Lista de mÃºsicas vinculadas Ã  escala.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /escalas/{id}/musicas â€” adicionar uma mÃºsica Ã  escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const escalaMusica = createRoute({
	method: "post",
	path: "/escalas/{id}/musicas",
	tags: TAG,
	security: SECURITY,
	request: {
		params: SingleParamSchema,
		body: {
			content: { "application/json": { schema: MusicaEscalaSchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "MÃºsica adicionada Ã  escala.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH /escalas/{id}/musicas/{id_musica_escala}/tom â€” alterar tom da mÃºsica na escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const atualizarTomMusicaEscala = createRoute({
	method: "patch",
	path: "/escalas/{id}/musicas/{id_musica_escala}/tom",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MusicaEscalaParamSchema,
		body: {
			content: {
				"application/json": {
					schema: z.object({ tom: z.string().nullable() }),
				},
			},
			description: "Novo tom para a mÃºsica nesta escala. null para limpar.",
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Tom atualizado.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /escalas/{id}/musicas/{id_musica_escala} â€” remover uma mÃºsica da escala
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirMusicaDeEscala = createRoute({
	method: "delete",
	path: "/escalas/{id}/musicas/{id_musica_escala}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: MusicaEscalaParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "MÃºsica removida da escala.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /lembretes â€” listar avisos (lembretes) da igreja
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const listarLembretes = createRoute({
	method: "get",
	path: "/lembretes",
	tags: TAG,
	security: SECURITY,
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: z.array(LembreteItemSchema) } },
			description: "Lista de lembretes (avisos) da igreja do administrador.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /lembretes â€” criar um novo aviso (lembrete)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const criarLembrete = createRoute({
	method: "post",
	path: "/lembretes",
	tags: TAG,
	security: SECURITY,
	request: {
		body: {
			content: { "application/json": { schema: LembreteBodySchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: LembreteItemSchema } },
			description: "Lembrete criado com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PUT /lembretes/{id} â€” editar um aviso (lembrete) existente
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const atualizarLembrete = createRoute({
	method: "put",
	path: "/lembretes/{id}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: LembreteIdParamSchema,
		body: {
			content: { "application/json": { schema: LembreteBodySchema } },
		},
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: LembreteItemSchema } },
			description: "Lembrete atualizado com sucesso.",
		},
		[HttpStatusCode.BAD_REQUEST]: BAD_REQUEST,
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /lembretes/{id} â€” remover um aviso (lembrete)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const excluirLembrete = createRoute({
	method: "delete",
	path: "/lembretes/{id}",
	tags: TAG,
	security: SECURITY,
	request: {
		params: LembreteIdParamSchema,
	},
	responses: {
		[HttpStatusCode.OK]: {
			content: { "application/json": { schema: OkResponseSchema } },
			description: "Lembrete removido com sucesso.",
		},
		[HttpStatusCode.FORBIDDEN]: FORBIDDEN,
		[HttpStatusCode.NOT_FOUND]: NOT_FOUND,
		[HttpStatusCode.UNAUTHORIZED]: UNAUTHORIZED,
	},
});
