// components/enhanced-cases-module.tsx - VERSÃO COM INTEGRAÇÃO FINANCEIRA MELHORADA
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, Search, Eye, Edit, Loader2, Briefcase, Filter, 
  AlertTriangle, Clock, TrendingUp, DollarSign, Calendar, 
  FileSignature, Handshake, Store, Scale, Users, CheckCircle,
  CreditCard, Target, PiggyBank, Gavel, Building, Receipt,
  MessageSquare, Phone, Mail, MapPin, ExternalLink, History
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EnhancedFinancialAgreementModal } from "./enhanced-financial-agreement-modal";
import { FinancialAgreementDetailsModal } from "./financial-agreement-details-modal";

// Interfaces expandidas
interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago';
  status_reason: string | null;
  value: number | null;
  court: string | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  description?: string | null;
  case_parties: { role: string; entities: { id: number; name: string; } }[];
  client_entity_id?: number;
  executed_entity_id?: number;
  payment_date?: string | null;
  final_value?: number | null;
  agreement_type?: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | 'Pela Loja' | null;
  agreement_value?: number | null;
  installments?: number | null;
  down_payment?: number | null;
  installment_due_date?: string | null;
  // Dados financeiros relacionados
  financial_agreements?: Array<{
    id: number;
    total_value: number;
    status: string;
    installments: number;
    paid_installments: number;
    next_due_date: string | null;
    days_overdue: number;
    completion_percentage: number;
  }>;
}

interface CasesModuleProps {
  initialFilters?: { status: string };
}

