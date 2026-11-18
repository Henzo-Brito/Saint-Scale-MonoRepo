import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { SafeAreaView, StyleSheet, Text } from "react-native";
import IconBtn from "../iconBtn";
import theme from "@/theme/theme";

const { colors, typography, spacing } = theme;

type Props = {
	title?: string;
	children?: React.ReactNode;
};

export default function ReturnHeader({ title, children }: Props) {
	return (
		<SafeAreaView style={style.container}>
			<IconBtn
				func={() => {
					router.back();
				}}
				icon={ChevronLeft}
				color={colors.textLight}
				stroke={3}
				size={25}
			/>

			<Text style={[style.title, theme.sectionTitle]}>{title}</Text>

			{children}
		</SafeAreaView>
	);
}

const style = StyleSheet.create({
	container: {
		flexDirection: "row",
		padding: spacing.lg,
		alignItems: "center",
		justifyContent: "space-between",
		width: "100%",
	},
	title: {
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.semibold,
		color: colors.textLight,
	},
});
