import type { LucideIcon } from "lucide-react-native";
import { type DimensionValue, StyleSheet, Text, View } from "react-native";
import theme from "@/theme/theme";

const { colors, typography, spacing } = theme;

type Props = {
	/** Texto exibido ao lado do ícone (ex.: contagem de membros). */
	title: string;
	icon: LucideIcon;
	/** Largura total do badge, incluindo ícone e texto. Padrão: 35. */
	width?: DimensionValue;
	color?: string;
};

/**
 * Mini-badge com ícone e texto usado nos cards de escala para exibir
 * contagens de status (membros, confirmados, músicas).
 */
export default function StatBadge({
	title,
	icon: Icon,
	width = 35,
	color = colors.textMuted,
}: Props) {
	return (
		<View style={[styles.container, { width }]}>
			<Icon size={17} color={color} strokeWidth={3} />
			<Text style={[styles.title, { color }]} numberOfLines={1}>
				{title}
			</Text>
		</View>
	);
}

// StyleSheet fora do componente para evitar recriação a cada render.
const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
	},
	title: {
		fontWeight: typography.fontWeight.bold,
		fontFamily: typography.fontMain,
		fontSize: typography.fontSize.base,
		flex: 1,
		textAlign: "left",
		overflow: "hidden",
	},
});
