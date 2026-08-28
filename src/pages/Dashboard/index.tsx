import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/client";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, ChevronLeft, ChevronRight, UserCheck, Search, FilterX, Stethoscope } from "lucide-react";

const PAGE_SIZE = 10;


export function Dashboard() {
    const { logout } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const navigate = useNavigate();

    // Estados dos Filtros
    const [busca, setBusca] = useState("");
    const [statusFiltro, setStatusFiltro] = useState<string>("TODOS");
    const [prioridadeFiltro, setPrioridadeFiltro] = useState<string>("TODAS");

    // Estados do Modal de Regulação Dinâmico
    const [pacienteRegulacao, setPacienteRegulacao] = useState<any>(null);
    const [novoStatus, setNovoStatus] = useState<string>("");
    const [novaPrioridade, setNovaPrioridade] = useState<string>("");
    const [justificativaRegulacao, setJustificativaRegulacao] = useState<string>("");
    const [dataAgendamento, setDataAgendamento] = useState<string>("");
    const [descricaoAgendamento, setDescricaoAgendamento] = useState<string>("");
    const [justificativaCancelamento, setJustificativaCancelamento] = useState<string>("");

    // Consulta de Dados (GET)
    const { data: fila, isLoading, error } = useQuery({
        queryKey: ["fila-espera", page, busca, statusFiltro, prioridadeFiltro],
        queryFn: async () => {
            const { data, error } = await api.GET("/fila-espera/", {
                params: {
                    query: {
                        skip: page * PAGE_SIZE,
                        limit: PAGE_SIZE,
                        ...(busca ? { nome: busca } : {}),
                        ...(statusFiltro !== "TODOS"
                            ? {
                                status: statusFiltro as
                                    | "AGUARDANDO"
                                    | "AGENDADO"
                                    | "CANCELADO"
                                    | "REALIZADO"
                                    | "NÃO COMPARECEU",
                            }
                            : {}),
                        ...(prioridadeFiltro !== "TODAS"
                            ? { prioridade: prioridadeFiltro as "ELETIVO" | "PRIORITARIO" }
                            : {}),
                    },
                },
            });
            if (error) throw new Error("Falha ao carregar registros da fila.");
            return data;
        },
    });

    const totalPages = fila ? Math.ceil(fila.total / PAGE_SIZE) : 0;

    function limpaFiltros() {
        setBusca("");
        setStatusFiltro("TODOS");
        setPrioridadeFiltro("TODAS");
        setPage(0);
    }

    function abrirModalRegulacao(paciente: any) {
        setPacienteRegulacao(paciente);
        setNovoStatus(paciente.status);
        setNovaPrioridade(paciente.prioridade);

        // Popula os campos com os dados existentes do banco, caso existam
        setJustificativaRegulacao(paciente.justificativa_regulacao || "");
        setDataAgendamento(paciente.data_agendamento ? paciente.data_agendamento.split("T")[0] : "");
        setDescricaoAgendamento(paciente.descricao_agendamento || "");
        setJustificativaCancelamento(paciente.justificativa_cancelamento || "");
    }

    // Mutação para Atualizar o Paciente (PATCH)
    const regulacaoMutation = useMutation({
        mutationFn: async () => {
            if (!pacienteRegulacao) return;

            // Prepara o payload dinâmico baseado na regra de negócio
            const payload: any = {
                status: novoStatus,
                prioridade: novaPrioridade,
                justificativa_regulacao: justificativaRegulacao || null,
            };

            if (novoStatus === "AGENDADO") {
                if (!dataAgendamento) {
                    throw new Error("A Data do Agendamento é obrigatória para o status AGENDADO.");
                }
                payload.data_agendamento = dataAgendamento;
                payload.descricao_agendamento = descricaoAgendamento || null;
            }

            if (novoStatus === "CANCELADO") {
                if (!justificativaCancelamento) {
                    throw new Error("A Justificativa de Cancelamento é obrigatória para o status CANCELADO.");
                }
                payload.justificativa_cancelamento = justificativaCancelamento;
                payload.data_cancelamento = new Date().toISOString();
            }

            const { error, response } = await api.PATCH("/fila-espera/{paciente_id}/regular", {
                params: {
                    path: { paciente_id: pacienteRegulacao.id },
                },
                body: payload,
            });

            if (error) {
                if (response?.status === 403) {
                    throw new Error("Acesso negado: seu perfil não possui permissão para regular pacientes.");
                }

                // Tratamento de erro 400 (Bad Request) do FastAPI
                const mensagemDetalhada = (error as any)?.detail
                    ? typeof (error as any).detail === "string"
                        ? (error as any).detail
                        : JSON.stringify((error as any).detail)
                    : "Erro ao regular o paciente. Tente novamente.";

                throw new Error(mensagemDetalhada);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fila-espera"] });
            setPacienteRegulacao(null);
        },
        onError: (err: Error) => {
            alert(err.message);
        }
    });

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
                <Button
                    onClick={() => navigate("/novo-paciente")}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <UserPlus className="h-4 w-4" />
                    Nova Solicitação
                </Button>
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
                            <Badge variant="outline" className="text-sm py-1 px-3 bg-white">
                                Total: <strong className="ml-1 text-slate-900">{fila.total.toLocaleString("pt-BR")}</strong>
                            </Badge>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por Paciente..."
                                className="pl-9 bg-white"
                                value={busca}
                                onChange={(e) => {
                                    setBusca(e.target.value);
                                    setPage(0);
                                }}
                            />
                        </div>

                        <Select value={statusFiltro} onValueChange={(value) => { setStatusFiltro(value); setPage(0); }}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="TODOS">Todos os Status</SelectItem>
                                <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                                <SelectItem value="AGENDADO">Agendado</SelectItem>
                                <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                <SelectItem value="REALIZADO">Realizado</SelectItem>
                                <SelectItem value="NÃO COMPARECEU">Não Compareceu</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={prioridadeFiltro} onValueChange={(value) => { setPrioridadeFiltro(value); setPage(0); }}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Prioridade" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="TODAS">Todas as Prioridades</SelectItem>
                                <SelectItem value="ELETIVO">Eletivo</SelectItem>
                                <SelectItem value="PRIORITARIO">Prioritário</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={limpaFiltros} className="gap-2 text-slate-600 bg-white">
                            <FilterX className="h-4 w-4" /> Limpar Filtros
                        </Button>
                    </div>
                </CardHeader>

                <CardContent>
                    {isLoading && <div className="py-12 text-center text-slate-500">Carregando regulação de pacientes...</div>}
                    {error && <div className="py-8 text-center text-red-600 bg-red-50 rounded-md">Ocorreu um erro ao consultar os dados: {error.message}</div>}

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
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fila.items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-slate-500">Nenhum registro encontrado.</TableCell>
                                        </TableRow>
                                    ) : (
                                        fila.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    <div>{item.nome}</div>
                                                    <div className="text-xs text-slate-400 font-mono">CPF: {item.cpf_hash.slice(0, 8)}...</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium text-slate-800">{item.procedimento?.nome || item.procedimento_especifico || "Não especificado"}</div>
                                                    <div className="text-xs text-slate-500">{item.tipo_procedimento}</div>
                                                </TableCell>
                                                <TableCell className="text-slate-600">{item.profissional_solicitante}</TableCell>
                                                <TableCell className="text-slate-600">{new Date(item.data_solicitacao).toLocaleDateString("pt-BR")}</TableCell>
                                                <TableCell>
                                                    <Badge variant={item.prioridade === "PRIORITARIO" ? "destructive" : "secondary"}>{item.prioridade}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={
                                                        item.status === "AGENDADO" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                                                            item.status === "AGUARDANDO" ? "bg-amber-500 hover:bg-amber-600 text-white" :
                                                                item.status === "REALIZADO" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-slate-500 text-white"
                                                    }>
                                                        {item.status}
                                                    </Badge>

                                                    {/* Cast rápido (as any) para evitar o bloqueio do TypeScript */}
                                                    {item.status === "CANCELADO" && (item as any).data_cancelamento && (
                                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">
                                                            {new Date((item as any).data_cancelamento).toLocaleString("pt-BR")}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" onClick={() => abrirModalRegulacao(item)} className="gap-2">
                                                        <Stethoscope className="h-4 w-4" /> Regular
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <span className="text-sm text-slate-500">Página {page + 1} de {totalPages || 1}</span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page + 1 >= totalPages}>
                                        Próximo <ChevronRight className="h-4 w-4 ml-1" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Modal de Regulação Dinâmico */}
            <Dialog open={!!pacienteRegulacao} onOpenChange={(open) => !open && setPacienteRegulacao(null)}>
                <DialogContent className="bg-white sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Regular Paciente</DialogTitle>
                        <DialogDescription>
                            Ajuste o status e os dados de regulação para <strong className="text-slate-800">{pacienteRegulacao?.nome}</strong>.
                        </DialogDescription>

                        {/* Nova informação de cancelamento inserida aqui */}
                        {(pacienteRegulacao as any)?.data_cancelamento && (
                            <p className="text-xs text-slate-500 mt-2">
                                Cancelado em: <strong>{new Date((pacienteRegulacao as any).data_cancelamento).toLocaleString("pt-BR")}</strong>
                            </p>
                        )}
                    </DialogHeader>

                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status da Solicitação *</label>
                                <Select value={novoStatus} onValueChange={setNovoStatus}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                                        <SelectItem value="AGENDADO">Agendado</SelectItem>
                                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                        <SelectItem value="REALIZADO">Realizado</SelectItem>
                                        <SelectItem value="NÃO COMPARECEU">Não Compareceu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Prioridade *</label>
                                <Select value={novaPrioridade} onValueChange={setNovaPrioridade}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        <SelectItem value="ELETIVO">Eletivo</SelectItem>
                                        <SelectItem value="PRIORITARIO">Prioritário</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Campos Dinâmicos: AGENDADO */}
                        {novoStatus === "AGENDADO" && (
                            <div className="space-y-4 border-l-4 border-emerald-500 pl-4 py-2 bg-emerald-50/50 rounded-r-md">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-emerald-900">Data do Agendamento *</label>
                                    <Input
                                        type="date"
                                        className="bg-white"
                                        value={dataAgendamento}
                                        onChange={(e) => setDataAgendamento(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-emerald-900">Descrição / Local</label>
                                    <Input
                                        placeholder="Ex: AME Assis - Sala 3"
                                        className="bg-white"
                                        value={descricaoAgendamento}
                                        onChange={(e) => setDescricaoAgendamento(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Campos Dinâmicos: CANCELADO */}
                        {novoStatus === "CANCELADO" && (
                            <div className="space-y-2 border-l-4 border-red-500 pl-4 py-2 bg-red-50/50 rounded-r-md">
                                <label className="text-sm font-semibold text-red-900">Justificativa do Cancelamento *</label>
                                <Input
                                    placeholder="Motivo do cancelamento..."
                                    className="bg-white"
                                    value={justificativaCancelamento}
                                    onChange={(e) => setJustificativaCancelamento(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Justificativa Geral (Sempre visível) */}
                        <div className="space-y-2 pt-2">
                            <label className="text-sm font-medium">Justificativa / Parecer de Regulação</label>
                            <Input
                                placeholder="Observações médicas/regulatórias (Opcional)"
                                className="bg-white"
                                value={justificativaRegulacao}
                                onChange={(e) => setJustificativaRegulacao(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="sm:justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setPacienteRegulacao(null)} disabled={regulacaoMutation.isPending}>
                            Cancelar
                        </Button>
                        <Button onClick={() => regulacaoMutation.mutate()} disabled={regulacaoMutation.isPending}>
                            {regulacaoMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}