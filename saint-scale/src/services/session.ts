import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Módulo responsável pela gestão da sessão do usuário.
 *
 * Em dispositivos nativos (iOS/Android): usa expo-secure-store (armazenamento seguro).
 * Em ambiente web (desenvolvimento/browser): usa localStorage como fallback,
 * pois expo-secure-store não está disponível fora de dispositivos nativos.
 *
 * Expõe dois mecanismos de notificação para o _layout reagir reativamente:
 * - onSessionSaved: disparado após login bem-sucedido
 * - onSessionCleared: disparado após logout ou expiração de token (401)
 */

const TOKEN_KEY = "saint_scale_access_token";

/** Callback registrada pelo _layout para reagir ao login. */
let _onSessionSavedCallback: (() => void) | null = null;

/** Callback registrada pelo _layout para reagir à limpeza de sessão. */
let _onSessionClearedCallback: (() => void) | null = null;

/** Adapta o armazenamento conforme a plataforma. */
const storage = {
	async set(key: string, value: string): Promise<void> {
		if (Platform.OS === "web") {
			localStorage.setItem(key, value);
		} else {
			await SecureStore.setItemAsync(key, value);
		}
	},

	async get(key: string): Promise<string | null> {
		if (Platform.OS === "web") {
			return localStorage.getItem(key);
		}
		return SecureStore.getItemAsync(key);
	},

	async remove(key: string): Promise<void> {
		if (Platform.OS === "web") {
			localStorage.removeItem(key);
		} else {
			await SecureStore.deleteItemAsync(key);
		}
	},
};

export const session = {
	/**
	 * Salva o token de acesso e notifica o _layout.
	 * Nativo: SecureStore | Web: localStorage
	 */
	async save(token: string): Promise<void> {
		await storage.set(TOKEN_KEY, token);
		_onSessionSavedCallback?.();
	},

	/**
	 * Carrega o token de acesso.
	 * @returns Token JWT ou null se não houver sessão ativa
	 */
	async load(): Promise<string | null> {
		return storage.get(TOKEN_KEY);
	},

	/**
	 * Remove o token e notifica o _layout.
	 * Usado no logout explícito ou quando o interceptor recebe 401.
	 */
	async clear(): Promise<void> {
		await storage.remove(TOKEN_KEY);
		_onSessionClearedCallback?.();
	},

	/** Registra callback chamada após login (token salvo). */
	onSessionSaved(callback: () => void): void {
		_onSessionSavedCallback = callback;
	},

	/** Remove a callback de login. */
	offSessionSaved(): void {
		_onSessionSavedCallback = null;
	},

	/** Registra callback chamada quando a sessão é limpa (logout ou 401). */
	onSessionCleared(callback: () => void): void {
		_onSessionClearedCallback = callback;
	},

	/** Remove a callback de limpeza de sessão. */
	offSessionCleared(): void {
		_onSessionClearedCallback = null;
	},
};
