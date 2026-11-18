import axios from "axios";
import { session } from "./session";

/**
 * Instância Axios compartilhada por todos os serviços.
 *
 * Interceptor de request: injeta automaticamente o token JWT no header Authorization.
 * Interceptor de response: apenas rejeita erros 401/403 sem tocar na sessão.
 * O _layout gerencia o redirecionamento de auth no mount; componentes individuais
 * tratam 401 com mensagem de erro. Isso evita loops de redirect entre /auth e rotas
 * protegidas quando uma chamada protegida retorna 401 após o login.
 */
/**
 * URL-base da API. Exige EXPO_PUBLIC_API_URL (definida explicitamente por
 * ambiente: web local, emulador ou dispositivo físico).
 *
 * Não há fallback remoto: em ambiente sem a variável configurada, lança um
 * erro de configuração claro para evitar chamadas acidentais a servidores
 * inesperados (incluindo produção/Render) durante o desenvolvimento local.
 *
 * O prefixo /api aparece exatamente uma vez aqui; nenhum serviço individual
 * deve definir sua própria URL-base.
 */
const getBaseUrl = (): string => {
	const envUrl = process.env.EXPO_PUBLIC_API_URL;
	if (!envUrl) {
		throw new Error(
			"EXPO_PUBLIC_API_URL não está configurada. Defina a URL base da API (ex.: http://localhost:3000/api) antes de iniciar o aplicativo.",
		);
	}
	return envUrl.replace(/\/+$/, "");
};

export const api = axios.create({
	baseURL: getBaseUrl(),
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Interceptor de requisição: injeta o token JWT se existir; caso contrário,
 * cancela a requisição quando o endpoint for protegido (sem token disponível),
 * evitando chamadas autenticadas (e os respectivos 401) durante a restauração
 * da sessão ou sem sessão válida.
 */

const PUBLIC_PATHS = [
	"/auth/login",
	"/user",
	"/user/request-password-reset",
	"/user/forgotPassword",
];

function isPublicPath(url: string | undefined): boolean {
	if (!url) return false;
	const path = url.toLowerCase();
	return PUBLIC_PATHS.some((p) => path.includes(p.toLowerCase()));
}

/**
 * Interceptor de resposta: trata 401 (token inválido/expirado) e 403 (proibido).
 *
 * - 401: apenas rejeita o erro. Não limpa a sessão nem redireciona — isso evita
 *   loops de redirect entre /auth e rotas protegidas quando uma chamada protegida
 *   retorna 401 após o login. O _layout gerencia o redirect no mount; componentes
 *   individuais mostram mensagem de erro ao receber 401.
 * - 403: não toca na sessão nem redireciona. Apenas rejeita o erro para que o
 *   componente que chamou possa mostrar uma mensagem específica de permissão.
 */
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const status = error.response?.status;
		const requestUrl = error.config?.url;
		const hadToken = !!(
			error.config?.headers?.Authorization ||
			error.config?.headers?.authorization
		);

		if (status === 401) {
			// Requisições públicas (login, cadastro, recuperação de senha) e
			// requisições sem token não representam sessão expirada: o 401 é
			// um resultado esperado do próprio formulário e deve ser repassado
			// ao chamador sem tocar na sessão.
			if (!hadToken || isPublicPath(requestUrl)) {
				return Promise.reject(error);
			}

			// Sessão realmente inválida ou expirada: limpa o token e notifica
			// o _layout via onSessionCleared para redirecionar à área pública.
			// Não redireciona aqui para evitar dependência circular com o router.
			await session.clear();
			return Promise.reject(error);
		}

		if (status === 403) {
			// Token válido, mas sem permissão para o recurso. Não encerra sessão.
			return Promise.reject(error);
		}

		return Promise.reject(error);
	},
);

// Guarda de inicialização: requisições protegidas sem token não são enviadas.
// Evita chamadas autenticadas (e os respectivos 401) durante a restauração da
// sessão, quando ainda não se sabe se existe token válido.
api.interceptors.request.use(async (config) => {
	const token = await session.load();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	} else if (!isPublicPath(config.url)) {
		// Sem token e endpoint protegido: cancela a requisição antes de enviá-la.
		const err = new axios.AxiosError(
			"No session token available",
			"ERR_NO_TOKEN",
			config,
		);
		throw err;
	}
	return config;
});
