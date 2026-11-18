import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import z from "zod";

import SendBtn from "@/components/auth/sendBtn";
import TextInput from "@/components/auth/textInput";
import theme from "@/theme/theme";
import { getErrorMessage } from "@/services/error";
import { createUser } from "@/services/users";

const { colors, typography, spacing } = theme;

const formSchema = z.object({
	name: z
		.string()
		.min(1, "Nome é obrigatório")
		.max(150, "Nome deve ter no máximo 150 caracteres"),

	email: z
		.string()
		.email("Formato de e-mail inválido!")
		.max(255, "Formato de e-mail inválido!"),

	telephone: z
		.string()
		.min(1, "Telefone obrigatório")
		.refine((val) => {
			const digits = val.replace(/\D/g, "");
			return digits.length === 10 || digits.length === 11;
		}, "Telefone deve ter 10 ou 11 dígitos"),

	date: z
		.string()
		.regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data deve estar no formato DD/MM/AAAA"),
});

type FormErrors = {
	name?: string;
	email?: string;
	telephone?: string;
	date?: string;
};

type PasswordErrors = {
	hasUppercase: boolean;
	hasLowercase: boolean;
	hasNumber: boolean;
	hasSpecial: boolean;
	hasSpace: boolean;
	hasMinLength: boolean;
};

const initialPasswordErrors: PasswordErrors = {
	hasUppercase: false,
	hasLowercase: false,
	hasNumber: false,
	hasSpecial: false,
	hasSpace: false,
	hasMinLength: false,
};

