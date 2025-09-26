// components/advanced-financial-dashboard.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, TrendingUp, TrendingDown, Users, AlertTriangle, 
  CheckCircle, Clock, Target, Percent, Calendar, Receipt,
  BarChart3, PieChart, Activity, Zap, ArrowUpRight, ArrowDownRight,
  Filter, Download, RefreshCw, Eye, CreditCard, Building,
  Gavel, FileText, MessageSquare, Phone, Star, Award,
  LineChart, AlertCircle, Info, Loader2
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";

// Dados mockados para demonstração (substituir por dados reais da API)
const mockDashboardData = {
  summary: {
    total_agreements: 156,
    active_agreements: 89,
    completed_agreements: 52,
    total_value: 2450000,
    paid_amount: 1680000,
    overdue_amount: 340000,
    this_month_payments: 89500,
    pending_installments: 245,
    success_rate: 85.6,
    average_agreement_value: 15705
  },
  monthly_trend: [
    { month: 'Jan', agreements_created: 12, total_payments: 145000, revenue: 125000 },
    { month: 'Fev', agreements_created: 18, total_payments: 189000, revenue: 167000 },
    { month: 'Mar', agreements_created: 15, total_payments: 198000, revenue: 178000 },
    { month: 'Abr', agreements_created: 22, total_payments: 234000, revenue: 210000 },
    { month: 'Mai', agreements_created: 19, total_payments: 267000, revenue: 245000 },
    { month: 'Jun', agreements_created: 25, total_payments: 289000, revenue: 267000 },
  ],
  agreements_by_status: [
    { name: 'Ativos', value: 89, color: '#3B82F6' },
    { name: 'Concluídos', value: 52, color: '#10B981' },
    { name: 'Em Atraso', value: 12, color: '#EF4444' },
    { name: 'Cancelados', value: 3, color: '#6B7280' },
  ],
  top_clients: [
    { name: 'Maria Silva Santos', agreements_count: 4, total_value: 89500, payment_rate: 95.2, risk_level: 'low' },
    { name: 'João Pedro Oliveira', agreements_count: 3, total_value: 67800, payment_rate: 87.5, risk_level: 'medium' },
    { name: 'Ana Carolina Costa', agreements_count: 2, total_value: 54300, payment_rate: 92.1, risk_level: 'low' },
    { name: 'Roberto Almeida', agreements_count: 3, total_value: 45600, payment_rate: 78.4, risk_level: 'high' },
    { name: 'Fernanda Lima', agreements_count: 2, total_value: 38900, payment_rate: 100.0, risk_level: 'low' },
  ],
  upcoming_dues: [
    { client_name: 'Carlos Souza', case_number: '001/2024', due_date: '2025-09-30', amount: 2500, days_until_due: 5 },
    { client_name: 'Luiza Mendes', case_number: '045/2024', due_date: '2025-10-02', amount: 1800, days_until_due: 7 },
    { client_name: 'Ricardo Santos', case_number: '032/2024', due_date: '2025-10-05', amount: 3200, days_until_due: 10 },
    { client_name: 'Patricia Costa', case_number: '078/2024', due_date: '2025-10-08', amount: 1500, days_until_due: 13 },
  ],
  overdue_analysis: {
    overdue_count: 12,
    total_overdue_value: 340000,
    average_days_overdue: 45,
    high_risk_clients: 4,
    recovery_rate: 68.5
  }
};

interface AdvancedFinancialDashboardProps {
  onNavigateToAgreements?: () => void;
  onNavigateToOverdue?: () => void;
}

