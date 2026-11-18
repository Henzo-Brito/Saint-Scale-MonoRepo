import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import AlertCard from "@/components/avisos/AlertCard";
import Notice from "@/components/avisos/notice";
import Section from "@/components/Section";
import sty from "@/constants/styles";
import theme from "@/theme/theme";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { getReminder } from "@/services/alerts";

const { colors, typography, spacing, border } = theme;

export default function Warnings() {
	const isAuthenticated = useIsAuthenticated();

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["alerts", "reminder"],
		queryFn: getReminder,
		enabled: isAuthenticated === true,
	});

	if (isLoading) {
		return (
			<View
				style={[
					style.container,
					{ justifyContent: "center", alignItems: "center", flex: 1 },
				]}
			>
				<ActivityIndicator size="large" color={sty.c1} />
			</View>
		);
	}

	if (isError || !data) {
		return (
			<View
				style={[
					style.container,
					{ justifyContent: "center", alignItems: "center", flex: 1 },
				]}
			>
				<Text style={[style.errorText, theme.textError]}>
					Erro ao carregar avisos
				</Text>
				<TouchableOpacity
					onPress={() => refetch()}
					style={[style.retryBtn, theme.primaryButton]}
				>
					<Text style={[style.retryBtnText, theme.primaryButtonText]}>
						Tentar novamente
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<ScrollView
			style={[theme.screen, { backgroundColor: colors.bgTabs }]}
			contentContainerStyle={style.container}
		>
			{data.alert.length > 0 && (
				<Section title="Alertas">
					{data.alert.map((alert) => (
						<AlertCard
							key={alert.id_lembrete}
							title={alert.name}
							subTitle={alert.date}
							targetGroup={alert.functions.join(", ")}
							onPress={() => {
								router.push(`/avisos/${alert.id_lembrete}`);
							}}
						/>
					))}
				</Section>
			)}

			{data.notifications.length > 0 && (
				<>
					<Text style={[style.title, theme.sectionTitle]}>
						Notificações
					</Text>
					{data.notifications.map((notification) => (
						<Notice
							key={notification.id_notification}
							title={notification.title}
							subTitle={notification.date}
						/>
					))}
				</>
			)}

			{data.alert.length === 0 && data.notifications.length === 0 && (
				<Text style={[style.emptyText, theme.textMuted]}>
					Nenhum aviso ou notificação no momento
				</Text>
			)}
		</ScrollView>
	);
}

const style = StyleSheet.create({
	container: {
		padding: spacing.lg,
		gap: spacing.xl,
	},
	title: {
		color: colors.textLight,
		fontWeight: typography.fontWeight.semibold,
		fontSize: typography.fontSize.lg,
		width: "100%",
	},
	errorText: {
		color: colors.danger,
		fontSize: typography.fontSize.base,
		textAlign: "center",
	},
	retryBtn: {
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: border.radius.md,
		marginTop: spacing.md,
	},
	retryBtnText: {
		color: colors.bgDark,
		fontSize: typography.fontSize.base,
		fontWeight: typography.fontWeight.bold,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: typography.fontSize.base,
		textAlign: "center",
		padding: spacing.xl,
	},
});
