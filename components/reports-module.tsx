// components/reports-module.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Users, DollarSign, Clock, AlertTriangle } from 'lucide-react';

// Tipos para os dados e props
interface ChartData { name: string; value: number; }
interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  colorClass: string;
}
interface ReportsModuleProps {
  onNavigate: (tab: string, filters?: any) => void;
}

const casesData: ChartData[] = [
  { name: 'Jan', value: 12 }, { name: 'Fev', value: 19 }, { name: 'Mar', value: 3 },
  { name: 'Abr', value: 5 }, { name: 'Mai', value: 2 }, { name: 'Jun', value: 3 },
];

const financialData: ChartData[] = [
  { name: 'Jan', value: 24000 }, { name: 'Fev', value: 13980 }, { name: 'Mar', value: 98000 },
  { name: 'Abr', value: 39080 }, { name: 'Mai', value: 48000 }, { name: 'Jun', value: 38000 },
];

// Componente de Card de KPI reutilizável e clicável
const KpiCard: React.FC<KpiCardProps> = ({ title, value, description, icon: Icon, onClick, colorClass }) => (
  <Card 
    onClick={onClick}
    className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
  >
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
        <Icon className="h-4 w-4 mr-2" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </CardContent>
  </Card>
);

export function ReportsModule({ onNavigate }: ReportsModuleProps) {
  const [period, setPeriod] = useState<'month' | 'week' | 'year'>('month');

  // A lógica de dados aqui seria dinâmica com base no filtro 'period'
  const kpiData = {
    clients: { value: '248', description: '+12% este mês' },
    activeCases: { value: '89', description: '+5 esta semana' },
    revenue: { value: 'R$ 45.2k', description: '+8% vs mês anterior' },
    upcomingDeadlines: { value: '7', description: 'Próximos 7 dias' },
  };

  return (
    <div className="space-y-8">
      {/* Filtros de Período */}
      <div className="flex justify-end space-x-2">
        <Button variant={period === 'week' ? 'default' : 'outline'} onClick={() => setPeriod('week')}>Esta Semana</Button>
        <Button variant={period === 'month' ? 'default' : 'outline'} onClick={() => setPeriod('month')}>Este Mês</Button>
        <Button variant={period === 'year' ? 'default' : 'outline'} onClick={() => setPeriod('year')}>Este Ano</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Clientes Ativos"
          value={kpiData.clients.value}
          description={kpiData.clients.description}
          icon={Users}
          colorClass="text-slate-900"
          onClick={() => onNavigate('entities')}
        />
        <KpiCard
          title="Processos em Andamento"
          value={kpiData.activeCases.value}
          description={kpiData.activeCases.description}
          icon={Briefcase}
          colorClass="text-slate-900"
          onClick={() => onNavigate('cases', { cases: { status: 'Em andamento' } })}
        />
        <KpiCard
          title="Receita no Período"
          value={kpiData.revenue.value}
          description={kpiData.revenue.description}
          icon={DollarSign}
          colorClass="text-green-600"
          onClick={() => onNavigate('financial')}
        />
        <KpiCard
          title="Prazos Urgentes"
          value={kpiData.upcomingDeadlines.value}
          description={kpiData.upcomingDeadlines.description}
          icon={AlertTriangle}
          colorClass="text-red-600"
          onClick={() => onNavigate('petitions')} // Futuramente, filtrar por prazos
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5"/> Novos Processos por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={casesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Novos Processos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5"/> Receita Mensal</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                    <Legend />
                    <Bar dataKey="value" fill="#16a34a" name="Receita" />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}