import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";

// Componente que atua como "Guarda Costas" das rotas privadas
function PrivateRoute({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    // Aguarda a verificação do cookie antes de tomar uma decisão
    if (isLoading) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Validando sessão...</div>;
    }

    // Se não tem token, chuta pro /login. Se tem, renderiza a tela solicitada.
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rota Protegida */}
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />

            {/* Fallback: se a rota não existir ou for "/", manda pro dashboard (que vai avaliar se tá logado) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}