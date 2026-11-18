import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createRouter } from "../../tools/createAppRoute.js";
import { pool } from "../../db/index.js";

import * as handlers from "./admin.handler.js";
import * as route from "./admin.route.js";

const adminRoute = createRouter();

// ── Middleware de autorização administrativa ────────────────────────
// Executa após authMiddleware; carrega o cargo do membro e define isAdmin.
// Apenas dois perfis existem: Administrador (id_cargo_fk = 1) e Membro.
// Não há permissões intermediárias nem listas CSV de permissões.

const adminAuthMiddleware = async (c: any, next: any) => {
	const payload = c.get("jwtPayload");
	const idMembro = Number(payload.sub);

	const [rows] = await pool.execute<any[]>(
		`SELECT m.id_cargo_fk FROM membros m WHERE m.id_membro = ? LIMIT 1`,
		[idMembro],
	);

	const membro = (rows as any[])[0];
	if (!membro) {
		return c.json({ erro: "Membro não encontrado" }, 401);
	}

	const idCargoFk = membro.id_cargo_fk ?? null;
	c.set("idCargoFk", idCargoFk);
	c.set("isAdmin", idCargoFk === 1);

	await next();
};

// ── Rotas protegidas (JWT obrigatório) ────────────────────────────

adminRoute.use("*", authMiddleware);
adminRoute.use("*", adminAuthMiddleware);

adminRoute.openapi(route.dashboard, handlers.getDashboardHandler as any);
adminRoute.openapi(route.escolherMinisterio, handlers.escolherMinisterioHandler as any);

// Avisos / lembretes — devem vir ANTES das rotas genéricas /:lista
// para que GET /lembretes não seja capturado por GET /:lista
adminRoute.openapi(route.listarLembretes, handlers.listarLembretesHandler as any);
adminRoute.openapi(route.criarLembrete, handlers.criarLembreteHandler as any);
adminRoute.openapi(route.atualizarLembrete, handlers.atualizarLembreteHandler as any);
adminRoute.openapi(route.excluirLembrete, handlers.excluirLembreteHandler as any);

// CRUD genérico de listas (/:lista — deve vir depois das rotas específicas)
adminRoute.openapi(route.listarItens, handlers.listarItensHandler as any);
adminRoute.openapi(route.criarItem, handlers.criarItemHandler as any);
adminRoute.openapi(route.atualizarItem, handlers.atualizarItemHandler as any);
adminRoute.openapi(route.excluirItem, handlers.excluirItemHandler as any);

// Membros de equipe
adminRoute.openapi(route.equipeMembro, handlers.adicionarMembroAEquipeHandler as any);
adminRoute.openapi(route.excluirEquipeMembro, handlers.removerMembroDeEquipeHandler as any);
adminRoute.openapi(route.listarMembrosEquipe, handlers.listarMembrosEquipeHandler as any);

// Membros de ministério
adminRoute.openapi(route.ministerioMembro, handlers.adicionarMembroAoMinisterioHandler as any);
adminRoute.openapi(route.excluirMinisterioMembro, handlers.removerMembroDoMinisterioHandler as any);
adminRoute.openapi(route.listarMembrosMinisterio, handlers.listarMembrosMinisterioHandler as any);

// Membros de escala
adminRoute.openapi(route.escalaMembro, handlers.adicionarMembroAEscalaHandler as any);
adminRoute.openapi(route.excluirMembroDeEscala, handlers.removerMembroDeEscalaHandler as any);
adminRoute.openapi(route.listarMembrosEscala, handlers.listarMembrosEscalaHandler as any);

// Funções ministeriais na escala
adminRoute.openapi(route.listarFuncoes, handlers.listarFuncoesHandler as any);
adminRoute.openapi(
	route.atribuirFuncaoMembroEscala,
	handlers.atribuirFuncaoMembroEscalaHandler as any,
);

// Músicas da escala
adminRoute.openapi(route.listarMusicasEscala, handlers.listarMusicasEscalaHandler as any);
adminRoute.openapi(route.escalaMusica, handlers.adicionarMusicaAEscalaHandler as any);
adminRoute.openapi(route.atualizarTomMusicaEscala, handlers.atualizarTomMusicaEscalaHandler as any);
adminRoute.openapi(route.excluirMusicaDeEscala, handlers.removerMusicaDeEscalaHandler as any);

export default adminRoute;

