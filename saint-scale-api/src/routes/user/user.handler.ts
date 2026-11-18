import type { RouteHandler } from "@hono/zod-openapi";
import * as HttpStatusCode from "stoker/http-status-codes";

import type { AppEnv } from "../../tools/createAppRoute.js";
import { userDao, type AlterEmailResult } from "./user.dao.js";
import type {
	alterBirthday,
	alterEmail,
	alterLogradouro,
	alterTelephone,
	createUser,
	forgotPassword,
	getFuncoes,
	getMe,
	getUsers,
	requestPasswordReset,
} from "./user.route.js";

export const createUserHandler: RouteHandler<
	typeof createUser,
	AppEnv
> = async (c) => {
	const data = c.req.valid("json");
	try {
		const newUser = await userDao.createUser(data);
		return c.json(newUser, HttpStatusCode.CREATED);
	} catch (error: unknown) {
		const err = error as { status?: number; message: string };
		return c.json(
			{ message: err.message || "Erro ao criar usuário." },
			HttpStatusCode.BAD_REQUEST,
		);
	}
};

export const getUsersHandler: RouteHandler<typeof getUsers, AppEnv> = async (
	c,
) => {
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const idIgreja = await userDao.getUserChurchId(idMember);
	const users = await userDao.getUsers(idIgreja);
	return c.json(users, HttpStatusCode.OK);
};

export const getMeHandler: RouteHandler<typeof getMe, AppEnv> = async (c) => {
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const me = await userDao.getMe(idMember);
	if (!me) {
		return c.json(
			{ message: "Membro não encontrado" },
			HttpStatusCode.NOT_FOUND,
		);
	}
	return c.json(me, HttpStatusCode.OK);
};

export const alterEmailHandler: RouteHandler<
	typeof alterEmail,
	AppEnv
> = async (c) => {
	const data = c.req.valid("json");
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const updated: AlterEmailResult = await userDao.alterEmail(idMember, data);

	if (updated.ok === false) {
		if (updated.reason === "duplicate") {
			return c.json(
				{ message: "E-mail já está em uso por outro membro." },
				HttpStatusCode.CONFLICT,
			);
		}
		return c.json(
			{ message: "Membro não encontrado" },
			HttpStatusCode.NOT_FOUND,
		);
	}
	return c.json(
		{ message: "E-mail atualizado com sucesso" },
		HttpStatusCode.OK,
	);
};

// Confirma redefinição de senha com token válido (D3).
export const forgotPasswordHandler: RouteHandler<
	typeof forgotPassword,
	AppEnv
> = async (c) => {
	const data = c.req.valid("json");

	const updated = await userDao.forgotPassword(data);
	if (!updated) {
		return c.json(
			{ message: "Token inválido, expirado ou email não encontrado." },
			HttpStatusCode.FORBIDDEN,
		);
	}
	return c.json(
		{ message: "Senha atualizada com sucesso" },
		HttpStatusCode.OK,
	);
};

// Solicita token de redefinição de senha (público).
export const requestPasswordResetHandler: RouteHandler<
	typeof requestPasswordReset,
	AppEnv
> = async (c) => {
	const data = c.req.valid("json");

	const result = await userDao.createPasswordResetToken(data);
	return c.json(
		{
			message:
				result.token !== undefined
					? "Token de redefinição gerado (modo desenvolvimento)."
					: "Se o email existir, um token foi enviado para o endereço cadastrado.",
			...(result.token ? { token: result.token } : {}),
		},
		HttpStatusCode.OK,
	);
};

export const alterLogradouroHandler: RouteHandler<
	typeof alterLogradouro,
	AppEnv
> = async (c) => {
	const data = (c.req.valid("json") ?? await c.req.json()) as { rua: string; numero: number };
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const updated = await userDao.alterLogradouro(idMember, data);
	if (!updated) {
		return c.json(
			{ message: "Membro não encontrado" },
			HttpStatusCode.NOT_FOUND,
		);
	}
	return c.json(
		{ message: "Endereço atualizado com sucesso" },
		HttpStatusCode.OK,
	);
};

export const alterBirthdayHandler: RouteHandler<
	typeof alterBirthday,
	AppEnv
> = async (c) => {
	const data = (c.req.valid("json") ?? await c.req.json()) as { birth_date: string };
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const updated = await userDao.alterBirthday(idMember, data);
	if (!updated) {
		return c.json(
			{ message: "Membro não encontrado" },
			HttpStatusCode.NOT_FOUND,
		);
	}
	return c.json(
		{ message: "Data de nascimento atualizada com sucesso" },
		HttpStatusCode.OK,
	);
};

export const alterTelephoneHandler: RouteHandler<
	typeof alterTelephone,
	AppEnv
> = async (c) => {
	const data = (c.req.valid("json") ?? await c.req.json()) as { telephone: string };
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const updated = await userDao.alterTelephone(idMember, data);
	if (!updated) {
		return c.json(
			{ message: "Membro não encontrado" },
			HttpStatusCode.NOT_FOUND,
		);
	}
	return c.json(
		{ message: "Telefone atualizado com sucesso" },
		HttpStatusCode.OK,
	);
};

export const getFuncoesHandler: RouteHandler<
	typeof getFuncoes,
	AppEnv
> = async (c) => {
	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);
	const idIgreja = Number(c.get("id_igreja")) || await userDao.getUserChurchId(idMember);
	if (!idIgreja) {
		return c.json([], HttpStatusCode.OK);
	}
	const funcoes = await userDao.getFuncoes(idIgreja);
	return c.json(funcoes, HttpStatusCode.OK);
};

export const setFuncoesHandler = async (c: any) => {
	let funcoes: string[] = [];
	try {
		const body = await c.req.json();
		if (Array.isArray(body?.funcoes)) {
			funcoes = body.funcoes.map((f: unknown) => String(f)).filter(Boolean);
		}
	} catch {
		return c.json({ message: "Body inválido." }, 400);
	}

	const payload = c.get("jwtPayload");
	const idMember = Number(payload.sub);

	const idIgreja = await userDao.getUserChurchId(idMember);
	if (!idIgreja) {
		return c.json({ message: "Membro não encontrado" }, 404);
	}

	const result = await userDao.setFuncoes(idMember, idIgreja, funcoes);
	return c.json(result, 200);
};
