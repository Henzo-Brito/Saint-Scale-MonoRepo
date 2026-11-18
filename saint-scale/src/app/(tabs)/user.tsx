import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons/faRightFromBracket";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import Section from "@/components/Section";
import RoleTag from "@/components/user/function";
import Info from "@/components/user/info";
import Team from "@/components/user/team";
import sty from "@/constants/styles";
import { useIsAuthenticated } from "@/contexts/AuthContext";
import { logout } from "@/services/auth";
import { getMe, getFuncoes, setFuncoes } from "@/services/users";

export default function UserProfile() {
	const queryClient = useQueryClient();
	const isAuthenticated = useIsAuthenticated();

	// Modal de funções
	const [funcoesModalVisible, setFuncoesModalVisible] = useState(false);
	const [funcoesRascunho, setFuncoesRascunho] = useState<string[]>([]);
	const [funcoesError, setFuncoesError] = useState("");
	// Controla se já perguntou automaticamente nesta sessão
	const autoPromptDone = useRef(false);

	const {
		data: me,
		isLoading,
		isError,
		refetch: refetchMe,
	} = useQuery({
		queryKey: ["user", "me"],
		queryFn: getMe,
		enabled: isAuthenticated === true,
	});

	// Busca funções existentes na igreja para sugestões
	const { data: funcoesDisponiveis = [] } = useQuery({
		queryKey: ["user", "funcoes"],
		queryFn: getFuncoes,
		enabled: isAuthenticated === true,
	});

	const setFuncoesMutation = useMutation({
		mutationFn: setFuncoes,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["user", "me"] });
			setFuncoesModalVisible(false);
			setFuncoesError("");
		},
		onError: () => {
			setFuncoesError("Erro ao salvar funções. Tente novamente.");
		},
	});

	// Abre o modal automaticamente se o usuário não tem funções ainda
	// e há funções disponíveis para selecionar
	useEffect(() => {
		if (me && !autoPromptDone.current && me.funcoes.length === 0 && funcoesDisponiveis.length > 0) {
			autoPromptDone.current = true;
			// Pequeno delay para a tela renderizar antes de abrir
			const t = setTimeout(() => {
				setFuncoesRascunho([]);
				setFuncoesModalVisible(true);
			}, 600);
			return () => clearTimeout(t);
		}
	}, [me, funcoesDisponiveis]);

	function openFuncoesModal() {
		setFuncoesRascunho(me?.funcoes ?? []);
		setFuncoesError("");
		setFuncoesModalVisible(true);
	}

	function toggleFuncao(nome: string) {
		setFuncoesRascunho((prev) =>
			prev.some((f) => f.toLowerCase() === nome.toLowerCase())
				? prev.filter((f) => f.toLowerCase() !== nome.toLowerCase())
				: [...prev, nome],
		);
	}

	function saveFuncoes() {
		setFuncoesMutation.mutate(funcoesRascunho);
	}

	function handleEditSuccess() {
		queryClient.invalidateQueries({ queryKey: ["user", "me"] });
	}

	async function handleLogout() {
		if (Platform.OS === "web") {
			if (!window.confirm("Deseja realmente sair da sua conta?")) return;
			await logout();
			router.replace("/auth");
			return;
		}

		Alert.alert(
			"Sair",
			"Deseja realmente sair da sua conta?",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Sair",
					style: "destructive",
					onPress: async () => {
						await logout();
						router.replace("/auth");
					},
				},
			],
			{ cancelable: true },
		);
	}

	function formatDate(isoDate: string): string {
		const [year, month, day] = isoDate.split("T")[0].split("-");
		return `${day}/${month}/${year}`;
	}

	function formatPhone(phone: string | null): string {
		if (!phone) return "Não cadastrado";
		if (phone.length === 11) {
			return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
		}
		return phone;
	}

	function formatAddress(logradouro: { rua: string; numero: number } | null): string {
		if (!logradouro) return "Não cadastrado";
		return `${logradouro.rua}, ${logradouro.numero}`;
	}

	function formatBirthDate(date: string | null): string {
		if (!date) return "Não cadastrado";
		const [year, month, day] = date.split("-");
		return `${day}/${month}/${year}`;
	}

	if (isLoading) {
		return (
			<View style={[style.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
				<ActivityIndicator size="large" color={sty.c1} />
			</View>
		);
	}

	if (isError || !me) {
		return (
			<View style={[style.container, { justifyContent: "center", alignItems: "center", flex: 1 }]}>
				<Text style={style.errorText}>Erro ao carregar perfil</Text>
				<TouchableOpacity onPress={() => refetchMe()} style={style.retryBtn}>
					<Text style={style.retryBtnText}>Tentar novamente</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// Funções disponíveis para seleção (todas da igreja)
	const todasFuncoes = funcoesDisponiveis;

	return (
		<ScrollView
			style={{ flex: 1, backgroundColor: sty.c7 }}
			contentContainerStyle={style.container}
		>
			<View style={style.boxUser}>
				<View>
					{me.img_id ? (
						<Image source={{ uri: me.img_id }} style={style.photo} />
					) : (
						<Image source={require("@/assets/hz.jpg")} style={style.photo} />
					)}
				</View>
				<View style={{ flex: 1, gap: 6, overflow: "hidden" }}>
					<Text style={style.name} numberOfLines={2}>{me.nome}</Text>
					<Text style={style.register}>Registro: {formatDate(me.data_registro)}</Text>
				</View>
				<TouchableOpacity style={style.logoutBtn} onPress={handleLogout}>
					<FontAwesomeIcon icon={faRightFromBracket} size={20} color={sty.c10} />
				</TouchableOpacity>
			</View>

			<View style={style.function}>
				{me.funcoes.map((funcao) => (
					<RoleTag key={funcao} title={funcao} />
				))}
				<TouchableOpacity style={style.plus} onPress={openFuncoesModal}>
					<FontAwesomeIcon icon={faPlus} size={18} color={sty.c7} />
				</TouchableOpacity>
			</View>

			{me.equipes?.length > 0 && (
				<Section title="Equipes" titleSize={20}>
					{me.equipes.map((equipe) => (
						<Team
							key={equipe.title}
							img={equipe.img_id ? { uri: equipe.img_id } : require("@/assets/av.jpg")}
							name={equipe.title}
							valPart={equipe.quant_part}
						/>
					))}
				</Section>
			)}

			{me.ministerios?.length > 0 && (
				<Section title="Ministérios" titleSize={20}>
					{me.ministerios.map((ministerio) => (
						<Team
							key={ministerio.id}
							img={require("@/assets/av.jpg")}
							name={ministerio.nome}
							valPart={0}
						/>
					))}
				</Section>
			)}

			<Text style={style.title}>Infos</Text>

			<Info
				email={me.email}
				address={formatAddress(me.logradouro)}
				birth={formatBirthDate(me.data_nascimento)}
				phone={formatPhone(me.telefone)}
				onEditSuccess={handleEditSuccess}
			/>

			{/* ── Modal de Funções ─────────────────────────────────────── */}
			<Modal visible={funcoesModalVisible} transparent animationType="fade">
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={style.modalOverlay}
				>
					<View style={style.modalBox}>
						<Text style={style.modalTitle}>
							{me.funcoes.length === 0 ? "Qual é a sua função?" : "Minhas Funções"}
						</Text>
						{me.funcoes.length === 0 && (
							<Text style={style.modalSubtitle}>
								Selecione as funções que você exerce na igreja.
							</Text>
						)}

						{todasFuncoes.length === 0 ? (
							<Text style={style.modalSubtitle}>
								Nenhuma função cadastrada na sua igreja ainda. Peça ao administrador para adicionar funções.
							</Text>
						) : (
							<View style={style.tagsRow}>
								{todasFuncoes.map((f) => {
									const selecionada = funcoesRascunho.some(
										(r) => r.toLowerCase() === f.nome.toLowerCase(),
									);
									return (
										<TouchableOpacity
											key={f.id}
											style={selecionada ? style.tagSelected : style.tagSugestao}
											onPress={() => toggleFuncao(f.nome)}
										>
											<Text style={selecionada ? style.tagSelectedText : style.tagSugestaoText}>
												{f.nome}
											</Text>
											{selecionada && (
												<FontAwesomeIcon icon={faTimes} size={11} color={sty.c14} />
											)}
										</TouchableOpacity>
									);
								})}
							</View>
						)}

						{funcoesError ? <Text style={style.modalError}>{funcoesError}</Text> : null}

						<View style={style.modalActions}>
							<TouchableOpacity
								style={style.modalBtnCancel}
								onPress={() => setFuncoesModalVisible(false)}
								disabled={setFuncoesMutation.isPending}
							>
								<Text style={style.modalBtnCancelText}>
									{me.funcoes.length === 0 ? "Pular" : "Cancelar"}
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								style={style.modalBtnSave}
								onPress={saveFuncoes}
								disabled={setFuncoesMutation.isPending}
							>
								{setFuncoesMutation.isPending ? (
									<ActivityIndicator size="small" color={sty.c14} />
								) : (
									<Text style={style.modalBtnSaveText}>Salvar</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</ScrollView>
	);
}

const style = StyleSheet.create({
	container: {
		padding: 15,
		gap: 18,
	},
	title: {
		color: sty.c4,
		fontSize: 20,
		width: "100%",
	},
	boxUser: {
		flexDirection: "row",
		gap: 17,
		alignItems: "flex-start",
	},
	photo: {
		width: 110,
		height: 110,
		borderRadius: 14,
	},
	logoutBtn: {
		backgroundColor: sty.c8,
		padding: 10,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
	},
	name: {
		color: sty.c4,
		fontSize: 27,
		fontWeight: "700" as const,
	},
	register: {
		color: sty.c4,
		fontSize: 12,
	},
	function: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	plus: {
		backgroundColor: sty.c8,
		padding: 6,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 50,
	},
	errorText: {
		color: sty.c10,
		fontSize: 18,
		textAlign: "center",
	},
	retryBtn: {
		backgroundColor: sty.c8,
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 16,
	},
	retryBtnText: {
		color: sty.c4,
		fontSize: 14,
		fontWeight: "600",
	},

	// Modal de funções
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	modalBox: {
		width: "100%",
		maxWidth: 420,
		backgroundColor: sty.c11,
		borderRadius: 20,
		padding: 24,
		gap: 14,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "700",
		color: sty.c4,
	},
	modalSubtitle: {
		fontSize: 13,
		color: sty.c5,
		marginTop: -8,
	},
	tagsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	tagSelected: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
		backgroundColor: sty.c1,
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	tagSelectedText: {
		color: sty.c14,
		fontSize: 13,
		fontWeight: "600",
	},
	tagSugestao: {
		backgroundColor: sty.c8,
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderWidth: 1,
		borderColor: sty.c9,
	},
	tagSugestaoText: {
		color: sty.c4,
		fontSize: 13,
	},
	sugestoesLabel: {
		fontSize: 12,
		color: sty.c5,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	inputRow: {
		flexDirection: "row",
		gap: 8,
		alignItems: "center",
	},
	funcaoInput: {
		flex: 1,
		backgroundColor: sty.c8,
		borderRadius: 10,
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontSize: 15,
		color: sty.c4,
		borderWidth: 1,
		borderColor: sty.c9,
	},
	addBtn: {
		backgroundColor: sty.c1,
		borderRadius: 10,
		padding: 11,
		alignItems: "center",
		justifyContent: "center",
	},
	modalError: {
		fontSize: 13,
		color: sty.c10,
		textAlign: "center",
	},
	modalActions: {
		flexDirection: "row",
		gap: 10,
		marginTop: 4,
	},
	modalBtnCancel: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: sty.c8,
	},
	modalBtnCancelText: {
		color: sty.c5,
		fontWeight: "600",
		fontSize: 15,
	},
	modalBtnSave: {
		flex: 1,
		paddingVertical: 13,
		borderRadius: 12,
		alignItems: "center",
		backgroundColor: sty.c1,
	},
	modalBtnSaveText: {
		color: sty.c14,
		fontWeight: "700",
		fontSize: 15,
	},
});
