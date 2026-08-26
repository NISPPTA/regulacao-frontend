import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "../types/schema";

let accessTokenInMemory: string | null = null;

// Função chamada pelo AuthContext para sincronizar o token
export const setAccessTokenInMemory = (token: string | null) => {
    accessTokenInMemory = token;
};

export const api = createClient<paths>({
    baseUrl: "http://127.0.0.1:8000",
    credentials: "include",
});

// Middleware que intercepta cada request e injeta o token Bearer
const authMiddleware: Middleware = {
    async onRequest({ request }) {
        if (accessTokenInMemory) {
            request.headers.set("Authorization", `Bearer ${accessTokenInMemory}`);
        }
        return request;
    },
};

api.use(authMiddleware);