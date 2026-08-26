// Serviços de Autenticação

import { api } from "./client";

export async function loginApi(username: string, password: string) {
    // O OAuth2PasswordBearer do FastAPI exige application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const { data, error } = await api.POST("/auth/login", {
        body: body as unknown as Record<string, string>,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (error) {
        throw new Error((error as { detail?: string }).detail || "Credenciais inválidas.");
    }

    return data;
}

export async function refreshTokenApi() {
    const { data, error } = await api.POST("/auth/refresh");

    if (error) {
        throw new Error((error as { detail?: string }).detail || "Sessão expirada.");
    }

    return data;
}

export async function logoutApi() {
    await api.POST("/auth/logout");
}