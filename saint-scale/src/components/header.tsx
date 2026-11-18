import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "@/theme/theme";

const { colors, typography, spacing } = theme;

type Props = {
	title: string;
	children?: React.ReactNode;
};

export default function Header({ title, children }: Props) {
	return (
		<SafeAreaView style={[style.container, theme.screenPadding]} edges={["top"]}>
			<Text style={[style.title, theme.sectionTitle]}>{title}</Text>
			{children}
		</SafeAreaView>
	);
}

const style = StyleSheet.create({
	container: {
		gap: spacing.xs,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		paddingBottom: spacing.sm,
		backgroundColor: colors.bgTabs,
	},
	title: {
		fontWeight: typography.fontWeight.bold,
		fontFamily: typography.fontMain,
		fontSize: typography.fontSize.xxl,
		color: colors.textLight,
		flex: 1,
	},
});
