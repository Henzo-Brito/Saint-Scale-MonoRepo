import { faUserMinus } from "@fortawesome/free-solid-svg-icons/faUserMinus";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import {
	Image,
	type ImageSourcePropType,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import theme from "@/theme/theme";

const { colors, typography, spacing, border } = theme;

type Props = {
	title: string;
	img: ImageSourcePropType;
	/** Função/instrumento do membro indisponível (ex.: "Guitarra"). */
	memberRole: string;
	subTitle: string;
	onPress: () => void;
};

/** Card de indisponibilidade de membro exibido na seção Home. */
export default function Outages({
	title,
	subTitle,
	img,
	memberRole,
	onPress,
}: Props) {
	return (
		<TouchableOpacity style={style.container} onPress={onPress}>
			<View style={style.row}>
				<Image style={style.img} source={img} />
				<View style={{ flex: 1 }}>
					<Text style={style.subTitle} numberOfLines={1}>
						{subTitle}
					</Text>
					<Text style={style.title} numberOfLines={1}>
						{title}
					</Text>
				</View>
			</View>
			<View style={style.row}>
				<FontAwesomeIcon icon={faUserMinus} size={15} color={colors.bgDark} />
				<Text style={[style.subTitle, { color: colors.bgDark, fontWeight: "800" }]}>
					{memberRole}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

const style = StyleSheet.create({
	container: {
		padding: spacing.md,
		backgroundColor: colors.primary,
		borderRadius: border.radius.md,
		width: 200,
		maxWidth: 200,
		gap: spacing.sm,
	},
	img: {
		width: 40,
		height: 40,
		borderRadius: 6,
	},
	row: {
		flexDirection: "row",
		gap: spacing.sm,
		alignItems: "center",
	},
	title: {
		fontWeight: typography.fontWeight.bold,
		fontSize: typography.fontSize.base,
		overflow: "hidden",
		color: colors.bgDark,
	},
	subTitle: {
		fontWeight: typography.fontWeight.bold,
		fontSize: typography.fontSize.xs,
		overflow: "hidden",
		color: colors.bgDark,
	},
});
