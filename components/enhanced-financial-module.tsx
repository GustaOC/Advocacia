// components/enhanced-financial-module.tsx - VERSÃO COMPLETAMENTE MELHORADA
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, DollarSign, Send, Loader2, AlertCircle, RefreshCw, TrendingUp, 
  Receipt, CheckCircle, PiggyBank, FileText, Calendar, CreditCard, Search,
  MoreVertical, Eye, Edit, Trash2, Users, Scale, Handshake, Store,
  FileSignature, Banknote, Clock, AlertTriangle, Target, Percent,
  CalendarDays, CreditCardIcon, Building, UserCheck, Calculator,
  TrendingDown, Download, Filter, SortAsc, ArrowUpDown, Info,
  MessageSquare, Gavel, Phone, Mail
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Componente de estatísticas expandidas
function EnhancedFinancialStats({ agreements }: { agreements: FinancialAgreement[] }) {
  const stats = useMemo(() => {
    const totalValue = agreements.reduce((sum, a) => sum + a.total_value, 0);
    const paidAmount = agreements.reduce((sum, a) => sum + (a.paid_amount || 0), 0);
    const overdueAmount = agreements.reduce((sum, a) => sum + (a.overdue_amount || 0), 0);
    const activeAgreements = agreements.filter(a => a.status === 'active').length;
    const completedAgreements = agreements.filter(a => a.status === 'completed').length;
    const defaultedAgreements = agreements.filter(a => a.status === 'defaulted').length;
    const withCourtRelease = agreements.filter(a => a.has_court_release).length;
    const avgInstallments = agreements.reduce((sum, a) => sum + a.installments, 0) / agreements.length || 0;

    return [
      { 
        label: "Valor Total em Acordos", 
        value: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        icon: DollarSign, 
        color: "text-blue-600",
        bg: "from-blue-50 to-blue-100",
        trend: `${agreements.length} acordos`,
        description: "Soma de todos os acordos ativos"
      },
      { 
        label: "Valor Recebido", 
        value: `R$ ${paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        icon: CheckCircle, 
        color: "text-green-600",
        bg: "from-green-50 to-green-100",
        trend: `${((paidAmount / totalValue) * 100).toFixed(1)}%`,
        description: "Percentual do valor total já recebido"
      },
      { 
        label: "Em Atraso", 
        value: `R$ ${overdueAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
        icon: AlertTriangle, 
        color: "text-red-600",
        bg: "from-red-50 to-red-100",
        trend: `${defaultedAgreements} acordos`,
        description: "Valor total em parcelas vencidas"
      },
      { 
        label: "Com Alvará", 
        value: withCourtRelease.toString(), 
        icon: Gavel, 
        color: "text-purple-600",
        bg: "from-purple-50 to-purple-100",
        trend: `${((withCourtRelease / agreements.length) * 100).toFixed(0)}%`,
        description: "Acordos que geram alvará judicial"
      },
      { 
        label: "Acordos Ativos", 
        value: activeAgreements.toString(), 
        icon: TrendingUp, 
        color: "text-orange-600",
        bg: "from-orange-50 to-orange-100",
        trend: "Em andamento",
        description: "Acordos com pagamento em dia"
      },
      { 
        label: "Média de Parcelas", 
        value: avgInstallments.toFixed(1), 
        icon: Calculator, 
        color: "text-indigo-600",
        bg: "from-indigo-50 to-indigo-100",
        trend: "Por acordo",
        description: "Número médio de parcelas por acordo"
      },
    ];
  }, [agreements]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
            
            <CardContent className="p-4 relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.bg}`}>
                  <StatIcon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-slate-600 font-medium leading-tight">{stat.label}</p>
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente para tabela de acordos expandida
function EnhancedAgreementsTab({ 
  agreements, 
  onSendMessage, 
  onViewDetails, 
  onRenegotiate 
}: { 
  agreements: FinancialAgreement[], 
  onSendMessage: (agreement: FinancialAgreement) => void,
  onViewDetails: (agreement: FinancialAgreement) => void,
  onRenegotiate: (agreement: FinancialAgreement) => void 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof FinancialAgreement>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredAndSortedAgreements = useMemo(() => {
    let filtered = agreements.filter(agreement => {
      const searchMatch = 
        agreement.client_entities.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.executed_entities?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.cases.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agreement.cases.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = statusFilter === "all" || agreement.status === statusFilter;
      const typeMatch = typeFilter === "all" || agreement.agreement_type === typeFilter;
      
      return searchMatch && statusMatch && typeMatch;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [agreements, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      'completed': { label: 'Concluído', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'defaulted': { label: 'Em Atraso', className: 'bg-red-100 text-red-800 border-red-200' },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'renegotiated': { label: 'Renegociado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={`${config.className} font-semibold border px-3 py-1`}>{config.label}</Badge>;
  };

  const getAgreementTypeIcon = (type: string) => {
    switch(type) {
      case 'Judicial': return <Scale className="h-4 w-4 text-blue-600" />;
      case 'Extrajudicial': return <FileSignature className="h-4 w-4 text-green-600" />;
      case 'Em Audiência': return <Handshake className="h-4 w-4 text-orange-600" />;
      case 'Pela Loja': return <Store className="h-4 w-4 text-purple-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'pix': return <CreditCardIcon className="h-4 w-4 text-green-600" />;
      case 'bank_transfer': return <Building className="h-4 w-4 text-blue-600" />;
      case 'check': return <Receipt className="h-4 w-4 text-orange-600" />;
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'credit_card': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'debit_card': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSort = (field: keyof FinancialAgreement) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card className="border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por cliente, executado, processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="defaulted">Em Atraso</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                  <SelectItem value="renegotiated">Renegociados</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
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
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Acordo
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
            <Filter className="h-4 w-4" />
            <span>Exibindo {filteredAndSortedAgreements.length} de {agreements.length} acordos</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Expandida de Acordos */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('client_entities' as any)}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Partes <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('cases' as any)}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Processo <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('agreement_type')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Tipo <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('total_value')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Valores <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">Parcelas</th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('next_due_date' as any)}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Próximo Venc. <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">
                    <button 
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-slate-900"
                    >
                      Status <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="text-left p-4 font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedAgreements.map((agreement, index) => (
                  <tr 
                    key={agreement.id} 
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}
                      hover:bg-slate-50 transition-colors border-b border-slate-100
                      ${agreement.status === 'defaulted' ? 'bg-red-50/30' : ''}
                    `}
                  >
                    {/* Coluna Partes */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {agreement.client_entities.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {agreement.client_entities.document || 'Cliente'}
                            </p>
                          </div>
                        </div>
                        {agreement.executed_entities && (
                          <div className="flex items-center gap-2 mt-1 pt-1 border-t border-slate-100">
                            <Users className="h-4 w-4 text-orange-600" />
                            <div>
                              <p className="font-medium text-slate-700 text-sm">
                                {agreement.executed_entities.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {agreement.executed_entities.document || 'Executado'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Coluna Processo */}
                    <td className="p-4">
                      <div>
                        <p className="font-mono text-sm text-slate-900">
                          {agreement.cases.case_number || 'S/N'}
                        </p>
                        <p className="text-xs text-slate-600 max-w-32 truncate" title={agreement.cases.title}>
                          {agreement.cases.title}
                        </p>
                        {agreement.cases.court && (
                          <p className="text-xs text-slate-500 mt-1">
                            {agreement.cases.court}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Coluna Tipo */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getAgreementTypeIcon(agreement.agreement_type)}
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {agreement.agreement_type}
                          </p>
                          {agreement.has_court_release && (
                            <div className="flex items-center gap-1 mt-1">
                              <Gavel className="h-3 w-3 text-purple-600" />
                              <span className="text-xs text-purple-600 font-medium">
                                Com Alvará
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Coluna Valores */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div>
                          <span className="text-xs text-slate-500">Total:</span>
                          <p className="font-semibold text-slate-900">
                            R$ {agreement.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {agreement.entry_value > 0 && (
                          <div>
                            <span className="text-xs text-slate-500">Entrada:</span>
                            <p className="text-sm text-green-600 font-medium">
                              R$ {agreement.entry_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {getPaymentMethodIcon(agreement.payment_method)}
                          <span className="text-xs text-slate-500 capitalize">
                            {agreement.payment_method.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Parcelas */}
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-slate-900">
                            {agreement.paid_installments || 0}/{agreement.installments}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          R$ {agreement.installment_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center gap-1">
                          <div className="w-16 bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all" 
                              style={{ width: `${agreement.completion_percentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-500">
                            {Math.round(agreement.completion_percentage || 0)}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Coluna Próximo Vencimento */}
                    <td className="p-4">
                      {agreement.next_due_date ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(agreement.next_due_date).toLocaleDateString('pt-BR')}
                          </p>
                          {agreement.days_overdue > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-red-600 font-medium">
                                {agreement.days_overdue} dias atraso
                              </span>
                            </div>
                          )}
                          {agreement.days_overdue === 0 && (
                            <span className="text-xs text-green-600">Em dia</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>

                    {/* Coluna Status */}
                    <td className="p-4">
                      <div className="space-y-1">
                        {getStatusBadge(agreement.status)}
                        {agreement.renegotiation_count > 0 && (
                          <div className="flex items-center gap-1">
                            <RefreshCw className="h-3 w-3 text-orange-500" />
                            <span className="text-xs text-orange-600">
                              {agreement.renegotiation_count} reneg.
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Coluna Ações */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onViewDetails(agreement)}
                          className="hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onSendMessage(agreement)}
                          className="hover:bg-green-50"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        {agreement.client_entities.phone && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="hover:bg-blue-50"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => onRenegotiate(agreement)}
                          className="hover:bg-orange-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedAgreements.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg">Nenhum acordo encontrado</p>
              <p className="text-slate-400">Ajuste os filtros ou crie um novo acordo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Componente principal exportado (versão simplificada para mostrar a estrutura)
export function EnhancedFinancialModule() {
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
    refetchOnWindowFocus: true,
    retry: 2,
    staleTime: 10000, 
  });
  
  const safeAgreements: FinancialAgreement[] = Array.isArray(agreements) ? agreements : [];
  
  const handleSendMessage = (agreement: FinancialAgreement) => {
    toast({title: "Mensagem!", description: `Mensagem para ${agreement.client_entities.name}`});
  };
  
  const handleViewDetails = (agreement: FinancialAgreement) => {
    toast({title: "Detalhes!", description: `Visualizando acordo #${agreement.id}`});
  };
  
  const handleRenegotiate = (agreement: FinancialAgreement) => {
    toast({title: "Renegociação!", description: `Iniciando renegociação do acordo #${agreement.id}`});
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>
          <p className="text-gray-500">Carregando dados financeiros...</p>
        </div>
      </div>
    );
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-6 text-white overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold mb-2">Módulo Financeiro Avançado</h2>
                <p className="text-slate-100">Controle completo sobre acordos, parcelas, alvarás e pagamentos</p>
            </div>
            <Button onClick={() => refetch()} className="bg-white/10 text-white hover:bg-white/20">
                <RefreshCw className="mr-2 h-4 w-4"/> Atualizar Dados
            </Button>
        </div>
      </div>

      {/* Estatísticas Expandidas */}
      <EnhancedFinancialStats agreements={safeAgreements} />
      
      {/* Abas Principais */}
      <Tabs defaultValue="acordos" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="acordos" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Acordos Detalhados</span>
            <Badge variant="secondary" className="ml-2">{safeAgreements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="alvaras" className="flex items-center space-x-2">
            <Receipt className="h-4 w-4" />
            <span>Alvarás</span>
          </TabsTrigger>
          <TabsTrigger value="atraso" className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>Inadimplência</span>
            <Badge variant="destructive" className="ml-2">
              {safeAgreements.filter(a => a.status === 'defaulted').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Abas */}
        <TabsContent value="acordos">
          <EnhancedAgreementsTab 
            agreements={safeAgreements} 
            onSendMessage={handleSendMessage}
            onViewDetails={handleViewDetails}
            onRenegotiate={handleRenegotiate}
          />
        </TabsContent>

        <TabsContent value="alvaras">
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">Módulo de Alvarás em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atraso">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-slate-500">Módulo de Inadimplência em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios">
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <p className="text-slate-500">Relatórios Financeiros em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}