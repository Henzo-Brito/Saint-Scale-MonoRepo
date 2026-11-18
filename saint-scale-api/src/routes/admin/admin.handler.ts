import type { Context } from "hono";
import * as HttpStatusCode from "stoker/http-status-codes";
import { z } from "zod";

import type { AppEnv } from "../../tools/createAppRoute.js";
import * as adminDao from "./admin.dao.js";

const NOT_FOUND = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Recurso não encontrado",
} as const;

const FORBIDDEN = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Sem permissão para executar esta ação",
} as const;

const UNAUTHORIZED = {
	content: {
		"application/json": { schema: z.object({ erro: z.string() }) },
	},
	description: "Token ausente ou inválido",
} as const;

type HC = Context<AppEnv>;

function getIdMembro(c: HC): number {
	return Number((c.get("jwtPayload") as { sub: string }).sub);
}

function getIdIgreja(c: HC): number {
	return Number(c.get("id_igreja"));
}

/**
 * Envia notificação a um membro sobre um evento de escala.
 * A falha na notificação não impede o retorno bem-sucedido do chamador.
 */
async function notificarMembroSobreEscala(
	c: HC,
	idMembro: number,
	idIgreja: number,
	idEscala: number,
	titulo: string,
	montarConteudo: (
		membroNome: string | null,
		nomeEscala: string,
		dataFormatada: string,
		horaFormatada: string,
	) => string,
): Promise<void> {
	const [escala, membroNome] = await Promise.all([
		adminDao.obterEscalaInfo(idEscala, idIgreja),
		adminDao.obterMembroNome(idMembro, idIgreja),
	]);
	const nomeEscala = escala?.nome_escala ?? "uma escala";
	const dataHora = escala?.data_hora ? new Date(escala.data_hora) : new Date();
	const dataNotificacao = escala?.data_hora
		? new Date(
				dataHora.getFullYear(),
				dataHora.getMonth(),
				dataHora.getDate(),
			)
		: new Date();
	const opcoesData = { timeZone: "America/Sao_Paulo" } as const;
	const opcoesHora = {
		timeZone: "America/Sao_Paulo",
		hour: "2-digit",
		minute: "2-digit",
	} as const;
	const dataFormatada = dataHora.toLocaleDateString("pt-BR", opcoesData);
	const horaFormatada = dataHora.toLocaleTimeString("pt-BR", opcoesHora);
	const conteudo = montarConteudo(membroNome, nomeEscala, dataFormatada, horaFormatada);
	await adminDao.criarNotificacao(idMembro, idIgreja, titulo, conteudo, dataNotificacao);
}

function getIdCargoFk(c: HC): number | null {
	const v = c.get("idCargoFk");
	return v == null ? null : Number(v);
}

function getIsAdmin(c: HC): boolean {
	return adminDao.ehAdmin(getIdCargoFk(c));
}

export const getDashboardHandler = async (c: HC) => {
	const idMembro = getIdMembro(c);
	const idIgreja = getIdIgreja(c);
	const idCargoFk = getIdCargoFk(c);

	const dados = await adminDao.getDashboard(idMembro, idIgreja, idCargoFk);
	return c.json(dados, 200);
};

export const escolherMinisterioHandler = async (c: HC) => {
	const data = (c.req as any).valid("json");
	const idMembro = getIdMembro(c);
	const idIgreja = getIdIgreja(c);
	const idCargoFk = getIdCargoFk(c);

	const pode = await adminDao.escolherMinisterio(idMembro, idIgreja, idCargoFk, data.id);
	if (!pode) {
		return c.json({ erro: "Voc\u00ea n\u00e3o tem acesso a este minist\u00e9rio." }, 403);
	}
	return c.json({ ok: true }, 200);
};

export const listarItensHandler = async (c: HC) => {
	const lista = (c.req as any).param("lista");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const resultado = await adminDao.listarItens(lista, idIgreja);
	if (resultado === null) {
		return c.json({ erro: "Lista não encontrada" }, 404);
	}
	return c.json(resultado, 200);
};

