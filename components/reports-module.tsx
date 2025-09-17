// components/reports-module.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Users, DollarSign, Clock } from 'lucide-react';

const casesData = [
  { name: 'Jan', value: 12 },
  { name: 'Fev', value: 19 },
  { name: 'Mar', value: 3 },
  { name: 'Abr', value: 5 },
  { name: 'Mai', value: 2 },
  { name: 'Jun', value: 3 },
];

const financialData = [
    { name: 'Jan', value: 24000 },
    { name: 'Fev', value: 13980 },
    { name: 'Mar', value: 98000 },
    { name: 'Abr', value: 39080 },
    { name: 'Mai', value: 48000 },
    { name: 'Jun', value: 38000 },
];

export function ReportsModule() {
  return (
    <div className="space-y-8">
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Cards de Estatísticas */}
              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">248</div>
                  <p className="text-xs text-slate-500 mt-1">+12% este mês</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Processos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">89</div>
                  <p className="text-xs text-slate-500 mt-1">+5% esta semana</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Receita Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">R$ 45.2k</div>
                  <p className="text-xs text-slate-500 mt-1">+8% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Prazos Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">7</div>
                  <p className="text-xs text-slate-500 mt-1">Próximos 7 dias</p>
                </CardContent>
              </Card>
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