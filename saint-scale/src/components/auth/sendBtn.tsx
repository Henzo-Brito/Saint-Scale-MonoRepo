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
	disabled?: boolean;
};

export default function SendBtn({
	text,
	sty,
	bgcolor = colors.primary,
	func,
	disabled = false,
}: Props) {
	return (
		<TouchableOpacity
			style={[
				styles.container,
				{
					backgroundColor: disabled ? colors.elevated : bgcolor,
				},
				sty,
			]}
			onPress={disabled ? undefined : func}
			disabled={disabled}
		>
			<Text style={[styles.text, disabled && { color: colors.textMuted }]}>
				{text}
			</Text>
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
	},
	text: {
		fontSize: typography.fontSize.xl,
		fontWeight: typography.fontWeight.bold,
		fontFamily: typography.fontMain,
	},
});