export const criarItemHandler = async (c: HC) => {
	const lista = (c.req as any).param("lista");
	const corpo = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	if (lista === "membros" && corpo.cargo === 1 && !adminDao.ehAdmin(getIdCargoFk(c))) {
		return c.json({ erro: "S\u00f3 o administrador pode dar o cargo de Administrador." }, 403);
	}

	// Valida cargo também quando enviado como string (formato do formulário web).
	if (
		lista === "membros" &&
		typeof corpo.cargo === "string" &&
		corpo.cargo === "Administrador" &&
		!adminDao.ehAdmin(getIdCargoFk(c))
	) {
		return c.json({ erro: "S\u00f3 o administrador pode dar o cargo de Administrador." }, 403);
	}

	// Valida valores de status permitidos quando o campo for enviado.
	const STATUS_PERMITIDOS = ["pendente", "aprovado", "bloqueado"];
	if (lista === "membros" && corpo.status !== undefined && corpo.status !== null) {
		if (!STATUS_PERMITIDOS.includes(String(corpo.status))) {
			return c.json({ erro: "Status inv\u00e1lido. Valores permitidos: pendente, aprovado, bloqueado." }, 400);
		}
	}

	const resultado = await adminDao.criarItem(lista, corpo as Record<string, unknown>, idIgreja);
	if ("error" in resultado) {
		return c.json({ erro: resultado.error }, resultado.status as any);
	}
	return c.json(resultado, 200);
};

export const atualizarItemHandler = async (c: HC) => {
	const lista = (c.req as any).param("lista");
	const id = (c.req as any).param("id");
	const corpo = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	if (lista === "membros" && corpo.cargo === 1 && !adminDao.ehAdmin(getIdCargoFk(c))) {
		return c.json({ erro: "S\u00f3 o administrador pode dar o cargo de Administrador." }, 403);
	}

	const idMembro = getIdMembro(c);

	// Valida valores de status permitidos quando o campo for enviado.
	const STATUS_PERMITIDOS = ["pendente", "aprovado", "bloqueado"];
	if (lista === "membros" && corpo.status !== undefined && corpo.status !== null) {
		if (!STATUS_PERMITIDOS.includes(String(corpo.status))) {
			return c.json({ erro: "Status inv\u00e1lido. Valores permitidos: pendente, aprovado, bloqueado." }, 400);
		}
	}

	// Impede que o administrador altere o pr\u00f3prio status ou cargo de modo a
	// bloquear o pr\u00f3prio acesso ou remover o \u00faltimo administrador.
	if (lista === "membros" && Number(id) === idMembro) {
		if (corpo.status !== undefined && corpo.status !== null) {
			return c.json({ erro: "Voc\u00ea n\u00e3o pode alterar o pr\u00f3prio status." }, 400);
		}
		if (
			corpo.cargo !== undefined &&
			corpo.cargo !== null &&
			!adminDao.ehAdmin(Number(corpo.cargo))
		) {
			return c.json({ erro: "Voc\u00ea n\u00e3o pode remover o pr\u00f3prio cargo de Administrador." }, 400);
		}
	}

	const resultado = await adminDao.atualizarItem(lista, id, corpo as Record<string, unknown>, idIgreja);
	if ("error" in resultado) {
		return c.json({ erro: resultado.error }, resultado.status as any);
	}
	return c.json(resultado, 200);
};

export const excluirItemHandler = async (c: HC) => {
	const lista = (c.req as any).param("lista");
	const id = (c.req as any).param("id");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const idMembro = getIdMembro(c);
	if (lista === "membros" && Number(id) === idMembro) {
		return c.json({ erro: "Voc\u00ea n\u00e3o pode excluir a sua pr\u00f3pria conta." }, 400);
	}

	const resultado = await adminDao.excluirItem(lista, id, idIgreja);
	if ("error" in resultado) {
		return c.json({ erro: resultado.error }, resultado.status as any);
	}
	return c.json(resultado, 200);
};

export const adicionarMembroAEquipeHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.adicionarMembroAEquipe(Number(id), data.membro, idIgreja);
	if (!ok) {
		return c.json({ erro: "Equipe ou membro n\u00e3o encontrado nesta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

export const removerMembroDeEquipeHandler = async (c: HC) => {
	const { id, membro } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	await adminDao.removerMembroDeEquipe(Number(id), Number(membro), idIgreja);
	return c.json({ ok: true }, 200);
};

export const adicionarMembroAoMinisterioHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.adicionarMembroAoMinisterio(Number(id), data.membro, idIgreja);
	if (!ok) {
		return c.json({ erro: "Minist\u00e9rio ou membro n\u00e3o encontrado nesta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

export const removerMembroDoMinisterioHandler = async (c: HC) => {
	const { id, membro } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.removerMembroDoMinisterio(Number(id), Number(membro), idIgreja);
	if (!ok) {
		return c.json({ erro: "Minist\u00e9rio n\u00e3o encontrado nesta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

export const listarMembrosEquipeHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const membros = await adminDao.listarMembrosEquipe(Number(id), idIgreja);
	return c.json(membros, 200);
};

export const listarMembrosMinisterioHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const membros = await adminDao.listarMembrosMinisterio(Number(id), idIgreja);
	return c.json(membros, 200);
};

// ──────────────────────────────────────────────────────────────────
// GET /escalas/{id}/membros — listar membros da escala
// ──────────────────────────────────────────────────────────────────

export const listarMembrosEscalaHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const membros = await adminDao.listarMembrosEscala(Number(id), idIgreja);
	return c.json(membros, 200);
};

// ──────────────────────────────────────────────────────────────────
// POST /escalas/{id}/membros — adicionar membro à escala
// ──────────────────────────────────────────────────────────────────

export const adicionarMembroAEscalaHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const jaExiste = await adminDao.membroJaEstaNaEscala(Number(id), data.membro, idIgreja);
	if (jaExiste) {
		return c.json({ erro: "Membro já está associado a esta escala." }, 400);
	}

	const ok = await adminDao.adicionarMembroAEscala(Number(id), data.membro, idIgreja);
	if (!ok) {
		return c.json({ erro: "Escala ou membro não encontrado nesta igreja." }, 404);
	}

	// Notifica o membro adicionado à escala (não falha a operação se a notificação falhar).
	try {
		await notificarMembroSobreEscala(
			c,
			data.membro,
			idIgreja,
			Number(id),
			"Você foi adicionado a uma escala",
			(membroNome, nomeEscala, dataFormatada, horaFormatada) =>
				`${membroNome ?? ""}, você foi adicionado à escala "${nomeEscala}" (${dataFormatada} às ${horaFormatada}).`,
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(
			`[notificacao] falha ao notificar adicionar membro escala=${Number(id)} membro=${data.membro}: ${msg}`,
		);
	}

	return c.json({ ok: true }, 200);
};

// ──────────────────────────────────────────────────────────────────
// DELETE /escalas/{id}/membros/{membro} — remover membro da escala
// ──────────────────────────────────────────────────────────────────

export const removerMembroDeEscalaHandler = async (c: HC) => {
	const { id, membro } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.removerMembroDeEscala(Number(id), Number(membro), idIgreja);
	if (!ok) {
		return c.json({ erro: "Escala ou membro não encontrado nesta igreja." }, 404);
	}

	// Notifica o membro removido da escala.
	try {
		await notificarMembroSobreEscala(
			c,
			Number(membro),
			idIgreja,
			Number(id),
			"Você foi removido de uma escala",
			(membroNome, nomeEscala, dataFormatada, horaFormatada) =>
				`${membroNome ?? ""}, você foi removido da escala "${nomeEscala}" (${dataFormatada} às ${horaFormatada}).`,
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(
			`[notificacao] falha ao notificar remocao membro escala=${Number(id)} membro=${Number(membro)}: ${msg}`,
		);
	}

	return c.json({ ok: true }, 200);
};

// ──────────────────────────────────────────────────────────────────
// GET /escalas/funcoes — listar funções disponíveis para atribuição
// ──────────────────────────────────────────────────────────────────

export const listarFuncoesHandler = async (c: HC) => {
	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const funcoes = await adminDao.listarFuncoes();
	return c.json(funcoes, 200);
};

// ──────────────────────────────────────────────────────────────────
// PATCH /escalas/{id}/membros/{membro}/funcao — atribuir/alterar/remover função
// ──────────────────────────────────────────────────────────────────

export const atribuirFuncaoMembroEscalaHandler = async (c: HC) => {
	const { id, membro } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const idFuncao = data.funcao == null ? null : Number(data.funcao);

	if (idFuncao !== null) {
		const funcaoValida = await adminDao.funcaoExiste(idFuncao);
		if (!funcaoValida) {
			return c.json({ erro: "Função informada não existe." }, 400);
		}
	}

	const ok = await adminDao.atribuirFuncaoMembroEscala(
		Number(id),
		Number(membro),
		idFuncao,
		idIgreja,
	);
	if (!ok) {
		return c.json({ erro: "Membro não encontrado nesta escala desta igreja." }, 404);
	}

	// Notifica o membro sobre a atribuição/alteração/remoção da função ministerial.
	try {
		const funcaoNome = idFuncao !== null ? await adminDao.obterFuncaoNome(idFuncao) : null;
		await notificarMembroSobreEscala(
			c,
			Number(membro),
			idIgreja,
			Number(id),
			idFuncao !== null ? "Sua função na escala foi atualizada" : "Sua função na escala foi removida",
			(membroNome, nomeEscala, dataFormatada, horaFormatada) => {
				const trechoFuncao = funcaoNome
					? `Sua função na escala "${nomeEscala}" é agora "${funcaoNome}"`
					: `Sua função na escala "${nomeEscala}" foi removida`;
				return `${membroNome ?? ""}, ${trechoFuncao} (${dataFormatada} às ${horaFormatada}).`;
			},
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(
			`[notificacao] falha ao notificar funcao escala=${Number(id)} membro=${Number(membro)}: ${msg}`,
		);
	}

	return c.json({ ok: true }, 200);
};

// ──────────────────────────────────────────────────────────────────
// GET /escalas/{id}/musicas — listar músicas da escala
// ──────────────────────────────────────────────────────────────────

export const listarMusicasEscalaHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const musicas = await adminDao.listarMusicasEscala(Number(id), idIgreja);
	return c.json(musicas, 200);
};

// ──────────────────────────────────────────────────────────────────
// POST /escalas/{id}/musicas — adicionar uma música à escala
// ──────────────────────────────────────────────────────────────────

export const adicionarMusicaAEscalaHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const jaExiste = await adminDao.musicaJaEstaNaEscala(Number(id), data.id_musica, idIgreja);
	if (jaExiste) {
		return c.json({ erro: "Música já está associada a esta escala." }, 400);
	}

	const ok = await adminDao.adicionarMusicaAEscala(Number(id), data.id_musica, idIgreja);
	if (!ok) {
		return c.json({ erro: "Escala ou música não encontrada nesta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

// ──────────────────────────────────────────────────────────────────
// DELETE /escalas/{id}/musicas/{musica} — remover uma música da escala
// ──────────────────────────────────────────────────────────────────

export const removerMusicaDeEscalaHandler = async (c: HC) => {
	const { id, id_musica_escala } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.removerMusicaDeEscala(Number(id), Number(id_musica_escala), idIgreja);
	if (!ok) {
		return c.json({ erro: "Música não encontrada nesta escala desta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

export const atualizarTomMusicaEscalaHandler = async (c: HC) => {
	const { id, id_musica_escala } = (c.req as any).valid("param");
	const { tom } = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.atualizarTomMusicaEscala(
		Number(id),
		Number(id_musica_escala),
		tom ?? null,
		idIgreja,
	);
	if (!ok) {
		return c.json({ erro: "Música não encontrada nesta escala desta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};

// ──────────────────────────────────────────────────────────────────
// GET /lembretes — listar avisos (lembretes) da igreja
// ──────────────────────────────────────────────────────────────────

export const listarLembretesHandler = async (c: HC) => {
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const lembretes = await adminDao.listarLembretes(idIgreja);
	return c.json(lembretes, 200);
};

// ──────────────────────────────────────────────────────────────────
// POST /lembretes — criar um aviso (lembrete)
// ──────────────────────────────────────────────────────────────────

export const criarLembreteHandler = async (c: HC) => {
	const idIgreja = getIdIgreja(c);
	const data = (c.req as any).valid("json");

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const lembrete = await adminDao.criarLembrete(data, idIgreja);
	return c.json(lembrete, 200);
};

// ──────────────────────────────────────────────────────────────────
// PUT /lembretes/{id} — editar um aviso (lembrete)
// ──────────────────────────────────────────────────────────────────

export const atualizarLembreteHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const data = (c.req as any).valid("json");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.atualizarLembrete(Number(id), data, idIgreja);
	if (!ok) {
		return c.json({ erro: "Lembrete não encontrado nesta igreja." }, 404);
	}
	const lembrete = await adminDao.obterLembrete(Number(id), idIgreja);
	return c.json(lembrete, 200);
};

// ──────────────────────────────────────────────────────────────────
// DELETE /lembretes/{id} — remover um aviso (lembrete)
// ──────────────────────────────────────────────────────────────────

export const excluirLembreteHandler = async (c: HC) => {
	const { id } = (c.req as any).valid("param");
	const idIgreja = getIdIgreja(c);

	if (!getIsAdmin(c)) {
		return c.json({ erro: "Apenas administradores podem executar esta ação." }, 403);
	}

	const ok = await adminDao.removerLembrete(Number(id), idIgreja);
	if (!ok) {
		return c.json({ erro: "Lembrete não encontrado nesta igreja." }, 404);
	}
	return c.json({ ok: true }, 200);
};
