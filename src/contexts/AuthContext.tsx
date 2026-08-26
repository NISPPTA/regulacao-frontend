import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { loginApi, logoutApi, refreshTokenApi } from "../api/auth";
import { setAccessTokenInMemory } from "../api/client";

interface AuthContextType {
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (u: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sincroniza o token no client HTTP sempre que houver alteração (login, logout ou refresh)
    useEffect(() => {
        setAccessTokenInMemory(accessToken);
    }, [accessToken]);

    // Bootstrap da sessão: tenta renovar o token via cookie HttpOnly ao carregar a página
    useEffect(() => {
        async function initSession() {
            try {
                const data = await refreshTokenApi();
                if (data?.access_token) {
                    setAccessToken(data.access_token);
                }
            } catch {
                setAccessToken(null);
            } finally {
                setIsLoading(false);
            }
        }

        initSession();
    }, []);

    const login = async (u: string, p: string) => {
        const data = await loginApi(u, p);
        if (data?.access_token) {
            setAccessToken(data.access_token);
        }
    };

    const logout = async () => {
        try {
            await logoutApi();
        } finally {
            setAccessToken(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                accessToken,
                isAuthenticated: !!accessToken,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
    }
    return context;
}