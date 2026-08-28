import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
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
    CardFooter,
} from "@/components/ui/card";
import { ArrowLeft, Search, UserPlus, CheckCircle2 } from "lucide-react";

export function NovoPaciente() {
    const navigate = useNavigate();

    // Estados do Formulário
    const [cpf, setCpf] = useState("");
    const [nome, setNome] = useState("");
    const [nascimento, setNascimento] = useState("");
    const [profissional, setProfissional] = useState("");
    const [tipoProcedimento, setTipoProcedimento] = useState("");
    const [procedimentoEspecifico, setProcedimentoEspecifico] = useState("");
    const [prioridade, setPrioridade] = useState<string>("ELETIVO");
    const [tipoFila, setTipoFila] = useState<string>("PRIMEIRA_CONSULTA");

    // Controle de UI
    const [pacienteEncontrado, setPacienteEncontrado] = useState(false);

    // 1. Mutação para Buscar CPF
    const buscarCpfMutation = useMutation({
        mutationFn: async (cpfBusca: string) => {
            const { data, error, response } = await api.GET("/fila-espera/busca-cpf/{cpf}", {
                params: { path: { cpf: cpfBusca } },
            });

            if (error) {
                if (response.status === 404) return null; // Paciente novo
                throw new Error("Erro ao buscar o CPF");
            }
            return data;
        },
        onSuccess: (data) => {
            if (data) {
                setNome(data.nome);
                setNascimento(data.nascimento ? data.nascimento.split("T")[0] : "");
                setPacienteEncontrado(true);
            } else {
                setNome("");
                setNascimento("");
                setPacienteEncontrado(false);
            }
        },
        onError: (err: Error) => alert(err.message),
    });

    // 2. Mutação para Salvar Paciente
    const salvarMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                cpf_hash: cpf,
                nome,
                nascimento: nascimento || undefined,
                profissional_solicitante: profissional,
                tipo_procedimento: tipoProcedimento || undefined,
                procedimento_especifico: procedimentoEspecifico || undefined,
                prioridade: prioridade as any,
                tipo_fila: tipoFila,
            };

            const { error } = await api.POST("/fila-espera/", {
                body: payload,
            });

            if (error) throw new Error((error as any).detail || "Erro ao inserir paciente na fila.");
        },
        onSuccess: () => {
            alert("Paciente adicionado à fila com sucesso!");
            navigate("/dashboard"); // Volta para o painel
        },
        onError: (err: Error) => alert(err.message),
    });

    function handleBuscarCpf() {
        if (cpf.length < 11) return alert("Digite o CPF completo");
        buscarCpfMutation.mutate(cpf);
    }

    function handleSalvar(e: React.FormEvent) {
        e.preventDefault();
        salvarMutation.mutate();
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 flex justify-center items-start">
            <div className="w-full max-w-3xl space-y-6">

                {/* Cabeçalho de Navegação */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Nova Solicitação</h1>
                        <p className="text-sm text-slate-500">Adicionar paciente à fila de regulação municipal</p>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <form onSubmit={handleSalvar}>
                        <CardHeader className="border-b bg-slate-50/50">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-slate-500" />
                                Dados do Paciente
                            </CardTitle>
                            <CardDescription>Busque pelo CPF para preenchimento automático.</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6 pt-6">

                            {/* Buscador de CPF */}
                            <div className="flex gap-2 items-end">
                                <div className="space-y-2 flex-1 max-w-xs">
                                    <label className="text-sm font-medium">CPF do Paciente *</label>
                                    <Input
                                        placeholder="Somente números..."
                                        maxLength={11}
                                        value={cpf}
                                        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ''))}
                                        disabled={salvarMutation.isPending}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleBuscarCpf}
                                    disabled={buscarCpfMutation.isPending || cpf.length < 11}
                                    className="gap-2"
                                >
                                    {buscarCpfMutation.isPending ? "Buscando..." : <><Search className="h-4 w-4" /> Buscar</>}
                                </Button>

                                {pacienteEncontrado && (
                                    <span className="ml-2 text-sm text-emerald-600 flex items-center gap-1 pb-2 font-medium">
                                        <CheckCircle2 className="h-4 w-4" /> Cadastro localizado
                                    </span>
                                )}
                            </div>

                            {/* Dados Pessoais */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome Completo *</label>
                                    <Input
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        disabled={pacienteEncontrado || salvarMutation.isPending}
                                        className={pacienteEncontrado ? "bg-slate-100" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data de Nascimento</label>
                                    <Input
                                        type="date"
                                        value={nascimento}
                                        onChange={(e) => setNascimento(e.target.value)}
                                        disabled={pacienteEncontrado || salvarMutation.isPending}
                                        className={pacienteEncontrado ? "bg-slate-100" : ""}
                                    />
                                </div>
                            </div>

                            <div className="border-t my-4"></div>

                            {/* Dados Clínicos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Profissional Solicitante *</label>
                                    <Input
                                        required
                                        placeholder="Ex: Dr. Carlos / Enf. Maria"
                                        value={profissional}
                                        onChange={(e) => setProfissional(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Natureza da Fila *</label>
                                    <Select value={tipoFila} onValueChange={setTipoFila}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="PRIMEIRA_CONSULTA">Primeira Consulta</SelectItem>
                                            <SelectItem value="RETORNO">Retorno</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo de Procedimento</label>
                                    <Input
                                        placeholder="Ex: CONSULTA, EXAME, CIRURGIA"
                                        value={tipoProcedimento}
                                        onChange={(e) => setTipoProcedimento(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Procedimento / Especialidade *</label>
                                    <Input
                                        required
                                        placeholder="Ex: CARDIOLOGIA, RAIO-X"
                                        value={procedimentoEspecifico}
                                        onChange={(e) => setProcedimentoEspecifico(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Prioridade Clínica *</label>
                                    <Select value={prioridade} onValueChange={setPrioridade}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white">
                                            <SelectItem value="ELETIVO">Eletivo (Rotina)</SelectItem>
                                            <SelectItem value="PRIORITARIO">Prioritário (Urgência/Gravidade)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter className="bg-slate-50 border-t px-6 py-4 flex justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={salvarMutation.isPending}>
                                {salvarMutation.isPending ? "Salvando..." : "Adicionar à Fila"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}