import { z } from "zod";

/**
 * Schema de criação de usuário — valida os dados do FORMULÁRIO (antes de enviar à API).
 *
 * Observações de formato:
 * - `birth_date`: o formulário envia "DD/MM/AAAA" com máscara;
 *   a conversão para "YYYY-MM-DD" (ISO) ocorre em `services/users.ts` antes do envio.
 * - `telephone`: o formulário envia com máscara ex.: "(11) 98765-4321";
 *   os não-numéricos são removidos em `services/users.ts` antes do envio.
 *   O backend aceita somente dígitos (máx. 11), então o formulário valida que
 *   haja 10 ou 11 dígitos após remover a máscara.
 * - `password`: mínimo 8 e máximo 60 caracteres (alinhado com backend).
 *
 * O campo `role` não é enviado pelo frontend — o backend define automaticamente como "membro".
 */
export const CreateUserSchema = z.object({
	name: z.string().max(150, "Nome deve ter no máximo 150 caracteres"),
	birth_date: z
		.string()
		.regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA"),
	telephone: z
		.string()
		.min(1, "Telefone obrigatório")
		.refine((val) => {
			const digits = val.replace(/\D/g, "");
			return digits.length === 10 || digits.length === 11;
		}, "Telefone deve ter 10 ou 11 dígitos"),
	email: z.string().email("Email inválido").max(255),
	password: z
		.string()
		.min(8, "Senha deve ter no mínimo 8 caracteres")
		.max(60, "Senha deve ter no máximo 60 caracteres"),
	usuario: z
		.string()
		.min(3, "Usuário deve ter no mínimo 3 caracteres")
		.max(30, "Usuário deve ter no máximo 30 caracteres")
		.regex(
			/^[a-z0-9._-]+$/,
			"Usuário inválido: use apenas letras minúsculas, números, ponto, sublinhado e hífen",
		)
		.optional(),
});

export type CreateUser = z.infer<typeof CreateUserSchema>;
