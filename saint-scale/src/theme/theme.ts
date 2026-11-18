/**
 * Tema unificado do SaintScale (React Native).
 * Reutiliza a paleta de cores existente em @/constants/styles para não
 * alterar a identidade visual do produto, apenas organizar e aplicar
 * estilos de forma consistente nas telas.
 */

import type { ViewStyle, TextStyle, ImageStyle } from "react-native";

// ──────────────────────────────────────────────────────────────────────
// Cores (mantidas do constants/styles.ts)
// ──────────────────────────────────────────────────────────────────────
export const colors = {
	// Primárias
	primary: "rgba(255, 151, 32, 1)",   // laranja accent c1
	secondary: "rgb(131, 43, 255)",     // roxo vivo c2
	main: "rgb(122, 51, 255)",          // roxo principal c3
	textLight: "rgb(248, 244, 255)",    // texto claro c4
	textMuted: "rgb(145, 123, 255)",    // texto secundário c5
	bgDark: "rgb(18, 14, 26)",          // fundo muito escuro c6
	bgTabs: "rgb(24, 21, 41)",          // fundo das tabs c7
	card: "#342971",                    // fundo de cards c8
	inputBorder: "rgb(152, 64, 253)",   // borda input c9
	error: "rgb(255, 43, 71)",          // erro/alerta c10
	elevated: "#201B42",                // fundo elementos elevados c11

	// Telas de detalhe
	bgDetail: "#161324",                // c12
	cardDetail: "#25203D",              // c13
	cardInner: "#110E1B",               // c14
	borderLine: "#3A3455",              // c15
	textMutedLight: "#A29DB8",          // c16
	iconMid: "#7F67BE",                 // c17
	neon: "#9A73FF",                    // c18
	placeholder: "#D9D9D9",             // c19

	// Semânticas
	success: "rgb(131, 43, 255)",
	warning: "rgba(255, 151, 32, 1)",
	danger: "rgb(255, 43, 71)",
	background: "rgb(24, 21, 41)",
	surface: "#342971",
} as const;

// ──────────────────────────────────────────────────────────────────────
// Tipografia
// ──────────────────────────────────────────────────────────────────────
export const typography = {
	fontMain: "Calibri",
	fontSize: {
		xs: 11,
		sm: 13,
		base: 16,
		lg: 18,
		xl: 23,
		xxl: 25,
	},
	fontWeight: {
		regular: "400" as const,
		medium: "500" as const,
		semibold: "600" as const,
		bold: "700" as const,
		extrabold: "900" as const,
	},
} as const;

// ──────────────────────────────────────────────────────────────────────
// Espaçamentos
// ──────────────────────────────────────────────────────────────────────
export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 20,
	xxl: 24,
} as const;

// ──────────────────────────────────────────────────────────────────────
// Bordas / Raio
// ──────────────────────────────────────────────────────────────────────
export const border = {
	radius: {
		sm: 6,
		md: 10,
		lg: 16,
		full: 9999,
	},
	width: 1,
	color: "#3A3455",
} as const;

// ──────────────────────────────────────────────────────────────────────
// Helpers de estilo (StyleSheet.create já é usado pelas telas; aqui
// entregamos objetos prontos para mesclar com StyleSheet.create)
// ──────────────────────────────────────────────────────────────────────

export const screen: ViewStyle = {
	flex: 1,
	backgroundColor: colors.bgTabs,
};

export const screenPadding: ViewStyle = {
	padding: spacing.lg,
	gap: spacing.md,
};

export const card: ViewStyle = {
	backgroundColor: colors.card,
	borderRadius: border.radius.md,
	padding: spacing.md,
};

export const cardDetail: ViewStyle = {
	backgroundColor: colors.cardDetail,
	borderRadius: border.radius.md,
	padding: spacing.md,
};

export const sectionHeader: TextStyle = {
	color: colors.textLight,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.lg,
	fontWeight: typography.fontWeight.semibold,
	width: "100%",
};

export const sectionTitle: TextStyle = {
	color: colors.textLight,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.xl,
	fontWeight: typography.fontWeight.bold,
	width: "100%",
};

export const textMuted: TextStyle = {
	color: colors.textMuted,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.sm,
};

export const textError: TextStyle = {
	color: colors.danger,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.base,
	textAlign: "center",
};

export const primaryButton: ViewStyle = {
	backgroundColor: colors.primary,
	borderRadius: border.radius.md,
	paddingVertical: spacing.md,
	paddingHorizontal: spacing.lg,
	alignItems: "center",
};

export const primaryButtonText: TextStyle = {
	color: colors.bgDark,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.base,
	fontWeight: typography.fontWeight.bold,
};

export const secondaryButton: ViewStyle = {
	backgroundColor: colors.secondary,
	borderRadius: border.radius.md,
	paddingVertical: spacing.md,
	paddingHorizontal: spacing.lg,
	alignItems: "center",
};

export const secondaryButtonText: TextStyle = {
	color: colors.textLight,
	fontFamily: typography.fontMain,
	fontSize: typography.fontSize.base,
	fontWeight: typography.fontWeight.bold,
};

export const inputContainer: ViewStyle = {
	backgroundColor: colors.bgDark,
	borderWidth: border.width,
	borderColor: colors.inputBorder,
	borderRadius: border.radius.md,
	paddingHorizontal: spacing.md,
	paddingVertical: spacing.sm,
};

export const inputText: TextStyle = {
	color: colors.textLight,
	fontFamily: typography.fontMain,
	paddingLeft: 10,
	fontSize: typography.fontSize.base,
};

export const imageAvatar: ImageStyle = {
	width: 40,
	height: 40,
	borderRadius: border.radius.full,
} as ImageStyle;

export default {
	colors,
	typography,
	spacing,
	border,
	screen,
	screenPadding,
	card,
	cardDetail,
	sectionHeader,
	sectionTitle,
	textMuted,
	textError,
	primaryButton,
	primaryButtonText,
	secondaryButton,
	secondaryButtonText,
	inputContainer,
	inputText,
	imageAvatar,
};
