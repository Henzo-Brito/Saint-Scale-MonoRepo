import axios from "axios";

/**
 * Extrai uma mensagem amigável em português brasileiro de um erro Axios.
 *
 * A API do SaintScale retorna erros no formato { message: "..." } no corpo
 * da resposta. Alguns endpoints podem usar formas alternativas
 * ({ error: "..." } ou { error: { message: "..." } }), por isso são
 * verificadas como fallback. Nunca expõe stack traces, tokens ou dados
 * sensíveis na interface.
 *
 * @param error Erro capturado (Axios ou qualquer Error)
 * @param fallback Mensagem usada quando não é possível extrair nada útil
 * @returns Mensagem amigável para exibir ao usuário
 */
export function getErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		const data = error.response?.data as
			| { message?: string; error?: string | { message?: string } }
			| undefined;

		// Formato principal da API: { message: "..." }
		if (data?.message && typeof data.message === "string") {
			return data.message;
		}

		// Formatos alternativos
		if (data?.error) {
			if (typeof data.error === "string") return data.error;
			if (data.error.message && typeof data.error.message === "string") {
				return data.error.message;
			}
		}

		// Fallbacks por status quando o corpo não traz mensagem
		switch (status) {
			case 400:
				return "Dados inválidos. Verifique os campos informados.";
			case 401:
				return "Email ou senha inválidos.";
			case 403:
				return "Operação não permitida.";
			case 404:
				return "Recurso não encontrado.";
			case 409:
				return "Conflito: este registro já está em uso.";
			case 429:
				return "Muitas requisições. Tente novamente em alguns instantes.";
			case 500:
				return "Erro temporário do servidor. Tente novamente mais tarde.";
		}

		if (error.message) return error.message;
	}

	if (error instanceof Error) return error.message;
	return fallback;
}
