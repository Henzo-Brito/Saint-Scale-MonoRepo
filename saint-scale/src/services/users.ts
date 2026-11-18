import type { CreateUser } from "@/schemas/user.schemas";
import { CreateUserSchema } from "@/schemas/user.schemas";
import type {
	AlterBirthday,
	AlterEmail,
	AlterLogradouro,
	AlterTelephone,
	ForgotPassword,
	Me,
	PasswordResetRequest,
	PatchResponse,
} from "@/types/api.types";
import { api } from "./api";

/**
 * Cria um novo usuário na API.
 *
 * Conversões realizadas:
 * - Data de nascimento: DD/MM/YYYY (formulário) → YYYY-MM-DD (API ISO)
 * - Telefone: remove caracteres não numéricos (máscara)
 */
export async function createUser(user: CreateUser) {
	// Valida entrada com o schema do frontend antes de enviar
	const parsed = CreateUserSchema.safeParse(user);
	if (!parsed.success) {
		const field = parsed.error.issues[0]?.path[0];
		const message = parsed.error.issues[0]?.message;
		throw new Error(
			`Campo inválido${field ? ` (${String(field)}): ` : ": "}${message || "dados inválidos"}`,
		);
	}

	// A API espera a data no formato ISO "YYYY-MM-DD", mas o formulário envia "DD/MM/YYYY".
	const [day, month, year] = user.birth_date.split("/");
	const birthDate = `${year}-${month}-${day}`;

	// Remove qualquer caractere não numérico antes de enviar (ex.: "(11) 98705-1565" → "11987051565").
	const telephone = user.telephone.replace(/\D/g, "");

	const body: Record<string, unknown> = {
		name: user.name,
		birth_date: birthDate,
		telephone,
		email: user.email,
		password: user.password,
	};
	if (user.usuario) {
		body.usuario = user.usuario;
	}

	const response = await api.post("/user", body);

	return response.data;
}

/**
 * Busca os dados completos do perfil do usuário autenticado.
 * Inclui: funções, equipes, logradouro, etc.
 */
export async function getMe(): Promise<Me> {
	const response = await api.get<Me>("/user/me");
	return response.data;
}

/**
 * Altera o email do usuário autenticado.
 */
export async function alterEmail(data: AlterEmail): Promise<PatchResponse> {
	const response = await api.patch<PatchResponse>("/user/alterEmail", data);
	return response.data;
}

/**
 * Altera a senha do usuário.
 * Endpoint público - identificação por email (para fluxo "esqueci senha").
 */
export async function forgotPassword(
	data: ForgotPassword,
): Promise<PatchResponse> {
	const response = await api.patch<PatchResponse>("/user/forgotPassword", data);
	return response.data;
}

/**
 * Solicita um token de redefinição de senha por e-mail.
 * Endpoint público. A API retorna mensagem genérica (não revela se a conta existe).
 * O token só é retornado em corpo em ambiente de desenvolvimento; em produção
 * é esperado que chegue por e-mail (não há serviço de e-mail configurado).
 */
export async function requestPasswordReset(
	data: PasswordResetRequest,
): Promise<{ message: string; token?: string }> {
	const response = await api.post<{ message: string; token?: string }>(
		"/user/request-password-reset",
		data,
	);
	return response.data;
}

/**
 * Altera o logradouro do usuário autenticado.
 * Faz upsert no banco - cria ou reutiliza logradouro existente.
 */
export async function alterLogradouro(
	data: AlterLogradouro,
): Promise<PatchResponse> {
	const response = await api.patch<PatchResponse>(
		"/user/alterLogradouro",
		data,
	);
	return response.data;
}

/**
 * Altera a data de nascimento do usuário autenticado.
 * @param data.birth_date Formato: YYYY-MM-DD
 */
export async function alterBirthday(
	data: AlterBirthday,
): Promise<PatchResponse> {
	const response = await api.patch<PatchResponse>("/user/alterBirthday", data);
	return response.data;
}

/**
 * Altera o telefone do usuário autenticado.
 * @param data.telephone Apenas dígitos, sem máscara (max 11)
 */
export async function alterTelephone(
	data: AlterTelephone,
): Promise<PatchResponse> {
	const response = await api.patch<PatchResponse>("/user/alterTelephone", data);
	return response.data;
}

/**
 * Lista as funções disponíveis na igreja do usuário autenticado.
 */
export async function getFuncoes(): Promise<{ id: number; nome: string }[]> {
	const response = await api.get<{ id: number; nome: string }[]>("/user/funcoes");
	return response.data;
}

/**
 * Define as funções do usuário autenticado (substitui completamente).
 * Funções novas são criadas automaticamente na igreja.
 *
 * @param funcoes Lista de nomes de funções (ex: ["Guitarrista", "Vocal"])
 * @returns Lista atualizada de funções com id e nome
 */
export async function setFuncoes(
	funcoes: string[],
): Promise<{ id: number; nome: string }[]> {
	const response = await api.patch<{ id: number; nome: string }[]>("/user/funcoes", { funcoes });
	return response.data;
}
