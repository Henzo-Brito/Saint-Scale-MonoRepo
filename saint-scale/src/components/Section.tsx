import type { ReactNode } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import theme from "@/theme/theme";

const { colors, typography, spacing } = theme;

type Props = {
	title: string;
	mes?: string;
	btnTitle?: string;
	titleSize?: number;
	onPress?: () => void;
	children: ReactNode;
};

export default function Section({
	title,
	mes,
	btnTitle = "ver todos >",
	titleSize = 18,
	onPress,
	children,
}: Props) {
	return (
		<View style={styles.container}>
			<View style={styles.topper}>
				<Text style={[styles.title, { fontSize: titleSize }]} numberOfLines={1}>
					{title}
					{mes}
				</Text>
				{onPress && (
					<TouchableOpacity onPress={onPress}>
						<Text style={styles.btnText} numberOfLines={1}>
							{btnTitle}
						</Text>
					</TouchableOpacity>
				)}
			</View>
			<ScrollView
				contentContainerStyle={styles.children}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
			>
				{children}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		columnGap: spacing.md,
		rowGap: spacing.sm,
	},
	title: {
		color: colors.textLight,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.semibold,
		flex: 1,
		overflow: "hidden",
	},
	topper: {
		alignItems: "center",
		justifyContent: "space-between",
		flexDirection: "row",
		width: "100%",
	},
	btnText: {
		color: colors.textMuted,
		fontFamily: typography.fontMain,
		fontWeight: typography.fontWeight.bold,
		textAlign: "right",
		fontSize: typography.fontSize.base,
	},
	children: {
		flexDirection: "row",
		gap: spacing.md,
	},
});
