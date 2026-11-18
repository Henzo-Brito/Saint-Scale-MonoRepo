import type { RouteHandler } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import * as HttpStatusCode from "stoker/http-status-codes";

import type { AppEnv } from "../../tools/createAppRoute.js";
import { alertDao } from "./alert.dao.js";
import type { getReminder, getReminderDetail } from "./alert.route.js";

export const getReminderHandler: RouteHandler<
	typeof getReminder,
	AppEnv
> = async (c) => {
	const payload = c.get("jwtPayload");
	const idMembro = Number(payload.sub);
	const idIgreja = Number(c.get("id_igreja"));
	const data = await alertDao.getReminder(idMembro, idIgreja);
	return c.json(data, HttpStatusCode.OK);
};

export const getReminderDetailHandler: RouteHandler<
	typeof getReminderDetail,
	AppEnv
> = async (c) => {
	const { id_reminder } = c.req.valid("param");
	const idIgreja = Number(c.get("id_igreja"));
	const data = await alertDao.getReminderDetail(Number(id_reminder), idIgreja);

	if (!data) {
		throw new HTTPException(HttpStatusCode.NOT_FOUND, {
			message: "Lembrete não encontrado",
		});
	}

	return c.json(data, HttpStatusCode.OK);
};