// Componente de estatísticas melhorado
function EnhancedCasesStats({ cases }: { cases: Case[] }) {
  const stats = useMemo(() => {
    const totalValue = cases.reduce((sum, c) => sum + (c.value || 0), 0);
    const agreementValue = cases
      .filter(c => c.status === 'Acordo')
      .reduce((sum, c) => sum + (c.agreement_value || 0), 0);
    
    const financialData = cases.reduce((acc, c) => {
      if (c.financial_agreements) {
        c.financial_agreements.forEach(fa => {
          acc.totalAgreements += fa.total_value;
          acc.paidAmount += (fa.total_value * fa.completion_percentage) / 100;
          if (fa.days_overdue > 0) {
            acc.overdueAmount += fa.total_value - (fa.total_value * fa.completion_percentage) / 100;
          }
        });
      }
      return acc;
    }, { totalAgreements: 0, paidAmount: 0, overdueAmount: 0 });

    return [
      { 
        label: "Total de Casos", 
        value: cases.length.toString(), 
        icon: Briefcase, 
        color: "text-blue-600", 
        bg: "bg-blue-50", 
        trend: "+5%",
        description: "Processos no sistema"
      },
      { 
        label: "Em Andamento", 
        value: cases.filter(c => c.status === 'Em andamento').length.toString(), 
        icon: Clock, 
        color: "text-orange-600", 
        bg: "bg-orange-50", 
        trend: "+2%",
        description: "Casos ativos"
      },
      { 
        label: "Com Acordos", 
        value: cases.filter(c => c.status === 'Acordo').length.toString(), 
        icon: Handshake, 
        color: "text-green-600", 
        bg: "bg-green-50", 
        trend: "+12%",
        description: "Acordos realizados"
      },
      { 
        label: "Alta Prioridade", 
        value: cases.filter(c => c.priority === 'Alta').length.toString(), 
        icon: AlertTriangle, 
        color: "text-red-600", 
        bg: "bg-red-50", 
        trend: "-3%",
        description: "Casos urgentes"
      },
      { 
        label: "Valor em Acordo", 
        value: `R$ ${agreementValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 
        icon: DollarSign, 
        color: "text-purple-600", 
        bg: "bg-purple-50", 
        trend: "+18%",
        description: "Total negociado"
      },
      { 
        label: "Pagos", 
        value: cases.filter(c => c.status === 'Pago').length.toString(), 
        icon: CheckCircle, 
        color: "text-teal-600", 
        bg: "bg-teal-50", 
        trend: "+8%",
        description: "Casos quitados"
      },
    ];
  }, [cases]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
          <div className={`absolute inset-0 ${stat.bg} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-6 -translate-y-6"></div>
          
          <CardContent className="p-4 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium leading-tight">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                </div>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EnhancedCasesModule({ initialFilters }: CasesModuleProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState(initialFilters?.status || "all");
    const [filterPriority, setFilterPriority] = useState("all");
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCase, setCurrentCase] = useState<Partial<Case>>({});
    const [selectedCaseForView, setSelectedCaseForView] = useState<Case | null>(null);

    // Estados para modais financeiros
    const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
    const [isFinancialDetailsModalOpen, setIsFinancialDetailsModalOpen] = useState(false);
    const [selectedCaseForFinancial, setSelectedCaseForFinancial] = useState<Case | null>(null);
    const [selectedFinancialAgreement, setSelectedFinancialAgreement] = useState<any>(null);

    const { data: casesData, isLoading: isLoadingCases } = useQuery({
        queryKey: ['cases'],
        queryFn: () => apiClient.getCases(),
    });
    const { data: entitiesData, isLoading: isLoadingEntities } = useQuery({
        queryKey: ['entities'],
        queryFn: () => apiClient.getEntities(),
    });

    const cases: Case[] = casesData?.cases ?? [];
    const allEntities = entitiesData ?? [];
    const isLoading = isLoadingCases || isLoadingEntities;

    const getEntityName = (id: number | undefined) => {
        if (!id) return 'Não selecionado';
        return allEntities.find(e => e.id === id)?.name || `ID ${id} não encontrado`;
    }

    const saveCaseMutation = useMutation({
        mutationFn: (caseData: Partial<Case>) => {
            const dataToSave = {
                ...caseData,
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
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
            setIsModalOpen(false);
        },
        onError: (error: any) => {
            toast({ title: `Erro ao ${isEditMode ? 'atualizar' : 'criar'} caso`, description: error.message, variant: "destructive" });
        },
    });

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

    const openEditModal = (caseItem: Case) => {
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

    const openViewModal = (caseItem: Case) => {
        setSelectedCaseForView(caseItem);
        setIsViewModalOpen(true);
    };

    const openFinancialModal = (caseItem: Case) => {
        setSelectedCaseForFinancial(caseItem);
        setIsFinancialModalOpen(true);
    };

    const openFinancialDetailsModal = (agreement: any) => {
        setSelectedFinancialAgreement(agreement);
        setIsFinancialDetailsModalOpen(true);
    };

    const handleSaveCase = () => {
        if (!currentCase.title || !currentCase.client_entity_id || !currentCase.executed_entity_id) {
            toast({ title: "Campos obrigatórios", description: "Título, Cliente e Executado são obrigatórios.", variant: "destructive" });
            return;
        }
        saveCaseMutation.mutate(currentCase);
    };

    const getStatusBadge = (status: Case['status']) => {
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

    const renderAgreementTypeIcon = (type: string | null | undefined) => {
        switch(type) {
            case 'Judicial': return <Scale className="h-4 w-4 text-blue-500 mr-2" />;
            case 'Extrajudicial': return <FileSignature className="h-4 w-4 text-green-500 mr-2" />;
            case 'Em Audiência': return <Handshake className="h-4 w-4 text-orange-500 mr-2" />;
            case 'Pela Loja': return <Store className="h-4 w-4 text-purple-500 mr-2" />;
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
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-bold mb-3">Gestão Avançada de Casos</h2>
                    <p className="text-slate-300 text-xl">Controle completo de processos com integração financeira inteligente.</p>
                </div>
            </div>

            <EnhancedCasesStats cases={cases} />

            {/* Controles e Filtros */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                                <Input placeholder="Buscar por título, número ou parte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 bg-white/80 border-2 border-slate-200 focus:border-slate-400" />
                            </div>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-[200px] bg-white/80 border-2 border-slate-200"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Acordo">Acordo</SelectItem>
                                    <SelectItem value="Extinto">Extinto</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filterPriority} onValueChange={setFilterPriority}>
                                <SelectTrigger className="w-[150px] bg-white/80 border-2 border-slate-200"><SelectValue placeholder="Prioridade" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas</SelectItem>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Média">Média</SelectItem>
                                    <SelectItem value="Baixa">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-3 items-center">
                            <Button onClick={openCreateModal} className="flex items-center shadow-lg rounded-lg font-semibold transition-colors" style={{ background: 'linear-gradient(90deg,#0f172a,#111827)', color: '#ffffff' }}>
                                <Plus className="mr-2 h-4 w-4" /> Novo Caso
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela Expandida de Casos */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-slate-700 font-bold">Processo / Título</TableHead>
                                <TableHead className="text-slate-700 font-bold">Partes</TableHead>
                                <TableHead className="text-slate-700 font-bold">Status / Prioridade</TableHead>
                                <TableHead className="text-slate-700 font-bold">Valores</TableHead>
                                <TableHead className="text-slate-700 font-bold">Financeiro</TableHead>
                                <TableHead className="text-right text-slate-700 font-bold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCases.map(caseItem => (
                                <TableRow key={caseItem.id} className="group hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent">
                                    {/* Coluna Processo/Título */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">{caseItem.title}</div>
                                            <div className="text-sm text-slate-500 font-mono">{caseItem.case_number || "Sem número"}</div>
                                            {caseItem.court && (
                                                <div className="text-xs text-slate-400 flex items-center gap-1">
                                                    <Building className="h-3 w-3" />
                                                    {caseItem.court}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Coluna Partes */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            {caseItem.case_parties.map((party, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm">
                                                    {party.role === 'Cliente' ? (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="font-medium text-green-700">{party.entities.name}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            <span className="text-slate-600">{party.entities.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>

                                    {/* Coluna Status/Prioridade */}
                                    <TableCell>
                                        <div className="space-y-2">
                                            {getStatusBadge(caseItem.status)}
                                            {getPriorityBadge(caseItem.priority)}
                                            {caseItem.status_reason && (
                                                <p className="text-xs text-slate-500 italic">{caseItem.status_reason}</p>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Coluna Valores */}
                                    <TableCell>
                                        <div className="space-y-1">
                                            {caseItem.value && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500">Causa:</span>
                                                    <span className="font-semibold text-slate-900 ml-1">
                                                        R$ {caseItem.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                            {caseItem.status === 'Acordo' && caseItem.agreement_value && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500">Acordo:</span>
                                                    <span className="font-semibold text-green-600 ml-1">
                                                        R$ {caseItem.agreement_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                            {caseItem.status === 'Pago' && caseItem.final_value && (
                                                <div className="text-sm">
                                                    <span className="text-slate-500">Pago:</span>
                                                    <span className="font-semibold text-blue-600 ml-1">
                                                        R$ {caseItem.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Coluna Financeiro */}
                                    <TableCell>
                                        {caseItem.status === 'Acordo' && (
                                            <div className="space-y-2">
                                                {caseItem.agreement_type && (
                                                    <div className="flex items-center">
                                                        {renderAgreementTypeIcon(caseItem.agreement_type)}
                                                        <span className="text-xs text-slate-600">{caseItem.agreement_type}</span>
                                                    </div>
                                                )}
                                                {caseItem.installments && (
                                                    <div className="flex items-center gap-1">
                                                        <Target className="h-3 w-3 text-purple-500" />
                                                        <span className="text-xs text-slate-600">{caseItem.installments} parcelas</span>
                                                    </div>
                                                )}
                                                {caseItem.down_payment && caseItem.down_payment > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <PiggyBank className="h-3 w-3 text-blue-500" />
                                                        <span className="text-xs text-slate-600">
                                                            Entrada: R$ {caseItem.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                {caseItem.installment_due_date && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3 text-red-500" />
                                                        <span className="text-xs text-slate-600">
                                                            Venc: {new Date(caseItem.installment_due_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => openFinancialModal(caseItem)}
                                                    className="text-xs h-7 px-2"
                                                >
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    Acordo
                                                </Button>
                                            </div>
                                        )}
                                        {caseItem.status !== 'Acordo' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openFinancialModal(caseItem)}
                                                className="text-xs h-7 px-2"
                                            >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Criar Acordo
                                            </Button>
                                        )}
                                    </TableCell>

                                    {/* Coluna Ações */}
                                    <TableCell className="text-right">
                                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => openViewModal(caseItem)} className="hover:bg-slate-100 hover:scale-110 transition-all h-8 w-8">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(caseItem)} className="hover:bg-slate-100 hover:scale-110 transition-all h-8 w-8">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {/* Botões de contato rápido */}
                                            <Button variant="ghost" size="icon" className="hover:bg-blue-100 hover:scale-110 transition-all h-8 w-8">
                                                <MessageSquare className="h-4 w-4 text-blue-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal de Visualização de Caso */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5" /> Detalhes do Caso</DialogTitle>
                        <DialogDescription>{selectedCaseForView?.title}</DialogDescription>
                    </DialogHeader>
                    {selectedCaseForView && (
                        <Tabs defaultValue="geral" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="geral">Geral</TabsTrigger>
                                <TabsTrigger value="partes">Partes</TabsTrigger>
                                <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
                                <TabsTrigger value="historico">Histórico</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="geral" className="space-y-4 mt-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label>Nº do Processo</Label><p className="font-mono text-sm">{selectedCaseForView.case_number || 'N/A'}</p></div>
                                    <div><Label>Vara/Tribunal</Label><p className="text-sm">{selectedCaseForView.court || 'N/A'}</p></div>
                                    <div><Label>Status</Label><div>{getStatusBadge(selectedCaseForView.status)}</div></div>
                                    <div><Label>Prioridade</Label><div>{getPriorityBadge(selectedCaseForView.priority)}</div></div>
                                    <div><Label>Valor da Causa</Label><p className="text-sm">{selectedCaseForView.value ? `R$ ${selectedCaseForView.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                                    <div><Label>Data de Criação</Label><p className="text-sm">{new Date(selectedCaseForView.created_at).toLocaleDateString('pt-BR')}</p></div>
                                </div>
                                <div><Label>Descrição</Label><p className="text-sm bg-slate-50 p-3 rounded-md">{selectedCaseForView.description || 'Nenhuma descrição fornecida.'}</p></div>
                            </TabsContent>
                            
                            <TabsContent value="partes" className="space-y-4 mt-6">
                                {selectedCaseForView.case_parties.map((party, idx) => (
                                    <Card key={idx} className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${party.role === 'Cliente' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">{party.entities.name}</p>
                                                <p className="text-sm text-slate-600">{party.role}</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </TabsContent>
                            
                            <TabsContent value="financeiro" className="space-y-4 mt-6">
                                {selectedCaseForView.status === 'Acordo' ? (
                                    <div className="space-y-4">
                                        <Card className="p-4 bg-green-50">
                                            <h4 className="font-semibold flex items-center text-green-800"><DollarSign className="mr-2 h-4 w-4"/> Acordo Realizado</h4>
                                            <div className="grid grid-cols-2 gap-4 mt-3">
                                                <div><Label>Tipo de Acordo:</Label><p className="text-sm flex items-center">{renderAgreementTypeIcon(selectedCaseForView.agreement_type)}{selectedCaseForView.agreement_type || 'N/A'}</p></div>
                                                <div><Label>Valor do Acordo:</Label><p className="text-sm font-semibold">{selectedCaseForView.agreement_value ? `R$ ${selectedCaseForView.agreement_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                                                <div><Label>Parcelas:</Label><p className="text-sm">{selectedCaseForView.installments || 'N/A'}</p></div>
                                                <div><Label>Valor de Entrada:</Label><p className="text-sm">{selectedCaseForView.down_payment ? `R$ ${selectedCaseForView.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'N/A'}</p></div>
                                                <div><Label>Vencimento:</Label><p className="text-sm">{selectedCaseForView.installment_due_date ? new Date(selectedCaseForView.installment_due_date).toLocaleDateString('pt-BR') : 'N/A'}</p></div>
                                            </div>
                                            <div className="mt-4">
                                                <Button onClick={() => openFinancialModal(selectedCaseForView)} className="bg-green-600 hover:bg-green-700">
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Ver Detalhes Financeiros
                                                </Button>
                                            </div>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                        <p className="text-slate-500 mb-4">Este caso ainda não possui acordo financeiro</p>
                                        <Button onClick={() => openFinancialModal(selectedCaseForView)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Criar Acordo Financeiro
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>
                            
                            <TabsContent value="historico" className="space-y-4 mt-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        <div>
                                            <p className="font-medium">Caso criado</p>
                                            <p className="text-sm text-slate-600">{new Date(selectedCaseForView.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    
                                    {selectedCaseForView.status === 'Acordo' && (
                                        <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                                            <div>
                                                <p className="font-medium">Acordo realizado</p>
                                                <p className="text-sm text-slate-600">Acordo do tipo {selectedCaseForView.agreement_type}</p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {selectedCaseForView.status === 'Pago' && (
                                        <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                            <div>
                                                <p className="font-medium">Pagamento concluído</p>
                                                <p className="text-sm text-slate-600">
                                                    {selectedCaseForView.payment_date ? new Date(selectedCaseForView.payment_date).toLocaleDateString('pt-BR') : 'Data não informada'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Criação/Edição de Caso (simplificado) */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[650px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-slate-600" />{isEditMode ? 'Editar Caso' : 'Criar Novo Caso'}</DialogTitle>
                        <DialogDescription>{isEditMode ? 'Altere as informações do caso.' : 'Preencha as informações do novo caso/processo judicial'}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="title">Título do Caso *</Label><Input id="title" value={currentCase.title || ''} onChange={(e) => setCurrentCase({ ...currentCase, title: e.target.value })} /></div>
                            <div className="space-y-2"><Label htmlFor="case_number">Número do Processo</Label><Input id="case_number" value={currentCase.case_number || ''} onChange={(e) => setCurrentCase({ ...currentCase, case_number: e.target.value })} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Cliente *</Label><Select value={String(currentCase.client_entity_id || '')} onValueChange={(value) => setCurrentCase({ ...currentCase, client_entity_id: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allEntities.filter(e => e.type === 'Cliente').map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                            <div className="space-y-2"><Label>Executado *</Label><Select value={String(currentCase.executed_entity_id || '')} onValueChange={(value) => setCurrentCase({ ...currentCase, executed_entity_id: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{allEntities.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent></Select></div>
                        </div>
                    </div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveCase} disabled={saveCaseMutation.isPending}>{isEditMode ? 'Salvar' : 'Criar'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Acordo Financeiro */}
            <EnhancedFinancialAgreementModal
                isOpen={isFinancialModalOpen}
                onClose={() => setIsFinancialModalOpen(false)}
                caseData={selectedCaseForFinancial}
            />

            {/* Modal de Detalhes do Acordo Financeiro */}
            <FinancialAgreementDetailsModal
                isOpen={isFinancialDetailsModalOpen}
                onClose={() => setIsFinancialDetailsModalOpen(false)}
                agreement={selectedFinancialAgreement}
            />
        </div>
    );
}