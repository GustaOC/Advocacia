// components/financial-module.tsx - VERSÃO COM LISTAS LINEARES
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  DollarSign, 
  Send, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  TrendingUp, 
  Receipt, 
  Banknote,
  CheckCircle,
  PiggyBank,
  FileText,
  Calendar,
  CreditCard,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Tipos
interface Alvara {
  id: number;
  case_id: number;
  case_number: string;
  value: number;
  received: boolean;
  issue_date: string;
  received_date?: string;
}

interface Expense {
  id: number;
  description: string;
  category: string;
  value: number;
  date: string;
  status: 'pending' | 'paid';
}

// Mocks temporários
const mockAlvaras: Alvara[] = [
  { id: 1, case_id: 2, case_number: '002/2024', value: 8500, received: true, issue_date: '2024-08-15', received_date: '2024-09-01' },
  { id: 2, case_id: 4, case_number: '004/2024', value: 12300, received: false, issue_date: '2024-09-10' },
  { id: 3, case_id: 5, case_number: '005/2024', value: 7500, received: false, issue_date: '2024-09-12' },
];

const mockExpenses: Expense[] = [
  { id: 1, description: 'Aluguel Escritório', category: 'Fixo', value: 2500, date: '2025-09-05', status: 'paid' },
  { id: 2, description: 'Software Jurídico', category: 'Software', value: 250, date: '2025-09-10', status: 'pending' },
  { id: 3, description: 'Material de Escritório', category: 'Variável', value: 150, date: '2025-09-12', status: 'paid' },
  { id: 4, description: 'Honorários Contábeis', category: 'Fixo', value: 800, date: '2025-09-15', status: 'pending' },
];

