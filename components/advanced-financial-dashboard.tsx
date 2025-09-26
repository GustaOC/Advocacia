// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/advanced-financial-dashboard.tsx

'use client'

import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, DollarSign, Handshake, CheckCircle, TrendingUp, TrendingDown, Percent } from 'lucide-react'

// Mock de hook e dados
const useGetFinancialDashboardStats = (period = '30d') => {
  // A 'period' seria usada para buscar dados filtrados na API
  const mockData = {
    total_agreements: 152,
    active_agreements: 120,
    total_value: 750000.00,
    paid_amount: 450000.00,
    overdue_amount: 85000.00,
    success_rate: 85.5,
    monthly_trend: [
        { month: 'Jan', received: 65000, created: 15 },
        { month: 'Fev', received: 58000, created: 12 },
        { month: 'Mar', received: 72000, created: 18 },
        { month: 'Abr', received: 68000, created: 16 },
    ]
  }
  return { data: mockData, isLoading: false, isError: false }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const StatCard = ({ title, value, icon: Icon, description, colorClass, isLoading }: any) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium"><Skeleton className="h-5 w-32"/></CardTitle>
                    <Skeleton className="h-6 w-6"/>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-40 mb-1"/>
                    <Skeleton className="h-4 w-full"/>
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={`h-5 w-5 ${colorClass || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    )
}

export function AdvancedFinancialDashboard() {
  const { data, isLoading, isError } = useGetFinancialDashboardStats('30d')

  if (isError) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
            <CardHeader><CardTitle>Erro</CardTitle></CardHeader>
            <CardContent><p>Não foi possível carregar os dados do dashboard.</p></CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">Visão geral da performance dos acordos.</p>
        </div>
        <Select defaultValue="30d">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="6m">Últimos 6 meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard isLoading={isLoading} title="Total em Acordos" value={formatCurrency(data?.total_value || 0)} icon={Handshake} description={`${data?.total_agreements || 0} acordos no total`} colorClass="text-blue-500" />
        <StatCard isLoading={isLoading} title="Total Recebido" value={formatCurrency(data?.paid_amount || 0)} icon={CheckCircle} description="Soma de todas as parcelas pagas" colorClass="text-green-500" />
        <StatCard isLoading={isLoading} title="Inadimplência" value={formatCurrency(data?.overdue_amount || 0)} icon={TrendingDown} description="Valor total em atraso" colorClass="text-red-500" />
        <StatCard isLoading={isLoading} title="Taxa de Sucesso" value={`${data?.success_rate || 0}%`} icon={Percent} description="Dos acordos concluídos com êxito" colorClass="text-emerald-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
          <CardDescription>Recebimentos vs. Novos Acordos nos últimos meses.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <Skeleton className="w-full h-[350px]" />
            ) : (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data?.monthly_trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `R$${(Number(value) / 1000)}k`} />
                    <Tooltip formatter={(value, name) => (name === "Recebido" ? formatCurrency(Number(value)) : value)} />
                    <Legend />
                    <Bar dataKey="received" name="Recebido" fill="#22c55e" />
                    <Bar dataKey="created" name="Novos Acordos" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </CardContent>
      </Card>
    </div>
  )
}