import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import theme from "@/theme/theme";

const { colors, typography, spacing, border } = theme;

type Props = {
	title: string;
	subTitle: string;
};

export default function Notice({ title, subTitle }: Props) {
	return (
		<TouchableOpacity style={styles.container}>
			<View style={styles.row}>
				<FontAwesomeIcon icon={faBell} size={30} color={colors.inputBorder} />
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
				<Text style={styles.subTitle} numberOfLines={1}>
					{subTitle}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
		backgroundColor: colors.card,
		borderRadius: border.radius.md,
		width: "100%",
	},
	row: {
		alignItems: "center",
		flexDirection: "row",
		gap: spacing.lg,
		width: "100%",
		justifyContent: "space-between",
	},
	title: {
		flex: 1,
		fontWeight: typography.fontWeight.semibold,
		fontSize: typography.fontSize.lg,
		overflow: "hidden",
		color: colors.textLight,
	},
	subTitle: {
		fontWeight: typography.fontWeight.bold,
		fontSize: typography.fontSize.xs,
		flexShrink: 0,
		overflow: "hidden",
		color: colors.primary,
		textAlign: "right",
	},
});
