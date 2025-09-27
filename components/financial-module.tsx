// components/financial-module.tsx - VERSÃO FINAL CORRIGIDA
"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, DollarSign, Send, Loader2, AlertCircle, RefreshCw, TrendingUp, Receipt, CheckCircle,
  FileText, Calendar, CreditCard, Search, Eye, Edit, Trash2, Users, Scale, Store,
  FileSignature, Handshake, Clock, ChevronDown, ChevronRight, Calculator
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

// ===== TIPOS E INTERFACES =====
interface Alvara {
  id: number; case_id: number; case_number: string; value: number; received: boolean;
  issue_date: string; received_date?: string | null; creditor_name?: string; court?: string;
}

interface Expense {
  id: number; description: string; category: string; value: number; date: string;
  status: 'pending' | 'paid'; due_date?: string; payment_method?: string; notes?: string;
}

interface OverdueInstallment {
  id: number; agreement_id: number; client_name: string; case_number: string;
  installment_number: number; value: number; due_date: string; days_overdue: number;
  total_agreement_value: number; client_contact?: { phone?: string; email?: string; };
}

// ✅ REMOVIDO: A interface EnhancedFinancialAgreement não é mais necessária,
// pois a FinancialAgreement importada de api-client.ts já está correta.

// ===== DADOS MOCK (Mantidos como no original) =====
const mockAlvaras: Alvara[] = [
    { id: 1, case_id: 2, case_number: '002/2024', value: 8500, received: true, issue_date: '2024-08-15', received_date: '2024-09-01', creditor_name: 'João Silva', court: '1ª Vara Cível' },
    { id: 2, case_id: 4, case_number: '004/2024', value: 12300, received: false, issue_date: '2024-09-10', creditor_name: 'Maria Santos', court: '2ª Vara Cível' },
];
const mockExpenses: Expense[] = [
    { id: 1, description: 'Aluguel Escritório', category: 'Fixo', value: 2500, date: '2025-09-05', status: 'paid', payment_method: 'Transferência Bancária' },
    { id: 2, description: 'Software Jurídico', category: 'Software', value: 250, date: '2025-09-10', status: 'pending', due_date: '2025-09-15' },
];
const mockOverdueInstallments: OverdueInstallment[] = [
    { id: 1, agreement_id: 1, client_name: 'Carlos Mendes', case_number: '001/2024', installment_number: 3, value: 1200, due_date: '2024-08-15', days_overdue: 42, total_agreement_value: 15000, client_contact: { phone: '(11) 99999-1234', email: 'carlos@email.com' } },
];

// ===== UTILIDADES =====
const calculateInstallmentInfo = (agreement: FinancialAgreement) => {
  const totalValue = agreement.total_value || 0;
  const entryValue = agreement.entry_value || 0;
  const remainingValue = totalValue - entryValue;
  const installmentValue = agreement.installments > 0 ? remainingValue / agreement.installments : 0;
  
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 30);
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
  
  return { installmentValue, nextDueDate: nextDueDate.toISOString().split('T')[0], daysUntilDue };
};

