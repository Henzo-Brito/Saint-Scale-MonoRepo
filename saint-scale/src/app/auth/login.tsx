const img = require("@/assets/1.jpg");

import { useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import SendBtn from "@/components/auth/sendBtn";
import TextInput from "@/components/auth/textInput";
import theme from "@/theme/theme";
import { LoginSchema } from "@/schemas/auth.schemas";
import { login } from "@/services/auth";
import { getErrorMessage } from "@/services/error";

const { colors, typography, spacing, border } = theme;

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	const loginMutation = useMutation({
		mutationFn: login,

		onSuccess: async (_data) => {
			router.replace("/(tabs)");
		},

		onError: (_error) => {
			setError(
				getErrorMessage(_error, "Email ou senha inválidos. Tente novamente."),
			);
		},
	});

	function handleLogin() {
		const result = LoginSchema.safeParse({
			email,
			password,
		});

		if (!result.success) {
			const _errors = result.error.flatten();

			setError(`Coloque valores válidos`);

			return;
		}

		loginMutation.mutate(result.data);
	}

	return (
		<ScrollView
			style={[styles.scrollRoot, theme.screen]}
			contentContainerStyle={styles.scrollContent}
			showsVerticalScrollIndicator={false}
			keyboardShouldPersistTaps="handled"
		>
			<View style={styles.container}>
				<LinearGradient
					colors={[colors.main, colors.primary]}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={styles.top}
				>
					<View style={styles.imageContainer}>
						<Image source={img} style={styles.img} />
					</View>
				</LinearGradient>

				<View style={styles.bottom}>
					<Text style={[styles.title, theme.sectionTitle]}>
						Bem-vindo de volta!
					</Text>

					<Text style={[styles.subtitle, theme.textMuted]}>
						Entre na sua conta para continuar.
					</Text>

					<View style={styles.form}>
						<View style={styles.field}>
							<Text style={[styles.text, theme.textMuted]}>Email</Text>

							<TextInput
								onChange={(str) => setEmail(str)}
								placeholder="Insira seu email"
								type="email"
							/>
						</View>

						<View style={styles.field}>
							<Text style={[styles.text, theme.textMuted]}>Senha</Text>

							<TextInput
								onChange={(str) => setPassword(str)}
								placeholder="Insira sua senha"
								type="password"
							/>
						</View>

						<Text
							onPress={() => {
								router.push("/auth/forgotPassword");
							}}
							style={[styles.link, theme.textMuted]}
						>
							Esqueceu a senha?
						</Text>
						<Text style={[styles.status, theme.textError]}>{error}</Text>
						<SendBtn
							text={loginMutation.isPending ? "Entrando..." : "Entrar"}
							func={handleLogin}
							sty={styles.button}
						/>
					</View>

					<Text style={[styles.register, theme.textMuted]}>
						Ainda não possui uma conta?{" "}
						<Text
							onPress={() => {
								router.push("/auth/signUp");
							}}
							style={[styles.registerLink, theme.sectionTitle]}
						>
							Cadastre-se
						</Text>
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollRoot: {
		flex: 1,
		backgroundColor: colors.bgDark,
	},

	scrollContent: {
		flexGrow: 1,
		alignItems: "center",
	},

	container: {
		flex: 1,
		width: "100%",
		maxWidth: 480,
		minHeight: "100%",
		backgroundColor: colors.bgDark,
	},

	top: {
		minHeight: 220,
		height: "44%",
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
	},

	imageContainer: {
		width: "48%",
		maxWidth: 220,
		aspectRatio: 1,
		borderRadius: border.radius.lg,
		overflow: "hidden",

		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 8,
		},
		shadowOpacity: 0.4,
		shadowRadius: 15,
		elevation: 10,
	},

	img: {
		width: "100%",
		height: "100%",
	},

	bottom: {
		flex: 1,
		backgroundColor: colors.bgDark,
		borderTopLeftRadius: 35,
		borderTopRightRadius: 35,
		marginTop: -30,
		paddingHorizontal: 28,
		paddingTop: 32,
		paddingBottom: 25,
	},

	status: {
		fontSize: typography.fontSize.base,
		color: colors.danger,
		height: 18,
	},

	title: {
		fontSize: typography.fontSize.xxl,
		color: colors.textLight,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.bold,
		lineHeight: 38,
	},

	subtitle: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.regular,
		opacity: 0.7,
		marginTop: 6,
		marginBottom: 25,
	},

	form: {
		gap: spacing.md,
	},

	field: {
		gap: spacing.xs,
	},

	text: {
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.semibold,
	},

	link: {
		alignSelf: "flex-end",
		color: colors.textLight,
		fontSize: typography.fontSize.sm,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.semibold,
		marginTop: -2,
	},

	button: {
		width: "100%",
		borderRadius: border.radius.full,
		marginTop: spacing.xs,
	},

	register: {
		textAlign: "center",
		fontSize: typography.fontSize.base,
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		opacity: 0.7,
		marginTop: spacing.xl,
	},

	registerLink: {
		color: colors.textLight,
		fontWeight: typography.fontWeight.bold,
		opacity: 1,
	},
});
