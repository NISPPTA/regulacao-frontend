import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { LogOut, ChevronLeft, ChevronRight, UserCheck } from "lucide-react";

const PAGE_SIZE = 10;

export function Dashboard() {
    const { logout } = useAuth();
    const [page, setPage] = useState(0);

    const { data: fila, isLoading, error } = useQuery({
        queryKey: ["fila-espera", page],
        queryFn: async () => {
            const { data, error } = await api.GET("/fila-espera/", {
                params: {
                    query: {
                        skip: page * PAGE_SIZE,
                        limit: PAGE_SIZE,
                    },
                },
            });
            if (error) throw new Error("Falha ao carregar registros da fila.");
            return data;
        },
    });

    const totalPages = fila ? Math.ceil(fila.total / PAGE_SIZE) : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-6 space-y-6">
            <header className="flex items-center justify-between border-b pb-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="bg-slate-100 p-2 rounded-full text-slate-800">
                        <UserCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Painel de Regulação</h1>
                        <p className="text-sm text-slate-500">Gestão municipal da fila de espera</p>
                    </div>
                </div>
                <Button variant="destructive" onClick={logout} className="gap-2">
                    <LogOut className="h-4 w-4" /> Sair
                </Button>
            </header>

            <Card className="shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Fila de Espera Unificada</CardTitle>
                            <CardDescription>
                                Exibindo registros de pacientes aguardando regulação ou agendamento
                            </CardDescription>
                        </div>
                        {fila && (
                            <Badge variant="outline" className="text-sm py-1 px-3">
                                Total: <strong className="ml-1 text-slate-900">{fila.total.toLocaleString("pt-BR")}</strong>
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="py-12 text-center text-slate-500">
                            Carregando regulação de pacientes...
                        </div>
                    )}

                    {error && (
                        <div className="py-8 text-center text-red-600 bg-red-50 rounded-md">
                            Ocorreu um erro ao consultar os dados: {error.message}
                        </div>
                    )}

                    {fila && (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Paciente</TableHead>
                                        <TableHead>Procedimento Solicitado</TableHead>
                                        <TableHead>Solicitante</TableHead>
                                        <TableHead>Data Solicitação</TableHead>
                                        <TableHead>Prioridade</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fila.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div>{item.nome}</div>
                                                <div className="text-xs text-slate-400 font-mono">
                                                    CPF: {item.cpf_hash.slice(0, 8)}...
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-slate-800">
                                                    {item.procedimento?.nome || item.procedimento_especifico || "Não especificado"}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {item.tipo_procedimento}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {item.profissional_solicitante}
                                            </TableCell>
                                            <TableCell className="text-slate-600">
                                                {new Date(item.data_solicitacao).toLocaleDateString("pt-BR")}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={item.prioridade === "PRIORITARIO" ? "destructive" : "secondary"}
                                                >
                                                    {item.prioridade}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        item.status === "AGENDADO"
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            : item.status === "AGUARDANDO"
                                                                ? "bg-amber-500 hover:bg-amber-600 text-white"
                                                                : "bg-slate-500 text-white"
                                                    }
                                                >
                                                    {item.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <span className="text-sm text-slate-500">
                                    Página {page + 1} de {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                                        disabled={page === 0}
                                    >
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage((p) => p + 1)}
                                        disabled={page + 1 >= totalPages}
                                    >
                                        Próximo <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}