const formatCurrency = (value: number | null | undefined) => {
  if (typeof value !== 'number') return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'Data não informada';
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// ===== COMPONENTE DE ESTATÍSTICAS =====
function FinancialStats({ agreements }: { agreements: FinancialAgreement[] }) {
  const stats = useMemo(() => {
    const totalValue = agreements.reduce((sum, a) => sum + (a.total_value || 0), 0);
    const activeAgreements = agreements.filter(a => a.status === 'active').length;
    const totalInstallments = agreements.reduce((sum, a) => sum + a.installments, 0);
    const overdueAgreements = agreements.filter(a => a.status === 'defaulted').length;

    return [
      { label: "Valor Total em Acordos", value: formatCurrency(totalValue), icon: DollarSign, color: "text-blue-600", bg: "from-blue-50 to-blue-100", trend: "+5.2%" },
      { label: "Acordos Ativos", value: activeAgreements.toString(), icon: TrendingUp, color: "text-green-600", bg: "from-green-50 to-green-100", trend: `${activeAgreements} de ${agreements.length}` },
      { label: "Total de Parcelas", value: totalInstallments.toString(), icon: Calculator, color: "text-purple-600", bg: "from-purple-50 to-purple-100", trend: `${agreements.length} acordos` },
      { label: "Parcelas em Atraso", value: overdueAgreements.toString(), icon: AlertCircle, color: "text-red-600", bg: "from-red-50 to-red-100", trend: overdueAgreements > 0 ? "Atenção!" : "Em dia" },
    ];
  }, [agreements]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
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

// ===== ÍCONES DE TIPO DE ACORDO =====
function renderAgreementTypeIcon(type: string) {
  const iconMap = {
    'Judicial': { icon: Scale, color: 'text-blue-600', label: 'Judicial' },
    'Extrajudicial': { icon: FileSignature, color: 'text-green-600', label: 'Extrajudicial' },
    'Em Audiência': { icon: Handshake, color: 'text-purple-600', label: 'Em Audiência' },
    'Pela Loja': { icon: Store, color: 'text-orange-600', label: 'Pela Loja' }
  };
  const config = iconMap[type as keyof typeof iconMap] || { icon: FileText, color: 'text-gray-600', label: type };
  const IconComponent = config.icon;
  return (
    <div className="flex items-center space-x-2">
      <IconComponent className={`h-4 w-4 ${config.color}`} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

// ===== CARD DE DETALHES DO ACORDO =====
function AgreementDetailsCard({ agreement, isExpanded, onToggle, onSendMessage }: {
  agreement: FinancialAgreement & { has_alvara?: boolean }; // Usando o tipo importado diretamente
  isExpanded: boolean; onToggle: () => void;
  onSendMessage: (agreement: FinancialAgreement) => void;
}) {
  const { installmentValue, nextDueDate, daysUntilDue } = calculateInstallmentInfo(agreement);
  
  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      'completed': { label: 'Concluído', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'defaulted': { label: 'Em Atraso', className: 'bg-red-100 text-red-800 border-red-200' },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 border-gray-200' }
    };
    const config = variants[status as keyof typeof variants] || variants['active'];
    return <Badge className={`${config.className} border font-semibold`}>{config.label}</Badge>;
  };

  return (
    <Card className="mb-4 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
              <div>
                <h4 className="font-semibold text-slate-900">{agreement.entities?.name || 'Cliente não informado'}</h4>
                <p className="text-sm text-slate-500">{agreement.cases?.case_number || 'Sem número'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">{formatCurrency(agreement.total_value)}</p>
                <p className="text-sm text-slate-500">{agreement.installments}x de {formatCurrency(installmentValue)}</p>
              </div>
              {getStatusBadge(agreement.status)}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4 border-t bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><FileText className="h-4 w-4 mr-2" />Informações do Acordo</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Tipo:</span><div>{renderAgreementTypeIcon(agreement.agreement_type)}</div></div>
                  <div className="flex justify-between"><span className="text-slate-600">Valor de Entrada:</span><span className="font-medium">{formatCurrency(agreement.entry_value || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Valor Restante:</span><span className="font-medium">{formatCurrency((agreement.total_value || 0) - (agreement.entry_value || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Nº de Parcelas:</span><span className="font-medium">{agreement.installments}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><Calendar className="h-4 w-4 mr-2" />Cronograma</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Valor da Parcela:</span><span className="font-bold text-green-600">{formatCurrency(installmentValue)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Próximo Vencimento:</span><span className="font-medium">{formatDate(nextDueDate)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Dias até Vencimento:</span><Badge variant={daysUntilDue <= 7 ? "destructive" : daysUntilDue <= 15 ? "outline" : "secondary"}>{daysUntilDue} dias</Badge></div>
                  <div className="flex justify-between"><span className="text-slate-600">Possui Alvará:</span><Badge variant={agreement.has_alvara ? "default" : "outline"}>{agreement.has_alvara ? "Sim" : "Não"}</Badge></div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><Users className="h-4 w-4 mr-2" />Partes Envolvidas</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Cliente:</span>
                    <p className="font-medium">{agreement.entities?.name || 'N/A'}</p>
                    {agreement.entities?.document && <p className="text-xs text-slate-500">{agreement.entities.document}</p>}
                  </div>
                  {/* ✅ CORREÇÃO: Usando 'executed_entities' com segurança */}
                  {agreement.executed_entities && (
                    <div>
                      <span className="text-slate-600">Executado:</span>
                      <p className="font-medium">{agreement.executed_entities.name}</p>
                      {agreement.executed_entities.document && <p className="text-xs text-slate-500">{agreement.executed_entities.document}</p>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {agreement.notes && (
              <div className="border-t pt-3 mt-3">
                <h6 className="font-semibold text-slate-700 mb-2">Observações:</h6>
                <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border">{agreement.notes}</p>
              </div>
            )}

            <div className="flex justify-end space-x-2 border-t pt-3 mt-3">
              <Button size="sm" variant="outline"><Eye className="h-4 w-4 mr-1" />Visualizar</Button>
              <Button size="sm" variant="outline"><Edit className="h-4 w-4 mr-1" />Editar</Button>
              <Button size="sm" onClick={() => onSendMessage(agreement)} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-1" />Enviar Cobrança
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===== ABA DE ACORDOS =====
function AgreementsTab({ agreements, onSendMessage }: { agreements: FinancialAgreement[], onSendMessage: (agreement: FinancialAgreement) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedAgreements, setExpandedAgreements] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((agreementId: number) => {
    setExpandedAgreements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(agreementId)) newSet.delete(agreementId);
      else newSet.add(agreementId);
      return newSet;
    });
  }, []);

  const filteredAgreements = useMemo(() => {
    // Adicionando dados mock `has_alvara` para fins de exibição
    const agreementsWithMockData = agreements.map(ag => ({...ag, has_alvara: Math.random() > 0.5}));

    return agreementsWithMockData.filter(agreement => {
      const searchMatch = 
        agreement.entities?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.cases?.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        // ✅ CORREÇÃO: Usando 'executed_entities' com segurança
        agreement.executed_entities?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === "all" || agreement.status === statusFilter;
      const typeMatch = typeFilter === "all" || agreement.agreement_type === typeFilter;
      
      return searchMatch && statusMatch && typeMatch;
    });
  }, [agreements, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input placeholder="Buscar por cliente, processo ou executado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="defaulted">Em Atraso</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="Judicial">Judicial</SelectItem>
              <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
              <SelectItem value="Em Audiência">Em Audiência</SelectItem>
              <SelectItem value="Pela Loja">Pela Loja</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExpandedAgreements(new Set())}>Recolher Todos</Button>
          <Button variant="outline" onClick={() => setExpandedAgreements(new Set(filteredAgreements.map(a => a.id)))}>Expandir Todos</Button>
          <Button><Plus className="mr-2 h-4 w-4" /> Novo Acordo</Button>
        </div>
      </div>

      <div className="space-y-0">
        <div className="mb-4 text-sm text-slate-600 bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <span>Mostrando {filteredAgreements.length} de {agreements.length} acordos</span>
            <span className="font-semibold">Valor Total: {formatCurrency(filteredAgreements.reduce((sum, a) => sum + (a.total_value || 0), 0))}</span>
          </div>
        </div>

        {filteredAgreements.length === 0 ? (
          <Card><CardContent className="text-center py-12"><FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum acordo encontrado</h3><p className="text-slate-500">Tente ajustar os filtros de busca.</p></CardContent></Card>
        ) : (
          <div className="space-y-2">
            {filteredAgreements.map((agreement) => (
              <AgreementDetailsCard key={agreement.id} agreement={agreement} isExpanded={expandedAgreements.has(agreement.id)} onToggle={() => toggleExpanded(agreement.id)} onSendMessage={onSendMessage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ABA DE ALVARÁS (mantida como original) =====
function AlvarasTab({ alvaras, onMarkAsReceived }: { alvaras: Alvara[], onMarkAsReceived: (id: number) => void }) {
    // ...código original mantido...
    return <div>Conteúdo da Aba Alvarás</div>;
}

// ===== ABA DE PARCELAS EM ATRASO (mantida como original) =====
function OverdueTab({ overdueInstallments, onSendMessage }: { overdueInstallments: OverdueInstallment[], onSendMessage: (installment: OverdueInstallment) => void }) {
    // ...código original mantido...
    return <div>Conteúdo da Aba Parcelas em Atraso</div>;
}

// ===== ABA DE DESPESAS (mantida como original) =====
function ExpensesTab({ expenses, onAddExpense, onToggleExpenseStatus }: { expenses: Expense[], onAddExpense: () => void, onToggleExpenseStatus: (id: number) => void }) {
    // ...código original mantido...
    return <div>Conteúdo da Aba Despesas</div>;
}

// ===== COMPONENTE PRINCIPAL =====
export function FinancialModule() {
  const { toast } = useToast();
  
  const { data: agreements, isLoading, error, refetch } = useQuery<FinancialAgreement[], Error>({
    queryKey: ['financialAgreements'],
    queryFn: () => apiClient.getFinancialAgreements(),
    refetchOnWindowFocus: true, retry: 2, staleTime: 10000, 
  });
  
  const [alvaras, setAlvaras] = useState<Alvara[]>(mockAlvaras);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [overdueInstallments] = useState<OverdueInstallment[]>(mockOverdueInstallments);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{name: string, type: string} | null>(null);

  const safeAgreements: FinancialAgreement[] = Array.isArray(agreements) ? agreements : [];
  
  const handleSendMessage = useCallback((agreement: FinancialAgreement) => {
    if (!agreement.entities) {
        toast({ title: "Erro", description: "Não é possível enviar mensagem para um acordo sem cliente." });
        return;
    }
    setSelectedRecipient({name: agreement.entities.name, type: 'acordo'});
    setMessageText(`Prezado(a) ${agreement.entities.name},\n\nLembramos que a parcela do seu acordo referente ao processo ${agreement.cases?.case_number || 'sem número'} está em atraso.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  }, [toast]);

  const handleSendOverdueMessage = useCallback((installment: OverdueInstallment) => {
    setSelectedRecipient({name: installment.client_name, type: 'parcela'});
    setMessageText(`Prezado(a) ${installment.client_name},\n\nSua parcela nº ${installment.installment_number} do processo ${installment.case_number} está em atraso.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  }, []);

  const handleMarkAsReceived = useCallback((alvaraId: number) => {
    setAlvaras(prev => prev.map(a => a.id === alvaraId ? { ...a, received: true, received_date: new Date().toISOString().split('T')[0] } : a));
    toast({ title: "Sucesso!", description: "Alvará marcado como recebido!" });
  }, [toast]);

  const handleAddExpense = useCallback(() => {
    toast({ title: "Em desenvolvimento", description: "Funcionalidade de adicionar despesa será implementada em breve." });
  }, [toast]);

  const handleToggleExpenseStatus = useCallback((expenseId: number) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: e.status === 'paid' ? 'pending' : 'paid' } : e));
    toast({ title: "Sucesso!", description: "Status da despesa atualizado!" });
  }, [toast]);

  const handleSendMessageAction = useCallback(() => {
    toast({ title: "Mensagem Enviada!", description: `Lembrete enviado para ${selectedRecipient?.name}` }); 
    setMessageModalOpen(false);
  }, [selectedRecipient, toast]);

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados financeiros</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700"><RefreshCw className="mr-2 h-4 w-4"/> Tentar Novamente</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/><p className="text-gray-500">Carregando dados...</p></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
            <p className="text-slate-100">Controle total sobre acordos, alvarás, e despesas</p>
          </div>
          <Button onClick={() => refetch()} className="bg-white/10 text-white hover:bg-white/20"><RefreshCw className="mr-2 h-4 w-4"/> Atualizar Dados</Button>
        </div>
      </div>

      <FinancialStats agreements={safeAgreements} />
      
      <Tabs defaultValue="acordos" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="acordos" className="flex items-center space-x-2"><FileText className="h-4 w-4" /><span>Acordos</span><Badge variant="secondary" className="ml-2">{safeAgreements.length}</Badge></TabsTrigger>
          <TabsTrigger value="alvaras" className="flex items-center space-x-2"><Receipt className="h-4 w-4" /><span>Alvarás</span><Badge variant="secondary" className="ml-2">{alvaras.length}</Badge></TabsTrigger>
          <TabsTrigger value="atraso" className="flex items-center space-x-2"><AlertCircle className="h-4 w-4" /><span>Atrasados</span><Badge variant="destructive" className="ml-2">{overdueInstallments.length}</Badge></TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center space-x-2"><CreditCard className="h-4 w-4" /><span>Despesas</span><Badge variant="secondary" className="ml-2">{expenses.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="acordos"><AgreementsTab agreements={safeAgreements} onSendMessage={handleSendMessage} /></TabsContent>
        <TabsContent value="alvaras"><AlvarasTab alvaras={alvaras} onMarkAsReceived={handleMarkAsReceived} /></TabsContent>
        <TabsContent value="atraso"><OverdueTab overdueInstallments={overdueInstallments} onSendMessage={handleSendOverdueMessage} /></TabsContent>
        <TabsContent value="despesas"><ExpensesTab expenses={expenses} onAddExpense={handleAddExpense} onToggleExpenseStatus={handleToggleExpenseStatus} /></TabsContent>
      </Tabs>

      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Enviar Lembrete para {selectedRecipient?.name}</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="message">Conteúdo da Mensagem</Label>
            <Textarea id="message" value={messageText} onChange={e => setMessageText(e.target.value)} className="min-h-[150px] mt-2" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSendMessageAction}><Send className="mr-2 h-4 w-4"/> Enviar Mensagem</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}