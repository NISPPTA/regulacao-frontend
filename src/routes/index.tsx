import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { NovoPaciente } from "../pages/NovoPaciente";

function PrivateRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <div style={{ padding: "2rem", textAlign: "center" }}>Validando sessão...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            {/* Rotas Protegidas */}
            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/novo-paciente"
                element={
                    <PrivateRoute>
                        <NovoPaciente />
                    </PrivateRoute>
                }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}