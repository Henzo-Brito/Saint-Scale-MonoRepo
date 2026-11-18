import { faBullhorn } from "@fortawesome/free-solid-svg-icons/faBullhorn";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import sty from "@/constants/styles";
import theme from "@/theme/theme";

const { colors, typography, spacing, border } = theme;

type Props = {
	title: string;
	subTitle: string;
	targetGroup: string;
	onPress: () => void;
};

export default function AlertCard({
	title,
	subTitle,
	targetGroup,
	onPress,
}: Props) {
	return (
		<TouchableOpacity onPress={onPress} style={styles.container}>
			<View style={styles.row}>
				<FontAwesomeIcon icon={faBullhorn} size={48} color={sty.c1} />
				<View style={styles.textGroup}>
					<Text style={styles.subTitle} numberOfLines={1}>
						{subTitle}
					</Text>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					<Text style={styles.targetGroup} numberOfLines={1}>
						{targetGroup}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: spacing.md,
		backgroundColor: colors.card,
		borderRadius: border.radius.md,
		width: 250,
		maxWidth: 250,
		gap: spacing.sm,
	},
	row: {
		flexDirection: "row",
		gap: spacing.lg,
		alignItems: "center",
	},
	textGroup: {
		flex: 1,
		gap: spacing.sm,
	},
	title: {
		fontWeight: typography.fontWeight.bold,
		fontSize: typography.fontSize.xl,
		overflow: "hidden",
		color: colors.textLight,
	},
	subTitle: {
		fontWeight: typography.fontWeight.medium,
		fontSize: typography.fontSize.sm,
		overflow: "hidden",
		color: colors.textLight,
	},
	targetGroup: {
		fontSize: typography.fontSize.xs,
		color: colors.textMuted,
	},
});