export function AdvancedFinancialDashboard({ 
  onNavigateToAgreements, 
  onNavigateToOverdue 
}: AdvancedFinancialDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  // Query para buscar dados do dashboard
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['financialDashboardStats'],
    queryFn: () => apiClient.getFinancialDashboardStats(),
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    staleTime: 10000,
  });

  // Query para próximos vencimentos
  const { data: upcomingDues, isLoading: isLoadingDues } = useQuery({
    queryKey: ['upcomingDueDates'],
    queryFn: () => apiClient.getUpcomingDueDates(7),
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  // Query para métricas de performance
  const { data: performanceMetrics, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['financialPerformanceMetrics', selectedPeriod],
    queryFn: () => apiClient.getFinancialPerformanceMetrics(selectedPeriod as any),
  });

  // Usar dados mock se não tiver dados da API ainda
  const stats = dashboardStats || mockDashboardData.summary;
  const upcoming = upcomingDues || mockDashboardData.upcoming_dues;
  
  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Componente de KPI Card
  const KpiCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    trendDirection, 
    color = "blue",
    onClick 
  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    trend?: string;
    trendDirection?: 'up' | 'down';
    color?: string;
    onClick?: () => void;
  }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      gray: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
    };

    const colorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
      <Card 
        className={`cursor-pointer hover:shadow-lg transition-all duration-300 border-0 ${colorClass.border} ${colorClass.bg}/50`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-slate-600">{title}</p>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{subtitle}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trendDirection === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trend}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colorClass.bg}`}>
              <Icon className={`w-6 h-6 ${colorClass.text}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoadingStats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Financeiro</h1>
          <p className="text-slate-600">Visão completa da performance financeira do escritório</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <KpiCard
          title="Acordos Ativos"
          value={stats.active_agreements.toString()}
          subtitle={`${stats.total_agreements} total`}
          icon={FileText}
          trend="+12%"
          trendDirection="up"
          color="blue"
          onClick={onNavigateToAgreements}
        />
        <KpiCard
          title="Valor Total"
          value={formatCurrency(stats.total_value)}
          subtitle="Em acordos ativos"
          icon={DollarSign}
          trend="+8.5%"
          trendDirection="up"
          color="green"
        />
        <KpiCard
          title="Recebido"
          value={formatCurrency(stats.paid_amount)}
          subtitle={formatPercentage((stats.paid_amount / stats.total_value) * 100) + " do total"}
          icon={CheckCircle}
          trend="+15%"
          trendDirection="up"
          color="green"
        />
        <KpiCard
          title="Em Atraso"
          value={formatCurrency(stats.overdue_amount)}
          subtitle={mockDashboardData.overdue_analysis.overdue_count + " acordos"}
          icon={AlertTriangle}
          trend="-5%"
          trendDirection="down"
          color="red"
          onClick={onNavigateToOverdue}
        />
        <KpiCard
          title="Taxa de Sucesso"
          value={formatPercentage(stats.success_rate)}
          subtitle="Acordos concluídos"
          icon={Target}
          trend="+2.3%"
          trendDirection="up"
          color="purple"
        />
        <KpiCard
          title="Este Mês"
          value={formatCurrency(stats.this_month_payments)}
          subtitle="Pagamentos recebidos"
          icon={TrendingUp}
          trend="+18%"
          trendDirection="up"
          color="orange"
        />
      </div>

      {/* Tabs para diferentes visões */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Tendência Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Tendência de Pagamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockDashboardData.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="total_payments" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.6}
                      name="Pagamentos"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.6}
                      name="Receita Líquida"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição por Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição de Acordos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      dataKey="value"
                      data={mockDashboardData.agreements_by_status}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {mockDashboardData.agreements_by_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Próximos Vencimentos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                Próximos Vencimentos
              </CardTitle>
              <Badge variant="outline" className="font-semibold">
                {upcoming.length} parcelas
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Cliente</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Processo</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Vencimento</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Valor</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Urgência</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((due, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{due.client_name}</div>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-slate-600">{due.case_number}</span>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">
                            {new Date(due.due_date).toLocaleDateString('pt-BR')}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(due.amount)}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={due.days_until_due <= 3 ? 'destructive' : due.days_until_due <= 7 ? 'default' : 'secondary'}
                            className="font-medium"
                          >
                            {due.days_until_due} dias
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Phone className="h-4 w-4" />
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
        </TabsContent>

        {/* Aba Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Métricas de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Taxa de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {formatPercentage(performanceMetrics?.payment_rate || 85.6)}
                  </div>
                  <p className="text-sm text-slate-600">dos acordos são pagos pontualmente</p>
                </div>
                <Progress value={performanceMetrics?.payment_rate || 85.6} className="h-2" />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Taxa de Inadimplência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600">
                    {formatPercentage(performanceMetrics?.default_rate || 14.4)}
                  </div>
                  <p className="text-sm text-slate-600">dos acordos estão em atraso</p>
                </div>
                <Progress value={performanceMetrics?.default_rate || 14.4} className="h-2" />
                <div className="text-xs text-slate-500 text-center">
                  Meta: &lt; 10%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Tempo Médio de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600">
                    {Math.round(performanceMetrics?.average_payment_time || 12)}
                  </div>
                  <p className="text-sm text-slate-600">dias após o vencimento</p>
                </div>
                <div className="text-xs text-slate-500 text-center">
                  Meta: &lt; 15 dias
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Tendência de Recovery */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendência de Recuperação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceMetrics?.monthly_recovery_trend || mockDashboardData.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Recuperado']} />
                  <Legend />
                  <Bar dataKey="recovered_amount" fill="#10B981" name="Valor Recuperado" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Clientes */}
        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Top Clientes por Valor
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
                      <th className="text-left p-4 font-semibold text-slate-700">Risco</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDashboardData.top_clients.map((client, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {client.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{client.name}</div>
                              {index < 3 && (
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-yellow-600">Top Cliente</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="font-medium">
                            {client.agreements_count} acordos
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-green-600">
                            {formatCurrency(client.total_value)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all"
                                style={{ width: `${client.payment_rate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {formatPercentage(client.payment_rate)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={
                              client.risk_level === 'low' ? 'secondary' :
                              client.risk_level === 'medium' ? 'default' : 'destructive'
                            }
                            className="capitalize font-medium"
                          >
                            {client.risk_level === 'low' ? 'Baixo' :
                             client.risk_level === 'medium' ? 'Médio' : 'Alto'}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MessageSquare className="h-4 w-4" />
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
        </TabsContent>

        {/* Aba Alertas */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas Críticos */}
            <Card className="border-red-200">
              <CardHeader className="bg-red-50">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Críticos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">
                      {mockDashboardData.overdue_analysis.high_risk_clients} clientes em situação crítica
                    </p>
                    <p className="text-sm text-red-700">
                      Mais de 90 dias em atraso, necessária ação imediata
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-orange-900">
                      {upcoming.filter(u => u.days_until_due <= 3).length} vencimentos em 3 dias
                    </p>
                    <p className="text-sm text-orange-700">
                      Enviar lembretes urgentes
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900">
                      Taxa de inadimplência acima da meta
                    </p>
                    <p className="text-sm text-yellow-700">
                      Revisar estratégias de cobrança
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Oportunidades */}
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="h-5 w-5" />
                  Oportunidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">
                      {mockDashboardData.top_clients.filter(c => c.payment_rate > 90).length} clientes com pagamento excelente
                    </p>
                    <p className="text-sm text-green-700">
                      Potencial para novos acordos
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      Taxa de recuperação de {formatPercentage(mockDashboardData.overdue_analysis.recovery_rate)}
                    </p>
                    <p className="text-sm text-blue-700">
                      Acima da média do setor
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <Award className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-purple-900">
                      Receita mensal crescendo {stats.this_month_payments > 80000 ? '+18%' : '+12%'}
                    </p>
                    <p className="text-sm text-purple-700">
                      Tendência positiva mantida
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}