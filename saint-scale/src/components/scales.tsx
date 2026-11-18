import { Music, UserRound, UserRoundCheck } from "lucide-react-native";
import {
	Image,
	type ImageSourcePropType,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	type ViewStyle,
} from "react-native";
import theme from "@/theme/theme";
import type { ScaleDate, Status } from "@/types/scales.type";
import StatBadge from "@/components/home/StatBadge";

const { colors, typography, spacing, border } = theme;

export type Props = {
	scaleDate: ScaleDate;
	Persons: ImageSourcePropType[];
	title: string;
	status: Status;
	onPress: () => void;
	styles?: ViewStyle;
};

export default function Scales({
	scaleDate,
	Persons,
	title,
	status,
	onPress,
	styles,
}: Props) {
	function renderPersonAvatars() {
		return Persons.slice(0, 5).map((personImg, i) => (
			<Image
				source={personImg}
				// biome-ignore lint/suspicious/noArrayIndexKey: Persons é um array de imagens sem IDs únicos; a ordem é estável e determinada externamente.
				key={`person-${i}`}
				style={[style.img, { zIndex: -i }]}
			/>
		));
	}

	return (
		<TouchableOpacity style={[style.container, styles]} onPress={onPress}>
			<View style={style.header}>
				<Text style={style.left}>
					{scaleDate.WeekDay}, {scaleDate.hour}
				</Text>
				<Text style={style.right}>
					{scaleDate.Day} de {scaleDate.Month}
				</Text>
			</View>

			<Text style={style.title}>{title}</Text>

			<View style={style.persons}>{renderPersonAvatars()}</View>
			<View style={style.status}>
				<StatBadge
					color={colors.card}
					icon={UserRound}
					width={50}
					title={status.persons.toString()}
				/>
				<StatBadge
					color={colors.card}
					icon={UserRoundCheck}
					width={50}
					title={status.confirmed.toString()}
				/>
				<StatBadge
					color={colors.card}
					icon={Music}
					width={50}
					title={status.songs.toString()}
				/>
			</View>
		</TouchableOpacity>
	);
}

const style = StyleSheet.create({
	container: {
		backgroundColor: colors.main,
		borderRadius: border.radius.md,
		padding: spacing.md,
		width: 250,
		gap: spacing.xs,
	},
	header: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "space-between",
		alignItems: "center",
	},
	left: {
		color: colors.textMuted,
		fontWeight: typography.fontWeight.medium,
		fontSize: typography.fontSize.sm,
	},
	right: {
		color: colors.textMuted,
		fontWeight: typography.fontWeight.medium,
		fontSize: typography.fontSize.sm,
	},
	title: {
		color: colors.bgDark,
		fontWeight: typography.fontWeight.bold,
		fontSize: typography.fontSize.xl,
	},
	persons: {
		paddingHorizontal: spacing.xs,
		flexDirection: "row",
	},
	img: {
		width: 40,
		height: 40,
		borderRadius: border.radius.full,
		marginLeft: -10,
		borderWidth: 3,
		borderColor: colors.main,
	},
	status: {
		paddingTop: spacing.sm,
		flexDirection: "row",
		gap: spacing.sm,
		alignItems: "center",
	},
});
