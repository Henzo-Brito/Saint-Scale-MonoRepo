import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AuthContext } from "@/contexts/AuthContext";
import { session } from "@/services/session";

const queryClient = new QueryClient();

/**
 * Tela de carregamento exibida enquanto o token é verificado no SecureStore.
 * Evita tela branca (flash de conteúdo) durante a inicialização do app.
 */
function LoadingScreen() {
	return (
		<View style={styles.loading}>
			<ActivityIndicator size="large" color="#7C3AED" />
		</View>
	);
}

/**
 * Layout raiz com proteção de rotas.
 *
 * Rotas públicas (sem token necessário):
 * - /auth/* (onboarding, login, signUp, forgotPassword)
 *
 * Rotas protegidas (requerem token válido):
 * - /(tabs)/* (home, warnings, user)
 * - /scale/[id]
 * - /music/[id]
 * - /avisos/[id]
 *
 * Mecanismo reativo:
 * - Ao montar, registra session.onSessionCleared() para ser notificado quando
 *   o interceptor de 401 em api.ts limpar o token durante uso ativo do app.
 *   Isso garante que o usuário seja redirecionado imediatamente sem precisar
 *   fechar e reabrir o aplicativo.
 */
export default function RootLayout() {
	const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
	const segments = useSegments();
	const router = useRouter();

	// Ref para evitar navegação redundante em loops de efeito
	const isNavigating = useRef(false);

	useEffect(() => {
		// Verifica token ao inicializar o app
		async function checkAuth() {
			const token = await session.load();
			const authenticated = !!token;
			setIsAuthenticated(authenticated);

			// Não faz prefetch automático na montagem: o usuário pode
			// navegar para qualquer tela protegida, não apenas a home.
			// Os dados são carregados por cada tela via useQuery quando necessário.
		}

		checkAuth();

		// Reage ao login: token foi salvo → marca como autenticado
		session.onSessionSaved(() => {
			setIsAuthenticated(true);
		});

		// Reage ao logout/401: token foi removido → marca como não autenticado
		session.onSessionCleared(() => {
			setIsAuthenticated(false);
			queryClient.clear();
		});

		return () => {
			session.offSessionSaved();
			session.offSessionCleared();
		};
	}, []);

	useEffect(() => {
		// Aguarda verificação inicial antes de redirecionar
		if (isAuthenticated === null) return;
		if (isNavigating.current) return;

		const inAuthGroup = segments[0] === "auth";

		if (!isAuthenticated && !inAuthGroup) {
			// Sessão inexistente ou expirada — redireciona para onboarding
			isNavigating.current = true;
			router.replace("/auth");
			setTimeout(() => {
				isNavigating.current = false;
			}, 500);
		} else if (isAuthenticated && inAuthGroup) {
			// Usuário autenticado tentando acessar rota pública — redireciona para home
			isNavigating.current = true;
			router.replace("/(tabs)");
			setTimeout(() => {
				isNavigating.current = false;
			}, 500);
		}
	}, [isAuthenticated, segments, router.replace]);

	// Exibe tela de carregamento enquanto verifica o token no SecureStore.
	// Isso evita o flash de conteúdo protegido antes do redirect.
	if (isAuthenticated === null) {
		return <LoadingScreen />;
	}

	return (
		<QueryClientProvider client={queryClient}>
			<AuthContext.Provider value={isAuthenticated}>
				<Stack screenOptions={{ headerShown: false }} />
			</AuthContext.Provider>
		</QueryClientProvider>
	);
}

const styles = StyleSheet.create({
	loading: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#0F0F0F",
	},
});