// --- COMPONENTES INTERNOS MANTIDOS ---
function FinancialStats({ agreements }: { agreements: FinancialAgreement[] }) {
  const totalValue = useMemo(() => agreements.reduce((sum, a) => sum + a.total_value, 0), [agreements]);
  const receivedValue = useMemo(() => agreements.filter(a => a.status === 'completed').reduce((sum, a) => sum + a.total_value, 0), [agreements]);

  const stats = [
    { 
      label: "Valor Total em Acordos", 
      value: `R$ ${totalValue.toLocaleString('pt-BR')}`, 
      icon: DollarSign, 
      color: "text-blue-600",
      bg: "from-blue-50 to-blue-100",
      trend: "+5%"
    },
    { 
      label: "Acordos Ativos", 
      value: agreements.filter(t => t.status === 'active').length.toString(), 
      icon: TrendingUp, 
      color: "text-orange-600",
      bg: "from-orange-50 to-orange-100",
      trend: "+12%"
    },
    { 
      label: "Acordos Concluídos", 
      value: agreements.filter(t => t.status === 'completed').length.toString(), 
      icon: CheckCircle, 
      color: "text-green-600",
      bg: "from-green-50 to-green-100",
      trend: "+8%"
    },
    { 
      label: "Parcelas em Atraso", 
      value: agreements.filter(t => t.status === 'defaulted').length.toString(), 
      icon: AlertCircle, 
      color: "text-red-600",
      bg: "from-red-50 to-red-100",
      trend: "+2"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg}`}>
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

// --- NOVOS COMPONENTES COM LISTAS LINEARES ---

// Componente para Acordos - Lista Linear
function AgreementsTab({ agreements, onSendMessage }: { agreements: FinancialAgreement[], onSendMessage: (agreement: FinancialAgreement) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgreements = useMemo(() => {
    return agreements.filter(agreement => 
      agreement.entities.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.cases.case_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agreements, searchTerm]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { label: 'Ativo', variant: 'default' as const },
      'completed': { label: 'Concluído', variant: 'secondary' as const },
      'defaulted': { label: 'Em Atraso', variant: 'destructive' as const },
      'pending': { label: 'Pendente', variant: 'outline' as const }
    };
    
    const config = variants[status as keyof typeof variants] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Buscar acordos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Acordo
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Lista de Acordos ({filteredAgreements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-600">Cliente</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Processo</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Valor Total</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgreements.map((agreement, index) => (
                  <tr key={agreement.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-4 border-b">
                      <div>
                        <p className="font-medium text-slate-900">{agreement.entities.name}</p>
                        <p className="text-sm text-slate-500">{agreement.entities.document}</p>
                      </div>
                    </td>
                    <td className="p-4 border-b">
                      <p className="text-slate-900">{agreement.cases.case_number || 'N/A'}</p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="font-semibold text-green-600">
                        R$ {agreement.total_value.toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      {getStatusBadge(agreement.status)}
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onSendMessage(agreement)}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para Alvarás - Lista Linear
function AlvarasTab({ alvaras, onMarkAsReceived }: { alvaras: Alvara[], onMarkAsReceived: (id: number) => void }) {
  const pendingAlvaras = useMemo(() => alvaras.filter(a => !a.received), [alvaras]);
  const receivedAlvaras = useMemo(() => alvaras.filter(a => a.received), [alvaras]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Alvará
        </Button>
      </div>

      {/* Alvarás Pendentes */}
      <Card>
        <CardHeader className="pb-3 bg-amber-50">
          <CardTitle className="flex items-center text-amber-700">
            <AlertCircle className="mr-2 h-5 w-5" />
            Alvarás Pendentes ({pendingAlvaras.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-600">Processo</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Valor</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Data de Emissão</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingAlvaras.map((alvara, index) => (
                  <tr key={alvara.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-4 border-b">
                      <p className="font-medium text-slate-900">{alvara.case_number}</p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="font-semibold text-blue-600">
                        R$ {alvara.value.toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="text-slate-600">
                        {new Date(alvara.issue_date).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <Button 
                        size="sm" 
                        onClick={() => onMarkAsReceived(alvara.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Marcar como Recebido
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alvarás Recebidos */}
      <Card>
        <CardHeader className="pb-3 bg-green-50">
          <CardTitle className="flex items-center text-green-700">
            <CheckCircle className="mr-2 h-5 w-5" />
            Alvarás Recebidos ({receivedAlvaras.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-600">Processo</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Valor</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Data de Emissão</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Data de Recebimento</th>
                </tr>
              </thead>
              <tbody>
                {receivedAlvaras.map((alvara, index) => (
                  <tr key={alvara.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-4 border-b">
                      <p className="font-medium text-slate-900">{alvara.case_number}</p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="font-semibold text-green-600">
                        R$ {alvara.value.toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="text-slate-600">
                        {new Date(alvara.issue_date).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="text-slate-600">
                        {alvara.received_date ? new Date(alvara.received_date).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para Parcelas em Atraso - Lista Linear
function OverdueTab({ agreements, onSendMessage, onFulfillment }: { 
  agreements: FinancialAgreement[], 
  onSendMessage: (agreement: FinancialAgreement) => void,
  onFulfillment: (agreement: FinancialAgreement) => void 
}) {
  const overdueAgreements = useMemo(() => {
    return agreements.filter((agreement) => agreement.status === 'defaulted');
  }, [agreements]);

  const totalOverdue = useMemo(() => {
    return overdueAgreements.reduce((sum, agreement) => sum + agreement.total_value, 0);
  }, [overdueAgreements]);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="font-semibold text-red-700">Valor Total em Atraso</h3>
              <p className="text-3xl font-bold text-red-600">
                R$ {totalOverdue.toLocaleString('pt-BR')}
              </p>
              <p className="text-red-600">{overdueAgreements.length} acordo(s) em situação de inadimplência</p>
            </div>
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Acordos em Atraso */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-red-700">
            <AlertCircle className="mr-2 h-5 w-5" />
            Acordos com Parcelas em Atraso
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {overdueAgreements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">Nenhuma parcela em atraso no momento</p>
              <p className="text-slate-500">Todos os acordos estão em dia</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-600">Cliente</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Processo</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Valor em Atraso</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Dias em Atraso</th>
                    <th className="text-left p-4 font-semibold text-slate-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueAgreements.map((agreement, index) => (
                    <tr key={agreement.id} className={index % 2 === 0 ? 'bg-white' : 'bg-red-50/30'}>
                      <td className="p-4 border-b">
                        <div>
                          <p className="font-medium text-slate-900">{agreement.entities.name}</p>
                          <p className="text-sm text-slate-500">{agreement.entities.document}</p>
                        </div>
                      </td>
                      <td className="p-4 border-b">
                        <p className="text-slate-900">{agreement.cases.case_number || 'N/A'}</p>
                      </td>
                      <td className="p-4 border-b">
                        <p className="font-semibold text-red-600">
                          R$ {agreement.total_value.toLocaleString('pt-BR')}
                        </p>
                      </td>
                      <td className="p-4 border-b">
                        <Badge variant="destructive">15 dias</Badge>
                      </td>
                      <td className="p-4 border-b">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => onSendMessage(agreement)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Lembrete
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onFulfillment(agreement)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Cumprimento
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para Despesas - Lista Linear
function ExpensesTab({ expenses }: { expenses: Expense[] }) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const filteredExpenses = useMemo(() => {
    if (filter === 'all') return expenses;
    return expenses.filter(expense => expense.status === filter);
  }, [expenses, filter]);

  const totalExpenses = useMemo(() => 
    expenses.reduce((sum, expense) => sum + expense.value, 0), 
    [expenses]
  );

  const pendingExpenses = useMemo(() => 
    expenses.filter(expense => expense.status === 'pending').reduce((sum, expense) => sum + expense.value, 0), 
    [expenses]
  );

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 font-medium">Total de Despesas</p>
            <p className="text-2xl font-bold text-blue-700">
              R$ {totalExpenses.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-600 font-medium">Pendentes de Pagamento</p>
            <p className="text-2xl font-bold text-amber-700">
              R$ {pendingExpenses.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-sm text-green-600 font-medium">Despesas Pagas</p>
            <p className="text-2xl font-bold text-green-700">
              R$ {(totalExpenses - pendingExpenses).toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({expenses.length})
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes ({expenses.filter(e => e.status === 'pending').length})
          </Button>
          <Button 
            variant={filter === 'paid' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('paid')}
          >
            Pagas ({expenses.filter(e => e.status === 'paid').length})
          </Button>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Despesa
        </Button>
      </div>

      {/* Lista de Despesas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Despesas do Escritório</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-600">Descrição</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Categoria</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Valor</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Data</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense, index) => (
                  <tr key={expense.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-4 border-b">
                      <p className="font-medium text-slate-900">{expense.description}</p>
                    </td>
                    <td className="p-4 border-b">
                      <Badge variant="outline">{expense.category}</Badge>
                    </td>
                    <td className="p-4 border-b">
                      <p className="font-semibold text-slate-900">
                        R$ {expense.value.toLocaleString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <p className="text-slate-600">
                        {new Date(expense.date).toLocaleDateString('pt-BR')}
                      </p>
                    </td>
                    <td className="p-4 border-b">
                      <Badge variant={expense.status === 'paid' ? 'secondary' : 'default'}>
                        {expense.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// --- COMPONENTE PRINCIPAL ATUALIZADO ---
export function FinancialModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { 
    data: agreements, 
    isLoading, 
    error,
    refetch 
  } = useQuery<FinancialAgreement[], Error>({
    queryKey: ['financialAgreements'],
    queryFn: () => apiClient.getFinancialAgreements(),
    refetchOnWindowFocus: false,
    initialData: [],
  });
  
  const [alvaras, setAlvaras] = useState<Alvara[]>(mockAlvaras);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<FinancialAgreement | null>(null);

  const safeAgreements: FinancialAgreement[] = Array.isArray(agreements) ? agreements : [];

  const handleSendMessage = (agreement: FinancialAgreement) => {
    setSelectedAgreement(agreement);
    setMessageText(`Prezado(a) ${agreement.entities.name},\n\nLembramos que a parcela do seu acordo referente ao processo ${agreement.cases.case_number || 'sem número'} está em atraso. Para evitar a retomada do processo, por favor, regularize o pagamento.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  };
  
  const handleFulfillment = (agreement: FinancialAgreement) => {
    if(confirm(`Tem certeza que deseja enviar o processo ${agreement.cases.case_number || 'sem número'} para cumprimento de sentença?`)) {
        toast({title: "Processo Enviado!", description: `O processo ${agreement.cases.case_number || 'sem número'} foi enviado para cumprimento de sentença.`});
    }
  };

  const handleMarkAsReceived = (alvaraId: number) => {
    setAlvaras(prev => prev.map(a => a.id === alvaraId ? {...a, received: true, received_date: new Date().toISOString().split('T')[0]} : a));
    toast({title: "Sucesso!", description: "Alvará marcado como recebido!"});
  }

  if (error) {
    return (
        <Card className="border-red-200">
          <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
              <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados financeiros</h3>
              <p className="text-red-600 mb-4">{error.message}</p>
              <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
                <RefreshCw className="mr-2 h-4 w-4"/> Tentar Novamente
              </Button>
          </CardContent>
        </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>
          <p className="text-gray-500">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
                <p className="text-slate-100">Controle total sobre acordos, alvarás, e despesas</p>
            </div>
            <Button onClick={() => refetch()} className="bg-white/10 text-white hover:bg-white/20">
                <RefreshCw className="mr-2 h-4 w-4"/> Atualizar Dados
            </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <FinancialStats agreements={safeAgreements} />
      
      {/* Abas Principais */}
      <Tabs defaultValue="acordos" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="acordos" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Acordos</span>
            <Badge variant="secondary" className="ml-2">{safeAgreements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="alvaras" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Alvarás</span>
            <Badge variant="secondary" className="ml-2">{alvaras.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="atraso" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Parcelas em Atraso</span>
            <Badge variant="destructive" className="ml-2">
              {safeAgreements.filter(a => a.status === 'defaulted').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Despesas</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Abas */}
        <TabsContent value="acordos">
          <AgreementsTab 
            agreements={safeAgreements} 
            onSendMessage={handleSendMessage}
          />
        </TabsContent>

        <TabsContent value="alvaras">
          <AlvarasTab 
            alvaras={alvaras}
            onMarkAsReceived={handleMarkAsReceived}
          />
        </TabsContent>

        <TabsContent value="atraso">
          <OverdueTab 
            agreements={safeAgreements}
            onSendMessage={handleSendMessage}
            onFulfillment={handleFulfillment}
          />
        </TabsContent>

        <TabsContent value="despesas">
          <ExpensesTab expenses={expenses} />
        </TabsContent>
      </Tabs>

      {/* Modal de Mensagem */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Lembrete para {selectedAgreement?.entities.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="message">Conteúdo da Mensagem</Label>
                <Textarea id="message" value={messageText} onChange={e => setMessageText(e.target.value)} className="min-h-[150px] mt-2"/>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => { 
                  toast({title: "Mensagem Enviada!", description: `Lembrete enviado para ${selectedAgreement?.entities.name}`}); 
                  setMessageModalOpen(false); 
                }}>
                  <Send className="mr-2 h-4 w-4"/> Enviar Mensagem
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}