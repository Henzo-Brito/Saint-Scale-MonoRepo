import { ArrowRight } from "lucide-react-native";
import {
	type StyleProp,
	StyleSheet,
	Text,
	TouchableOpacity,
	type ViewStyle,
} from "react-native";
import theme from "@/theme/theme";

const { colors, typography, spacing, border } = theme;

type Props = {
	text: string;
	bgcolor?: string;
	sty?: StyleProp<ViewStyle>;
	func?: () => void;
};

export default function ContinueBtn({
	text,
	sty,
	bgcolor = colors.primary,
	func,
}: Props) {
	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: bgcolor,
				},
				sty,
			]}
			onPress={func}
		>
			<Text style={styles.text}>{text}</Text>
			<ArrowRight strokeWidth={2.5}></ArrowRight>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		borderRadius: border.radius.full,
		padding: spacing.md,
		justifyContent: "center",
		alignItems: "center",
		flexDirection: "row",
		gap: spacing.sm,
	},
	text: {
		fontSize: typography.fontSize.lg,
		fontWeight: typography.fontWeight.bold,
		fontFamily: typography.fontMain,
	},
});
