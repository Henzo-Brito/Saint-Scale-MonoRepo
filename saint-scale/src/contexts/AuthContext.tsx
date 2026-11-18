import { createContext, useContext } from "react";

export const AuthContext = createContext<boolean | null>(null);

export function useIsAuthenticated(): boolean | null {
	return useContext(AuthContext);
}
