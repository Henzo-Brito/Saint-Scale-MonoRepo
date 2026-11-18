import { z } from "@hono/zod-openapi";

// ── GET /dashboard ─────────────────────────────────────────────────

export const DashboardItemSchema = z
	.object({
		id: z.number().int(),
		nome: z.string(),
	})
	.openapi("DashboardItem");

export const DashboardSchema = z
	.object({
		versao: z.string(),
		igrejas: z.array(DashboardItemSchema),
		ministerios: z.array(DashboardItemSchema),
		equipes: z.array(DashboardItemSchema),
		locais: z.array(DashboardItemSchema),
		musicas: z.array(DashboardItemSchema),
		escalas: z.array(DashboardItemSchema),
		membros: z.array(DashboardItemSchema),
		cargos: z.array(DashboardItemSchema),
		eu: z.object({
			id: z.number().int(),
			nome: z.string(),
			usuario: z.string().nullable(),
			admin: z.boolean(),
		}),
		igreja: z.object({
			id: z.number().int(),
			nome: z.string(),
		}),
	})
	.openapi("Dashboard");

// ── POST /ministerio/escolher ──────────────────────────────────────

export const EscolherMinisterioSchema = z
	.object({
		id: z.number().int().positive(),
	})
	.openapi("EscolherMinisterio");

// ── POST/DELETE /equipes/:id/membros ──────────────────────────────

export const EquipeMembroSchema = z
	.object({
		membro: z.number().int().positive(),
	})
	.openapi("EquipeMembro");

// ── POST/DELETE /ministerios/:id/membros ──────────────────────────

export const MinisterioMembroSchema = z
	.object({
		membro: z.number().int().positive(),
	})
	.openapi("MinisterioMembro");

// ── POST/DELETE /escalas/:id/membros ──────────────────────────────

export const EscalaMembroSchema = z
	.object({
		membro: z.number().int().positive(),
	})
	.openapi("EscalaMembro");

// ── POST/DELETE /escalas/:id/músicas ───────────────────────────────

export const MusicaEscalaSchema = z
	.object({
		id_musica: z.number().int().positive(),
	})
	.openapi("MusicaEscala");

export const MusicaEscalaParamSchema = z
	.object({
		id: z.string().describe("ID da escala"),
		id_musica_escala: z.string().describe("ID da associação música-escala"),
	})
	.openapi("MusicaEscalaParam");

// ── Resposta genérica ──────────────────────────────────────────────

export const OkResponseSchema = z
	.object({
		ok: z.boolean(),
	})
	.openapi("OkResponse");

// ── GET /equipes/:id/membros e /ministerios/:id/membros e /escalas/:id/membros ──

export const MembroListItemSchema = z
	.object({
		id: z.number().int(),
		nome: z.string(),
		email: z.string().email(),
		funcao: z.string().nullable().optional(),
		id_funcao_fk: z.number().int().nullable().optional(),
	})
	.openapi("MembroListItem");

export type MembroListItem = z.infer<typeof MembroListItemSchema>;

// ── PATCH /escalas/:id/membros/:membro/funcao ──────────────────────

export const AtribuirFuncaoSchema = z
	.object({
		funcao: z.number().int().positive().nullable().describe(
			"id_funcao a atribuir ao membro na escala; null remove a atribuição",
		),
	})
	.openapi("AtribuirFuncao");

export type EscalaMembro = z.infer<typeof EscalaMembroSchema>;
export type AtribuirFuncao = z.infer<typeof AtribuirFuncaoSchema>;
export type EscolherMinisterio = z.infer<typeof EscolherMinisterioSchema>;
export type EquipeMembro = z.infer<typeof EquipeMembroSchema>;
export type MinisterioMembro = z.infer<typeof MinisterioMembroSchema>;
export type MusicaEscala = z.infer<typeof MusicaEscalaSchema>;
export type MusicaEscalaParam = z.infer<typeof MusicaEscalaParamSchema>;

// ── POST/PUT /lembretes — criar/editar aviso (lembrete) ──────────────

export const LembreteBodySchema = z
	.object({
		nome: z.string().min(1).max(150),
		data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve usar o formato YYYY-MM-DD"),
		tempo: z.string().regex(/^\d{2}:\d{2}$/, "Horário deve usar o formato HH:MM"),
		descricao: z.string().nullable().optional(),
		funcoes: z.array(z.number().int().positive()).optional(),
	})
	.openapi("LembreteBody");

export type LembreteBody = z.infer<typeof LembreteBodySchema>;

// ── GET/PUT/DELETE /lembretes/:id — item de aviso (lembrete) ─────────

export const LembreteItemSchema = z
	.object({
		id_lembrete: z.string(),
		name: z.string(),
		date: z.string(),
		tempo: z.string(),
		description: z.string(),
		functions: z.array(z.string()),
	})
	.openapi("LembreteItem");

export type LembreteItem = z.infer<typeof LembreteItemSchema>;

// ── Params ───────────────────────────────────────────────────────────

export const LembreteIdParamSchema = z
	.object({
		id: z.string().describe("ID do lembrete"),
	})
	.openapi("LembreteIdParam");

export type LembreteIdParam = z.infer<typeof LembreteIdParamSchema>;
