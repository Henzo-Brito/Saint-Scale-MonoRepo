import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { createRouter } from "../../tools/createAppRoute.js";

import * as handlers from "./user.handler.js";
import * as route from "./user.route.js";

const userRoute = createRouter();

// ── Rotas públicas ───────────────────────────────────────────────
userRoute.openapi(route.createUser, handlers.createUserHandler);
userRoute.openapi(route.forgotPassword, handlers.forgotPasswordHandler);
userRoute.openapi(route.requestPasswordReset, handlers.requestPasswordResetHandler);

// ── Rotas protegidas (JWT obrigatório) ──────────────────────────
userRoute.get("/", authMiddleware, handlers.getUsersHandler);
userRoute.get("/me", authMiddleware, handlers.getMeHandler);
userRoute.patch("/alterEmail", authMiddleware, handlers.alterEmailHandler);
userRoute.patch("/alterLogradouro", authMiddleware, handlers.alterLogradouroHandler);
userRoute.patch("/alterBirthday", authMiddleware, handlers.alterBirthdayHandler);
userRoute.patch("/alterTelephone", authMiddleware, handlers.alterTelephoneHandler);
userRoute.get("/funcoes", authMiddleware, handlers.getFuncoesHandler);
userRoute.patch("/funcoes", authMiddleware, handlers.setFuncoesHandler);

export default userRoute;
