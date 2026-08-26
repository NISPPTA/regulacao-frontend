import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function Login() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Se o usuário já estiver logado (ex: acessou /login direto pela URL), manda pro dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate("/dashboard");
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            await login(username, password);
            // Redireciona para o painel após o sucesso
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.message || "Erro ao realizar login");
        }
    };

    return (
        <div style={{ padding: "2rem", textAlign: "center", maxWidth: "400px", margin: "0 auto" }}>
            <h1>Acesso ao Sistema</h1>
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "2rem" }}>
                <input
                    type="text"
                    placeholder="E-mail"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{ padding: "0.8rem" }}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: "0.8rem" }}
                />
                <button type="submit" style={{ padding: "0.8rem", background: "#007bff", color: "white", border: "none", cursor: "pointer" }}>
                    Entrar
                </button>
                {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
            </form>
        </div>
    );
}