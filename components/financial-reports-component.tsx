// components/financial-reports-component.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, Download, FileText, Calendar, Filter, TrendingUp,
  DollarSign, Users, Target, AlertTriangle, CheckCircle, Clock,
  PieChart, Activity, Printer, Mail, RefreshCw, Eye, Settings,
  ArrowUpRight, ArrowDownRight, Percent, Building, CreditCard,
  Receipt, FileBarChart, Table, LineChart, Loader2
} from "lucide-react";
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart,
  Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

// Interfaces para tipagem dos dados
interface ReportSummary {
  total_agreements: number;
  total_value: number;
  paid_amount: number;
  overdue_amount: number;
  completion_rate: number;
}

interface AgreementByStatus {
  status: string;
  count: number;
  total_value: number;
  percentage: number;
}

interface MonthlyPayment {
  month: string;
  payments_count: number;
  total_paid: number;
}

interface AgreementType {
    type: string;
    count: number;
    value: number;
    avg_value: number;
}

interface ClientPerformance {
    client_name: string;
    agreements_count: number;
    total_value: number;
    payment_rate: number;
    avg_delay: number;
}

interface OverdueAnalysis {
    total_overdue: number;
    overdue_count: number;
    average_days_overdue: number;
    recovery_rate: number;
    high_risk_count: number;
}

interface ReportData {
  summary: ReportSummary;
  agreements_by_status: AgreementByStatus[];
  monthly_payments: MonthlyPayment[];
  agreement_types: AgreementType[];
  client_performance: ClientPerformance[];
  overdue_analysis: OverdueAnalysis;
}

interface ReportFilters {
  startDate: string | undefined;
  endDate: string | undefined;
  reportType: 'general' | 'agreements' | 'payments' | 'overdue' | 'clients';
  clientIds?: number[];
  status?: string[];
  agreementTypes?: string[];
  includeCharts: boolean;
  includeTables: boolean;
  includeClientAnalysis: boolean;
}

interface FinancialReportsComponentProps {
  onNavigateToAgreement?: (agreementId: number) => void;
}

