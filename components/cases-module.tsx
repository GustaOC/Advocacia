// components/cases-module.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Filter, Upload, AlertTriangle, Clock, LayoutGrid, List, Star, TrendingUp, DollarSign, Calendar, FileSignature, Handshake, Store, Scale } from "lucide-react";
import { apiClient, type Entity, type Case } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ExtendedCase extends Case {
  status_reason?: string | null;
  court?: string | null;
  client_entity_id?: number;
  executed_entity_id?: number;
  payment_date?: string | null;
  final_value?: number | null;
  agreement_type?: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | 'Pela Loja' | null;
  agreement_value?: number | null;
  installments?: number | null;
  down_payment?: number | null;
  installment_due_date?: string | null;
}

interface CasesModuleProps {
  initialFilters?: { status: string };
}

function CasesStats({ cases }: { cases: ExtendedCase[] }) {
  const stats = [
    { label: "Total de Casos", value: cases.length.toString(), icon: Briefcase, color: "text-blue-600", bg: "from-blue-50 to-blue-100", trend: "+5%" },
    { label: "Em Andamento", value: cases.filter(c => c.status === 'Em andamento').length.toString(), icon: Clock, color: "text-orange-600", bg: "from-orange-50 to-orange-100", trend: "+2%" },
    { label: "Acordos", value: cases.filter(c => c.status === 'Acordo').length.toString(), icon: Star, color: "text-green-600", bg: "from-green-50 to-green-100", trend: "+12%" },
    { label: "Alta Prioridade", value: cases.filter(c => c.priority === 'Alta').length.toString(), icon: AlertTriangle, color: "text-red-600", bg: "from-red-50 to-red-100", trend: "-3%" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <StatIcon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function CasesModule({ initialFilters }: CasesModuleProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState(initialFilters?.status || "all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCase, setCurrentCase] = useState<Partial<ExtendedCase>>({});
    const [selectedCaseForView, setSelectedCaseForView] = useState<ExtendedCase | null>(null);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const [draggedCase, setDraggedCase] = useState<ExtendedCase | null>(null);

    const { data: casesData, isLoading: isLoadingCases } = useQuery({
        queryKey: ['cases'],
        queryFn: () => apiClient.getCases(),
    });
    const { data: entitiesData, isLoading: isLoadingEntities } = useQuery({
        queryKey: ['entities'],
        queryFn: () => apiClient.getEntities(),
    });

    const cases: ExtendedCase[] = (casesData?.cases ?? []) as ExtendedCase[];
    const allEntities: Entity[] = entitiesData ?? [];
    const isLoading = isLoadingCases || isLoadingEntities;

    const getEntityName = (id: number | string | undefined) => {
        if (!id) return 'Não selecionado';
        const target = String(id);
        const found = allEntities.find(e => String(e.id) === target);
        return found?.name ?? 'Entidade não localizada';
    }

    const saveCaseMutation = useMutation({
        mutationFn: (caseData: Partial<ExtendedCase>) => {
            const dataToSave = {
                ...caseData,
                client_entity_id: caseData.client_entity_id != null ? Number(caseData.client_entity_id) : undefined,
                executed_entity_id: caseData.executed_entity_id != null ? Number(caseData.executed_entity_id) : undefined,
                value: caseData.value ? parseFloat(String(caseData.value)) : null,
                agreement_value: caseData.agreement_value ? parseFloat(String(caseData.agreement_value)) : null,
                installments: caseData.installments ? parseInt(String(caseData.installments), 10) : null,
                down_payment: caseData.down_payment ? parseFloat(String(caseData.down_payment)) : null,
            };
            return isEditMode
                ? apiClient.updateCase(String(dataToSave.id!), dataToSave)
                : apiClient.createCase(dataToSave);
        },
        onSuccess: () => {
            toast({ title: "Sucesso!", description: `Caso ${isEditMode ? 'atualizado' : 'criado'} com sucesso.` });
            console.log('[cases-module] Mutação bem-sucedida. Invalidando queries: ["cases", "financialAgreements"]');
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast({ title: `Erro ao ${isEditMode ? 'atualizar' : 'criar'} caso`, description: error.message, variant: "destructive" });
        },
    });

    const updateCaseStatusMutation = useMutation({
        mutationFn: ({ caseId, status }: { caseId: number; status: ExtendedCase['status'] }) => apiClient.updateCase(String(caseId), { status }),
        onSuccess: () => {
            toast({ title: "Status Atualizado!", description: "O status do caso foi alterado." });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
        },
        onError: (error: any) => {
            toast({ title: "Erro ao atualizar status", description: error.message, variant: "destructive" });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });

    const openEditModal = (caseItem: ExtendedCase) => {
        setIsEditMode(true);
        const client = caseItem.case_parties.find(p => p.role === 'Cliente');
        const executed = caseItem.case_parties.find(p => p.role === 'Executado');
        
        setCurrentCase({
            ...caseItem,
            client_entity_id: client?.entities.id,
            executed_entity_id: executed?.entities.id
        });
        setIsModalOpen(true);
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setCurrentCase({
            title: '', case_number: '', court: '', priority: 'Média', status: 'Em andamento',
            description: '', value: null, client_entity_id: undefined, executed_entity_id: undefined,
        });
        setIsModalOpen(true);
    };

    const openViewModal = (caseItem: ExtendedCase) => {
        setSelectedCaseForView(caseItem);
        setIsViewModalOpen(true);
    };

    const handleSaveCase = () => {
        if (!currentCase.title || !currentCase.client_entity_id || !currentCase.executed_entity_id) {
            toast({ title: "Campos obrigatórios", description: "Título, Cliente e Executado são obrigatórios.", variant: "destructive" });
            return;
        }
        saveCaseMutation.mutate(currentCase);
    };

    const handleImportCases = async () => { };

    const filteredCases = useMemo(() => {
        if (!cases) return [];
        return cases.filter(c => {
            const searchMatch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.case_parties.some(p => p.entities.name.toLowerCase().includes(searchTerm.toLowerCase())));
            const statusMatch = filterStatus === "all" || c.status === filterStatus;
            const priorityMatch = filterPriority === "all" || c.priority === filterPriority;
            return searchMatch && statusMatch && priorityMatch;
        });
    }, [cases, searchTerm, filterStatus, filterPriority]);

    const getStatusBadge = (status: ExtendedCase['status']) => {
        const statusMap = {
            'Em andamento': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg',
            'Acordo': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg',
            'Extinto': 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg',
            'Pago': 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg',
        };
        return <Badge className={`${statusMap[status]} border-0 px-3 py-1 font-semibold`}>{status}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            'Alta': 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0',
            'Média': 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0',
            'Baixa': 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0',
        };
        return (
            <Badge className={`${colors[priority as keyof typeof colors]} px-3 py-1 font-semibold shadow-lg`}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {priority}
            </Badge>
        );
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, caseItem: ExtendedCase) => setDraggedCase(caseItem);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: ExtendedCase['status']) => {
        e.preventDefault();
        if (draggedCase && draggedCase.status !== status) {
            updateCaseStatusMutation.mutate({ caseId: draggedCase.id, status });
        }
        setDraggedCase(null);
    };
    
    const renderAgreementTypeIcon = (type: string | null | undefined) => {
        switch(type) {
            case 'Judicial': return <Scale className="h-4 w-4 text-slate-500 mr-2" />;
            case 'Extrajudicial': return <FileSignature className="h-4 w-4 text-slate-500 mr-2" />;
            case 'Em Audiência': return <Handshake className="h-4 w-4 text-slate-500 mr-2" />;
            case 'Pela Loja': return <Store className="h-4 w-4 text-slate-500 mr-2" />;
            default: return null;
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
                <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
                    <p className="text-slate-600 font-medium">Carregando casos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="relative bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-bold mb-3">Gestão de Casos e Processos</h2>
                    <p className="text-purple-100 text-xl">Administre todos os casos do escritório de forma centralizada e eficiente.</p>
                </div>
            </div>

            <CasesStats cases={cases} />

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <Input placeholder="Buscar por título, número ou parte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl" />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[200px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Acordo">Acordo</SelectItem>
                                    <SelectItem value="Extinto">Extinto</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="flex items-center gap-2 bg-slate-200 rounded-xl p-1">
                                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className={`rounded-lg ${viewMode === 'list' ? '' : 'text-slate-700 hover:text-slate-900'}`}><List className="h-4 w-4" /></Button>
                                <Button variant={viewMode === 'kanban' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('kanban')} className={`rounded-lg ${viewMode === 'kanban' ? '' : 'text-slate-700 hover:text-slate-900'}`}><LayoutGrid className="h-4 w-4" /></Button>
                            </div>
                            <Button variant="outline" className="border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 rounded-xl" onClick={() => setIsImportModalOpen(true)}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
                            <Button onClick={openCreateModal} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg rounded-xl"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {viewMode === 'list' && (
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                                    <TableHead className="text-slate-700 font-bold">Processo / Título</TableHead>
                                    <TableHead className="text-slate-700 font-bold">Prioridade</TableHead>
                                    <TableHead className="text-slate-700 font-bold">Status</TableHead>
                                    <TableHead className="text-slate-700 font-bold">Partes</TableHead>
                                    <TableHead className="text-right text-slate-700 font-bold">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredCases.map(caseItem => (
                                    <TableRow key={caseItem.id} className="group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200">
                                        <TableCell><div className="space-y-1"><div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">{caseItem.title}</div><div className="text-sm text-slate-500 font-mono">{caseItem.case_number || "-"}</div></div></TableCell>
                                        <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                                        <TableCell><div className="flex flex-col items-start space-y-1">{getStatusBadge(caseItem.status)}{caseItem.status_reason && (<span className="text-xs text-slate-500 mt-1">{caseItem.status_reason}</span>)}</div></TableCell>
                                        <TableCell><div className="text-sm text-slate-600">{caseItem.case_parties.map(p => p.entities.name).join(', ')}</div></TableCell>
                                        <TableCell className="text-right"><div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openViewModal(caseItem)} className="hover:bg-purple-100 hover:text-purple-700 rounded-lg"><Eye className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(caseItem)} className="hover:bg-blue-100 hover:text-blue-700 rounded-lg"><Edit className="h-4 w-4" /></Button>
                                        </div></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {(['Em andamento', 'Acordo', 'Extinto', 'Pago'] as const).map(status => (
                        <div key={status} className="space-y-4" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)}>
                            <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-4 sticky top-0 z-10"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-800 text-lg">{status}</h3><Badge variant="secondary" className="bg-white text-slate-700 font-semibold">{filteredCases.filter(c => c.status === status).length}</Badge></div></div>
                            <div className="space-y-4 min-h-[400px]">
                                {filteredCases.filter(c => c.status === status).map(caseItem => (
                                    <div key={caseItem.id} draggable onDragStart={(e) => handleDragStart(e, caseItem)}>
                                        <Card className="cursor-move group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-purple-500">
                                            <CardContent className="p-4"><div className="space-y-3">
                                                <p className="font-semibold text-slate-900 line-clamp-2">{caseItem.title}</p>
                                                <p className="text-sm text-slate-500 font-mono">{caseItem.case_number}</p>
                                                <p className="text-xs text-slate-500 truncate">{caseItem.case_parties.map(p => p.entities.name).join(' vs ')}</p>
                                                <div className="flex justify-between items-center">{getPriorityBadge(caseItem.priority)}<Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openViewModal(caseItem)}><Eye className="h-4 w-4" /></Button></div>
                                            </div></CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-2xl font-bold"><Briefcase className="mr-2 h-5 w-5" /> Detalhes do Caso</DialogTitle>
                        <DialogDescription className="text-slate-600">{selectedCaseForView?.title}</DialogDescription>
                    </DialogHeader>
                    {selectedCaseForView && (
                        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label className="text-slate-700 font-semibold">Nº do Processo</Label><p className="font-mono text-sm">{selectedCaseForView.case_number || 'N/A'}</p></div>
                                <div><Label className="text-slate-700 font-semibold">Vara/Tribunal</Label><p className="text-sm">{selectedCaseForView.court || 'N/A'}</p></div>
                                <div><Label className="text-slate-700 font-semibold">Cliente</Label><p className="text-sm font-medium">{getEntityName(selectedCaseForView.case_parties.find(p => p.role === 'Cliente')?.entities.id)}</p></div>
                                <div><Label className="text-slate-700 font-semibold">Executado</Label><p className="text-sm font-medium">{getEntityName(selectedCaseForView.case_parties.find(p => p.role === 'Executado')?.entities.id)}</p></div>
                                <div><Label className="text-slate-700 font-semibold">Status</Label><div>{getStatusBadge(selectedCaseForView.status)}</div></div>
                                <div><Label className="text-slate-700 font-semibold">Prioridade</Label><div>{getPriorityBadge(selectedCaseForView.priority)}</div></div>
                                <div><Label className="text-slate-700 font-semibold">Valor da Causa</Label><p className="text-sm">{selectedCaseForView.value ? `R$ ${selectedCaseForView.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                            </div>
                            {selectedCaseForView.status === 'Acordo' && (
                                <div className="border-t pt-4 mt-4 space-y-4">
                                    <h4 className="font-semibold flex items-center"><DollarSign className="mr-2 h-4 w-4 text-green-600"/> Detalhes do Acordo</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex items-center"><Label className="text-slate-700 font-semibold">Tipo:</Label><div className="flex items-center ml-2">{renderAgreementTypeIcon(selectedCaseForView.agreement_type)}<p className="text-sm">{selectedCaseForView.agreement_type || 'N/A'}</p></div></div>
                                        <div><Label className="text-slate-700 font-semibold">Valor do Acordo:</Label><p className="text-sm">{selectedCaseForView.agreement_value ? `R$ ${selectedCaseForView.agreement_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                                        <div><Label className="text-slate-700 font-semibold">Valor de Entrada:</Label><p className="text-sm">{selectedCaseForView.down_payment ? `R$ ${selectedCaseForView.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                                        <div><Label className="text-slate-700 font-semibold">Parcelas:</Label><p className="text-sm">{selectedCaseForView.installments || 'N/A'}</p></div>
                                        <div><Label className="text-slate-700 font-semibold">Vencimento da Parcela:</Label><p className="text-sm">{selectedCaseForView.installment_due_date ? new Date(selectedCaseForView.installment_due_date).toLocaleDateString('pt-BR') : 'N/A'}</p></div>
                                    </div>
                                </div>
                            )}
                            <div><Label className="text-slate-700 font-semibold">Descrição</Label><p className="text-sm bg-slate-50 p-3 rounded-md">{selectedCaseForView.description || 'Nenhuma descrição fornecida.'}</p></div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)} className="border-2 border-slate-200 rounded-xl">Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[650px] bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-2xl font-bold"><Briefcase className="mr-2 h-5 w-5 text-purple-600" />{isEditMode ? 'Editar Caso' : 'Criar Novo Caso'}</DialogTitle>
                        <DialogDescription className="text-slate-600">{isEditMode ? 'Altere as informações do caso.' : 'Preencha as informações do novo caso/processo judicial'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 pr-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="title" className="text-slate-700 font-semibold">Título do Caso *</Label><Input id="title" value={currentCase.title || ''} onChange={(e) => setCurrentCase({ ...currentCase, title: e.target.value })} placeholder="Ex: Ação de Cobrança - João Silva" className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                            <div className="space-y-2"><Label htmlFor="case_number" className="text-slate-700 font-semibold">Número do Processo</Label><Input id="case_number" value={currentCase.case_number || ''} onChange={(e) => setCurrentCase({ ...currentCase, case_number: e.target.value })} placeholder="0000000-00.0000.0.00.0000" className="font-mono bg-white border-2 border-slate-200 rounded-xl" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="court" className="text-slate-700 font-semibold">Vara/Tribunal</Label><Input id="court" value={currentCase.court || ''} onChange={(e) => setCurrentCase({ ...currentCase, court: e.target.value })} placeholder="Ex: 1ª Vara Cível de Campo Grande" className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                            <div className="space-y-2"><Label htmlFor="value" className="text-slate-700 font-semibold">Valor da Causa</Label><Input id="value" type="number" value={currentCase.value ?? ''} onChange={(e) => setCurrentCase({ ...currentCase, value: parseFloat(e.target.value) })} placeholder="0,00" className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-slate-700 font-semibold">Cliente *</Label><Select value={String(currentCase.client_entity_id || '')} onValueChange={(value) => setCurrentCase({ ...currentCase, client_entity_id: Number(value) })} disabled={isEditMode}><SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger><SelectContent>{allEntities.filter(e => e.type === 'Cliente').map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label className="text-slate-700 font-semibold">Executado *</Label><Select value={String(currentCase.executed_entity_id || '')} onValueChange={(value) => setCurrentCase({ ...currentCase, executed_entity_id: Number(value) })} disabled={isEditMode}><SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione o executado" /></SelectTrigger><SelectContent>{allEntities.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="priority" className="text-slate-700 font-semibold">Prioridade</Label><Select value={currentCase.priority} onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => setCurrentCase({ ...currentCase, priority: value })}><SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Baixa">Baixa</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="status" className="text-slate-700 font-semibold">Status</Label><Select value={currentCase.status} onValueChange={(value: ExtendedCase['status']) => setCurrentCase({ ...currentCase, status: value })}><SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Em andamento">Em andamento</SelectItem><SelectItem value="Acordo">Acordo</SelectItem><SelectItem value="Extinto">Extinto</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent></Select></div>
                        </div>
                        {currentCase.status === 'Acordo' && (
                            <div className="border-t border-dashed pt-6 mt-2 space-y-6">
                                <h4 className="font-semibold text-lg flex items-center text-slate-800"><DollarSign className="mr-2 h-5 w-5 text-yellow-600"/> Detalhes do Acordo</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label className="text-slate-700 font-semibold">Tipo de Acordo</Label><Select value={currentCase.agreement_type || ''} onValueChange={(value) => setCurrentCase({ ...currentCase, agreement_type: value as ExtendedCase['agreement_type'] })}><SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Judicial">Judicial</SelectItem><SelectItem value="Extrajudicial">Extrajudicial</SelectItem><SelectItem value="Em Audiência">Em Audiência</SelectItem><SelectItem value="Pela Loja">Pela Loja</SelectItem></SelectContent></Select></div>
                                    <div className="space-y-2"><Label className="text-slate-700 font-semibold">Valor do Acordo</Label><Input type="number" placeholder="5000,00" value={currentCase.agreement_value ?? ''} onChange={(e) => setCurrentCase({ ...currentCase, agreement_value: parseFloat(e.target.value) })} className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2"><Label className="text-slate-700 font-semibold">Valor de Entrada</Label><Input type="number" placeholder="1000,00" value={currentCase.down_payment ?? ''} onChange={(e) => setCurrentCase({ ...currentCase, down_payment: parseFloat(e.target.value) })} className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                                    <div className="space-y-2"><Label className="text-slate-700 font-semibold">Nº de Parcelas</Label><Input type="number" value={currentCase.installments ?? ''} onChange={(e) => setCurrentCase({ ...currentCase, installments: parseInt(e.target.value, 10) })} className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                                    <div className="space-y-2"><Label className="text-slate-700 font-semibold">Vencimento da 1ª Parcela</Label><Input type="date" value={currentCase.installment_due_date || ''} onChange={(e) => setCurrentCase({ ...currentCase, installment_due_date: e.target.value })} className="bg-white border-2 border-slate-200 rounded-xl" /></div>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2"><Label htmlFor="description" className="text-slate-700 font-semibold">Descrição</Label><Textarea id="description" value={currentCase.description || ''} onChange={(e) => setCurrentCase({ ...currentCase, description: e.target.value })} placeholder="Descrição detalhada do caso..." className="min-h-[100px] bg-white border-2 border-slate-200 rounded-xl" /></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-2 border-slate-200 rounded-xl">Cancelar</Button>
                        <Button onClick={handleSaveCase} disabled={saveCaseMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg rounded-xl">
                            {saveCaseMutation.isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Salvando...</span></>) : (<><Plus className="mr-2 h-4 w-4" /><span>{isEditMode ? 'Salvar Alterações' : 'Criar Caso'}</span></>)}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}