export default function Register() {
	const [page, setPage] = useState(1);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [date, setDate] = useState("");
	const [telephone, setTelephone] = useState("");

	const [password, setPassword] = useState("");

	const [status, setStatus] = useState("");

	const [passwordVerify, setPasswordVerify] = useState("");

	const [errors, setErrors] = useState<FormErrors>({});
	const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>(
		initialPasswordErrors,
	);

	const { mutate, isPending } = useMutation({
		mutationFn: createUser,

		onSuccess: (_data) => {
			setStatus("Usuário criado com sucesso, redirecionando..");
			setTimeout(() => {
				router.push("/auth/login");
			}, 1000);
		},

		onError: (error: unknown) => {
			setStatus(
				`Erro ao cadastrar usuário: ${getErrorMessage(
					error,
					"Erro desconhecido ao cadastrar usuário.",
				)}`,
			);
		},
	});

	const passwordsMatch =
		passwordVerify.length > 0 && password === passwordVerify;

	function sendForm() {
		if (
			!password ||
			!passwordVerify ||
			password !== passwordVerify ||
			!passwordErrors.hasUppercase ||
			!passwordErrors.hasLowercase ||
			!passwordErrors.hasNumber ||
			!passwordErrors.hasSpecial ||
			!passwordErrors.hasMinLength ||
			passwordErrors.hasSpace
		) {
			return;
		}

		mutate({
			name,
			email,
			birth_date: date,
			password,
			telephone,
		});
	}

	function verifyErrors(
		values = {
			name,
			email,
			telephone,
			date,
		},
	) {
		const result = formSchema.safeParse(values);

		if (!result.success) {
			const newErrors: FormErrors = {};

			for (const issue of result.error.issues) {
				const field = issue.path[0];

				if (
					field === "name" ||
					field === "email" ||
					field === "telephone" ||
					field === "date"
				) {
					newErrors[field] = issue.message;
				}
			}

			setErrors(newErrors);
			return false;
		}

		setErrors({});
		return true;
	}

	function verifyPassword(value: string) {
		setPasswordErrors({
			hasUppercase: /[A-Z]/.test(value),
			hasLowercase: /[a-z]/.test(value),
			hasNumber: /[0-9]/.test(value),
			hasSpecial: /[^A-Za-z0-9\s]/.test(value),
			hasSpace: /\s/.test(value),
			hasMinLength: value.length >= 8,
		});
	}

	function setSecondPage() {
		if (verifyErrors()) {
			setPage(2);
		}
	}

	function updateField(field: keyof FormErrors, value: string) {
		const values = {
			name,
			email,
			telephone,
			date,
			[field]: value,
		};

		switch (field) {
			case "name":
				setName(value);
				break;
			case "email":
				setEmail(value);
				break;
			case "telephone":
				setTelephone(value);
				break;
			case "date":
				setDate(value);
				break;
		}

		verifyErrors(values);
	}

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				style={styles.keyboard}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					showsVerticalScrollIndicator={false}
					keyboardShouldPersistTaps="handled"
				>
					<View style={styles.inner}>
						<View style={styles.header}>
							<Text style={[styles.title, theme.sectionTitle]}>
								Cadastre-se!
							</Text>

							<Text style={[styles.subtitle, theme.textMuted]}>
								Preencha seus dados para criar sua conta.
							</Text>
						</View>

						{page === 1 ? (
							<View style={styles.form}>
								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Nome
									</Text>

									<TextInput
										placeholder="Insira seu nome"
										onChange={(value: string) =>
											updateField("name", value)
										}
										type="text"
									/>

									{errors.name && (
										<Text style={[styles.error, theme.textError]}>
											{errors.name}
										</Text>
									)}
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Email
									</Text>

									<TextInput
										placeholder="Insira seu melhor email"
										onChange={(value: string) =>
											updateField("email", value)
										}
										type="email"
									/>

									{errors.email && (
										<Text style={[styles.error, theme.textError]}>
											{errors.email}
										</Text>
									)}
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Data de nascimento
									</Text>

									<TextInput
										type="date"
										placeholder="DD/MM/AAAA"
										onChange={(value: string) =>
											updateField("date", value)}
									/>

									{errors.date && (
										<Text style={[styles.error, theme.textError]}>
											{errors.date}
										</Text>
									)}
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Telefone
									</Text>

									<TextInput
										type="phone"
										placeholder="(00) 00000-0000"
										onChange={(value: string) =>
											updateField("telephone", value)
										}
									/>

									{errors.telephone && (
										<Text style={[styles.error, theme.textError]}>
											{errors.telephone}
										</Text>
									)}
								</View>

								<View style={styles.button}>
									<SendBtn func={setSecondPage} text="Continuar" />
								</View>
							</View>
						) : (
							<View style={styles.form}>
								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Senha
									</Text>

									<TextInput
										placeholder="Insira sua senha"
										onChange={(value: string) => {
											setPassword(value);
											verifyPassword(value);
										}}
										type="password"
									/>

									<Text style={[styles.error, theme.textError]}>
										{!passwordErrors.hasMinLength && "• Mínimo 8 caracteres\n"}
										{!passwordErrors.hasLowercase && "• Uma letra minúscula\n"}
										{!passwordErrors.hasUppercase && "• Uma letra maiúscula\n"}
										{!passwordErrors.hasNumber && "• Um número\n"}
										{!passwordErrors.hasSpecial && "• Um caractere especial\n"}
										{passwordErrors.hasSpace && "• Não pode conter espaços"}
									</Text>
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Confirmar senha
									</Text>

									<TextInput
										placeholder="Confirme sua senha"
										onChange={(value: string) => {
											setPasswordVerify(value);
										}}
										type="password"
									/>

									{passwordVerify.length > 0 && !passwordsMatch && (
										<Text style={[styles.error, theme.textError]}>
											As senhas não coincidem.
										</Text>
									)}
								</View>

								<View style={styles.button}>
									<SendBtn
										func={sendForm}
										text={isPending ? "Cadastrando..." : "Cadastrar"}
									/>
								</View>

								<Text
									style={[
										styles.status,
										{ color: isPending ? colors.primary : colors.textMuted },
									]}
								>
									{isPending ? "Carregando..." : status}
								</Text>
							</View>
						)}

						<View style={styles.footer}>
							<Text style={[styles.register, theme.textMuted]}>
								Já possui uma conta?{" "}
								<Text
									onPress={() => router.push("/auth/login")}
									style={[styles.registerLink, theme.sectionTitle]}
								>
									Entrar
								</Text>
							</Text>
						</View>
					</View>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.bgDark,
	},

	keyboard: {
		flex: 1,
	},

	scroll: {
		flexGrow: 1,
		alignItems: "center",
		paddingTop: 0,
		paddingBottom: 0,
		width: "100%",
	},

	inner: {
		width: "100%",
		maxWidth: 480,
		flexGrow: 1,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl,
		paddingBottom: spacing.md,
	},

	header: {
		marginBottom: spacing.xl,
	},

	error: {
		color: colors.danger,
	},

	title: {
		fontSize: typography.fontSize.xxl,
		color: colors.textLight,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.bold,
		lineHeight: 40,
	},

	subtitle: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.regular,
		opacity: 0.65,
		lineHeight: 22,
		marginTop: spacing.xs,
		maxWidth: 320,
	},

	form: {
		gap: spacing.xl,
	},

	field: {
		gap: spacing.sm,
	},

	label: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.semibold,
	},

	button: {
		marginTop: spacing.xs,
	},

	status: {
		fontSize: typography.fontSize.base,
	},

	footer: {
		flex: 1,
		justifyContent: "flex-end",
		alignItems: "center",
		minHeight: 35,
	},

	register: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		opacity: 0.65,
	},

	registerLink: {
		color: colors.textLight,
		fontWeight: typography.fontWeight.bold,
		opacity: 1,
	},
});