export function FinancialReportsComponent({ onNavigateToAgreement }: FinancialReportsComponentProps) {
  const { toast } = useToast();

  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reportType: 'general',
    includeCharts: true,
    includeTables: true,
    includeClientAnalysis: false,
  });

  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Query para buscar dados do relatório
  const { data: reportData, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ['financialReports', filters.startDate, filters.endDate, filters.reportType],
    queryFn: () => apiClient.getFinancialReports(filters.startDate!, filters.endDate!, filters.reportType),
    enabled: !!filters.startDate && !!filters.endDate,
  });

  // Query para buscar lista de clientes para filtros
  const { data: clients } = useQuery({
    queryKey: ['entities'],
    queryFn: () => apiClient.getEntities(),
  });

  // Dados mock para demonstração
  const mockReportData = useMemo((): ReportData => ({
    summary: {
      total_agreements: 156,
      total_value: 2450000,
      paid_amount: 1680000,
      overdue_amount: 340000,
      completion_rate: 68.6,
    },
    agreements_by_status: [
      { status: 'Ativos', count: 89, total_value: 1420000, percentage: 57.1 },
      { status: 'Concluídos', count: 52, total_value: 780000, percentage: 31.8 },
      { status: 'Em Atraso', count: 12, total_value: 180000, percentage: 7.7 },
      { status: 'Cancelados', count: 3, total_value: 70000, percentage: 2.9 },
    ],
    monthly_payments: [
      { month: '2024-07', payments_count: 45, total_paid: 189000 },
      { month: '2024-08', payments_count: 67, total_paid: 234000 },
      { month: '2024-09', payments_count: 89, total_paid: 289000 },
      { month: '2024-10', payments_count: 72, total_paid: 198000 },
      { month: '2024-11', payments_count: 54, total_paid: 167000 },
      { month: '2024-12', payments_count: 38, total_paid: 145000 },
    ],
    agreement_types: [
      { type: 'Judicial', count: 78, value: 1240000, avg_value: 15897 },
      { type: 'Extrajudicial', count: 45, value: 780000, avg_value: 17333 },
      { type: 'Em Audiência', count: 23, value: 320000, avg_value: 13913 },
      { type: 'Pela Loja', count: 10, value: 110000, avg_value: 11000 },
    ],
    client_performance: [
      { client_name: 'Maria Silva Santos', agreements_count: 4, total_value: 89500, payment_rate: 95.2, avg_delay: 2.1 },
      { client_name: 'João Pedro Oliveira', agreements_count: 3, total_value: 67800, payment_rate: 87.5, avg_delay: 8.3 },
      { client_name: 'Ana Carolina Costa', agreements_count: 2, total_value: 54300, payment_rate: 92.1, avg_delay: 4.5 },
      { client_name: 'Roberto Almeida', agreements_count: 3, total_value: 45600, payment_rate: 78.4, avg_delay: 15.2 },
      { client_name: 'Fernanda Lima', agreements_count: 2, total_value: 38900, payment_rate: 100.0, avg_delay: 0 },
    ],
    overdue_analysis: {
      total_overdue: 340000,
      overdue_count: 12,
      average_days_overdue: 45,
      recovery_rate: 68.5,
      high_risk_count: 4,
    }
  }), []);

  const data = reportData || mockReportData;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatMonth = (monthString: string | undefined) => {
    if (!monthString) return '';
    const parts = monthString.split('-');
    if (parts.length !== 2) return monthString; 
    
    const [year, month] = parts;
    if (!year || !month) return monthString;
    
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthIndex = parseInt(month) - 1;
    
    if (monthIndex < 0 || monthIndex >= months.length) return monthString;
    
    return `${months[monthIndex]}/${year}`;
  };

  const bestMonth = useMemo(() => {
    if (!data.monthly_payments || data.monthly_payments.length === 0) return null;
    return data.monthly_payments.reduce((max, m) => m.total_paid > max.total_paid ? m : max);
  }, [data.monthly_payments]);

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    refetch();
  };

  const handleExportReport = async (format: 'excel' | 'pdf' | 'csv') => {
    setIsGenerating(true);
    try {
      if (!filters.startDate || !filters.endDate) {
        throw new Error("As datas de início e fim são obrigatórias para exportar.");
      }
      
      if (format === 'excel' || format === 'csv') {
        const blob = await apiClient.exportFinancialAgreements(format, {
          startDate: filters.startDate,
          endDate: filters.endDate,
          status: filters.status?.[0],
          // ✅ CORREÇÃO APLICADA AQUI
          clientId: selectedClients.length > 0 ? String(selectedClients[0]) : undefined,
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({ title: "Sucesso!", description: `Relatório exportado em ${format.toUpperCase()}` });
      } else {
        toast({ title: "Em desenvolvimento", description: "Exportação em PDF será implementada em breve" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Falha ao exportar relatório", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <FileBarChart className="h-8 w-8 text-blue-600" />
            Relatórios Financeiros
          </h1>
          <p className="text-slate-600 mt-1">Análise detalhada da performance financeira do escritório</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => handleExportReport('excel')} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-purple-600" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <Select value={filters.reportType} onValueChange={(value) => handleFilterChange('reportType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Geral</SelectItem>
                  <SelectItem value="agreements">Acordos</SelectItem>
                  <SelectItem value="payments">Pagamentos</SelectItem>
                  <SelectItem value="overdue">Inadimplência</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ações</Label>
              <Button onClick={handleGenerateReport} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Gerar Relatório
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800">Opções de Conteúdo</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={filters.includeCharts}
                  onCheckedChange={(checked) => handleFilterChange('includeCharts', checked)}
                />
                <Label htmlFor="includeCharts" className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Incluir Gráficos
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeTables"
                  checked={filters.includeTables}
                  onCheckedChange={(checked) => handleFilterChange('includeTables', checked)}
                />
                <Label htmlFor="includeTables" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Incluir Tabelas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeClientAnalysis"
                  checked={filters.includeClientAnalysis}
                  onCheckedChange={(checked) => handleFilterChange('includeClientAnalysis', checked)}
                />
                <Label htmlFor="includeClientAnalysis" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Análise de Clientes
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Resumo Executivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total de Acordos</p>
              <p className="text-2xl font-bold text-blue-800">{data.summary.total_agreements}</p>
              <p className="text-xs text-blue-600 mt-1">no período</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(data.summary.total_value)}</p>
              <p className="text-xs text-green-600 mt-1">em acordos</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <p className="text-sm text-emerald-600 font-medium">Valor Recebido</p>
              <p className="text-2xl font-bold text-emerald-800">{formatCurrency(data.summary.paid_amount)}</p>
              <p className="text-xs text-emerald-600 mt-1">{formatPercentage((data.summary.paid_amount / data.summary.total_value) * 100)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Em Atraso</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(data.summary.overdue_amount)}</p>
              <p className="text-xs text-red-600 mt-1">{formatPercentage((data.summary.overdue_amount / data.summary.total_value) * 100)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Taxa de Sucesso</p>
              <p className="text-2xl font-bold text-purple-800">{formatPercentage(data.summary.completion_rate)}</p>
              <p className="text-xs text-purple-600 mt-1">dos acordos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo Principal por Abas */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="status">Por Status</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="overdue">Inadimplência</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Status dos Acordos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={data.agreements_by_status}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="count"
                      label={({ status, percentage }: AgreementByStatus) => `${status}: ${percentage}%`}
                    >
                      {data.agreements_by_status.map((_, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [value, 'Acordos']} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Tipos de Acordo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Acordos por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.agreement_types}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Valor']} />
                    <Legend />
                    <Bar dataKey="value" fill="#10B981" name="Valor Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Tipos de Acordo */}
          {filters.includeTables && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  Detalhamento por Tipo de Acordo
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Tipo de Acordo</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Quantidade</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Valor Total</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Valor Médio</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Participação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.agreement_types.map((type: AgreementType, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                              <span className="font-medium text-slate-900">{type.type}</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold">{type.count}</td>
                          <td className="p-4 font-semibold text-green-600">{formatCurrency(type.value)}</td>
                          <td className="p-4 font-semibold">{formatCurrency(type.avg_value)}</td>
                          <td className="p-4">
                            <Badge variant="outline" className="font-medium">
                              {formatPercentage((type.value / data.summary.total_value) * 100)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Tendências */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                Evolução Mensal dos Pagamentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={data.monthly_payments}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={(value: string | undefined) => formatMonth(value)} />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value: string) => `Mês: ${formatMonth(value)}`}
                    formatter={(value: number, name: string) => [
                      name === 'total_paid' ? formatCurrency(value) : value,
                      name === 'total_paid' ? 'Valor Pago' : 'Qtd Pagamentos'
                    ]}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total_paid"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    name="Valor Pago"
                  />
                  <Area
                    type="monotone"
                    dataKey="payments_count"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.6}
                    name="Qtd Pagamentos"
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Crescimento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Valor Médio Mensal</span>
                    <span className="font-semibold text-lg">
                      {formatCurrency(data.monthly_payments.reduce((sum: number, m: MonthlyPayment) => sum + m.total_paid, 0) / data.monthly_payments.length)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Melhor Mês</span>
                    <span className="font-semibold text-green-600">
                      {bestMonth ? formatMonth(bestMonth.month) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Tendência</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="font-semibold text-green-600">+15.2%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sazonalidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Mês com Mais Acordos</span>
                    <span className="font-semibold">Setembro</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Período de Baixa</span>
                    <span className="font-semibold">Dezembro - Janeiro</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Variação Sazonal</span>
                    <span className="font-semibold text-orange-600">±23%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Previsões</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Próximo Mês</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(195000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Trimestre</span>
                    <span className="font-semibold text-purple-600">{formatCurrency(580000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Confiança</span>
                    <Badge variant="outline" className="font-medium text-green-600">87%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Status */}
        <TabsContent value="status" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.agreements_by_status.map((status: AgreementByStatus, index: number) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{status.status}</span>
                    <Badge variant="outline" className="font-semibold">
                      {status.count} acordos
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Valor Total</span>
                      <span className="font-semibold text-xl">{formatCurrency(status.total_value)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Participação</span>
                      <span className="font-semibold">{formatPercentage(status.percentage)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Valor Médio</span>
                      <span className="font-semibold">{formatCurrency(status.total_value / status.count)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${status.percentage}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Clientes */}
        <TabsContent value="clients" className="space-y-6">
          {filters.includeClientAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Performance dos Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-semibold text-slate-700">Cliente</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Acordos</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Valor Total</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Taxa de Pagamento</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Atraso Médio</th>
                        <th className="text-left p-4 font-semibold text-slate-700">Classificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.client_performance.map((client: ClientPerformance, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-xs">
                                  {client.client_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </span>
                              </div>
                              <span className="font-medium text-slate-900">{client.client_name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold">{client.agreements_count}</td>
                          <td className="p-4 font-semibold text-green-600">{formatCurrency(client.total_value)}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 w-16">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all"
                                  style={{ width: `${client.payment_rate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{formatPercentage(client.payment_rate)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`font-semibold ${client.avg_delay > 10 ? 'text-red-600' : client.avg_delay > 5 ? 'text-orange-600' : 'text-green-600'}`}>
                              {client.avg_delay.toFixed(1)} dias
                            </span>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                client.payment_rate >= 95 ? 'default' :
                                  client.payment_rate >= 85 ? 'secondary' : 'destructive'
                              }
                              className="font-medium"
                            >
                              {client.payment_rate >= 95 ? 'Excelente' :
                                client.payment_rate >= 85 ? 'Bom' : 'Atenção'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Inadimplência */}
        <TabsContent value="overdue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="text-lg text-red-800">Valor em Atraso</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(data.overdue_analysis.total_overdue)}
                </div>
                <p className="text-sm text-red-700 mt-1">
                  {data.overdue_analysis.overdue_count} acordos
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200">
              <CardHeader className="bg-orange-50">
                <CardTitle className="text-lg text-orange-800">Atraso Médio</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-orange-600">
                  {data.overdue_analysis.average_days_overdue}
                </div>
                <p className="text-sm text-orange-700 mt-1">dias em atraso</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200">
              <CardHeader className="bg-yellow-50">
                <CardTitle className="text-lg text-yellow-800">Taxa de Recuperação</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-yellow-600">
                  {formatPercentage(data.overdue_analysis.recovery_rate)}
                </div>
                <p className="text-sm text-yellow-700 mt-1">recuperado</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-lg text-purple-800">Alto Risco</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-purple-600">
                  {data.overdue_analysis.high_risk_count}
                </div>
                <p className="text-sm text-purple-700 mt-1">clientes críticos</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Ações de Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            Exportar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => handleExportReport('excel')} disabled={isGenerating}>
              <FileText className="h-4 w-4 mr-2" />
              Excel (.xlsx)
            </Button>
            <Button onClick={() => handleExportReport('csv')} disabled={isGenerating} variant="outline">
              <Table className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => handleExportReport('pdf')} disabled={isGenerating} variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" disabled>
              <Mail className="h-4 w-4 mr-2" />
              Enviar por Email
            </Button>
            <Button variant="outline" disabled>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}