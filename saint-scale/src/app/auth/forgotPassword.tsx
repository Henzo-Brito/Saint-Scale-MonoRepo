import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import ReturnHeader from "@/components/allPages/returnHeader";
import SendBtn from "@/components/auth/sendBtn";
import TextInput from "@/components/auth/textInput";
import theme from "@/theme/theme";
import { getErrorMessage } from "@/services/error";
import { forgotPassword, requestPasswordReset } from "@/services/users";

const { colors, typography, spacing, border } = theme;

type Step = "request" | "reset";

export default function ForgotPassword() {
	const [step, setStep] = useState<Step>("request");

	// Etapa 1 — solicitar token
	const [email, setEmail] = useState("");
	const [requestError, setRequestError] = useState("");

	const requestMutation = useMutation({
		mutationFn: requestPasswordReset,
		onSuccess: () => {
			setRequestError("");
			setStep("reset");
		},
		onError: () => {
			// Mensagem genérica: não revela se o e-mail existe ou não.
			setRequestError(
				"Não foi possível processar a solicitação. Tente novamente.",
			);
		},
	});

	function handleRequest() {
		setRequestError("");

		if (!email.trim()) {
			setRequestError("Informe o seu email.");
			return;
		}

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			setRequestError("Email inválido.");
			return;
		}

		requestMutation.mutate({ email: email.trim() });
	}

	// Etapa 2 — redefinir senha com token
	const [token, setToken] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [resetError, setResetError] = useState("");

	const resetMutation = useMutation({
		mutationFn: forgotPassword,
		onSuccess: () => {
			Alert.alert(
				"Senha alterada",
				"Sua senha foi alterada com sucesso. Faça login com a nova senha.",
				[
					{
						text: "OK",
						onPress: () => router.replace("/auth/login"),
					},
				],
			);
		},
		onError: (error) => {
			// Não revela se a conta existe; mensagem genérica de falha na redefinição.
			setResetError(
				getErrorMessage(
					error,
					"Token inválido, expirado ou email não encontrado. Solicite uma nova recuperação.",
				),
			);
		},
	});

	function handleReset() {
		setResetError("");

		if (!token.trim()) {
			setResetError("Informe o token de recuperação.");
			return;
		}

		if (password.length < 8) {
			setResetError("A nova senha deve ter pelo menos 8 caracteres.");
			return;
		}

		if (password.length > 60) {
			setResetError("A nova senha deve ter no máximo 60 caracteres.");
			return;
		}

		if (password !== confirmPassword) {
			setResetError("As senhas não coincidem.");
			return;
		}

		resetMutation.mutate({
			email: email.trim(),
			token: token.trim(),
			password,
		});
	}

	function goBackToRequest() {
		setResetError("");
		setToken("");
		setPassword("");
		setConfirmPassword("");
		setStep("request");
	}

	return (
		<KeyboardAvoidingView
			style={[styles.root, theme.screen]}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
		>
			<ReturnHeader
				title={step === "request" ? "Redefinir Senha" : "Nova Senha"}
			/>

			<ScrollView
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.container}>
					{step === "request" ? (
						<>
							<Text style={[styles.title, theme.sectionTitle]}>
								Esqueceu sua senha?
							</Text>
							<Text style={[styles.subtitle, theme.textMuted]}>
								Informe seu email cadastrado para receber as instruções de
								redefinição.
							</Text>

							<View style={styles.form}>
								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Email
									</Text>
									<TextInput
										onChange={setEmail}
										placeholder="Seu email cadastrado"
										type="email"
									/>
								</View>

								{requestError ? (
									<Text style={[styles.errorText, theme.textError]}>
										{requestError}
									</Text>
								) : null}

								<SendBtn
									text={
										requestMutation.isPending
											? "Solicitando..."
											: "Solicitar recuperação"
									}
									func={handleRequest}
									sty={styles.button}
								/>

								<TouchableOpacity
									onPress={() => router.back()}
									style={styles.backLink}
								>
									<Text style={[styles.backLinkText, theme.textMuted]}>
										Voltar para o login
									</Text>
								</TouchableOpacity>
							</View>
						</>
					) : (
						<>
							<Text style={[styles.title, theme.sectionTitle]}>
								Redefinir Senha
							</Text>
							<Text style={[styles.subtitle, theme.textMuted]}>
								Informe o token recebido e defina uma nova senha.
							</Text>

							<View style={styles.form}>
								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Token de recuperação
									</Text>
									<TextInput
										onChange={setToken}
										placeholder="Token recebido por email"
										type="text"
									/>
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Nova Senha
									</Text>
									<TextInput
										onChange={setPassword}
										placeholder="Mínimo 8 caracteres"
										type="password"
									/>
								</View>

								<View style={styles.field}>
									<Text style={[styles.label, theme.textMuted]}>
										Confirmar Nova Senha
									</Text>
									<TextInput
										onChange={setConfirmPassword}
										placeholder="Repita a nova senha"
										type="password"
									/>
								</View>

								{resetError ? (
									<Text style={[styles.errorText, theme.textError]}>
										{resetError}
									</Text>
								) : null}

								<SendBtn
									text={
										resetMutation.isPending
											? "Redefinindo..."
											: "Redefinir Senha"
									}
									func={handleReset}
									sty={styles.button}
								/>

								<TouchableOpacity
									onPress={goBackToRequest}
									style={styles.backLink}
								>
									<Text style={[styles.backLinkText, theme.textMuted]}>
										Voltar para solicitação de token
									</Text>
								</TouchableOpacity>
							</View>
						</>
					)}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.bgDark,
	},
	scrollContent: {
		flexGrow: 1,
	},
	container: {
		flex: 1,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl,
		paddingBottom: spacing.xl,
	},
	title: {
		fontSize: typography.fontSize.xxl,
		color: colors.textLight,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.xs,
	},
	subtitle: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		opacity: 0.8,
		marginBottom: spacing.xl,
		lineHeight: 22,
	},
	form: {
		gap: spacing.lg,
	},
	field: {
		gap: spacing.sm,
	},
	label: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontWeight: typography.fontWeight.semibold,
	},
	errorText: {
		fontSize: typography.fontSize.sm,
		color: colors.danger,
		textAlign: "center",
	},
	button: {
		width: "100%",
		borderRadius: border.radius.full,
		marginTop: spacing.xs,
	},
	backLink: {
		alignItems: "center",
		paddingVertical: spacing.md,
	},
	backLinkText: {
		color: colors.textLight,
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
	},
});
