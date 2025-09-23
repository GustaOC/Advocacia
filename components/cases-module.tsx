// components/cases-module.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Filter, Upload, FileUp, AlertTriangle, Clock, LayoutGrid, List, DollarSign, Archive, Star, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// [Manter todas as interfaces e lógica existente...]
interface Entity { id: number; name: string; }
interface Case {
  id: number;
  case_number: string | null;
  title: string;
  main_status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago';
  status_reason: string | null;
  value: number | null;
  court: string | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  description?: string | null;
  case_parties: { role: string; entities: Entity }[];
  client_entity_id?: number;
  executed_entity_id?: number;
  payment_date?: string | null;
  final_value?: number | null;
}

interface CasesModuleProps { initialFilters?: { status: string }; }

// Componente de estatísticas moderno
function CasesStats({ cases }: { cases: Case[] }) {
  const stats = [
    { 
      label: "Total de Casos", 
      value: cases.length.toString(), 
      icon: Briefcase, 
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "+5%"
    },
    { 
      label: "Em Andamento", 
      value: cases.filter(c => c.main_status === 'Em andamento').length.toString(), 
      icon: Clock, 
      color: "text-orange-600",
      bg: "bg-orange-50",
      trend: "+2%"
    },
    { 
      label: "Acordos", 
      value: cases.filter(c => c.main_status === 'Acordo').length.toString(), 
      icon: Star, 
      color: "text-green-600",
      bg: "bg-green-50",
      trend: "+12%"
    },
    { 
      label: "Alta Prioridade", 
      value: cases.filter(c => c.priority === 'Alta').length.toString(), 
      icon: AlertTriangle, 
      color: "text-red-600",
      bg: "bg-red-50",
      trend: "-3%"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
          {/* Background decorativo */}
          <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-full transform translate-x-8 -translate-y-8 opacity-20 group-hover:opacity-30 transition-opacity`}></div>
          
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
              <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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

  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => apiClient.getCases(),
  });
  
  const cases: Case[] = data?.cases ?? [];

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter(c => {
      const searchMatch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === "all" || c.main_status === filterStatus;
      const priorityMatch = filterPriority === "all" || c.priority === filterPriority;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [cases, searchTerm, filterStatus, filterPriority]);

  const getStatusBadge = (status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago') => {
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
      {/* Header Moderno com Gradiente */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden">
        {/* Pattern de fundo */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Gestão de Casos e Processos</h2>
          <p className="text-slate-300 text-xl">Administre todos os casos do escritório de forma centralizada e eficiente.</p>
        </div>
      </div>

      {/* Estatísticas */}
      <CasesStats cases={cases} />

      {/* Controles de Filtro Modernos */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input 
                  placeholder="Buscar por título ou número..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="pl-12 bg-white/80 border-2 border-slate-200 focus:border-slate-400"
                />
              </div>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px] bg-white/80 border-2 border-slate-200">
                  <SelectValue placeholder="Status Principal" />
                </SelectTrigger>
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
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className="rounded-lg"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')}
                  className="rounded-lg"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              
              <Button variant="outline" className="border-2 border-slate-200 hover:border-slate-400">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              
              <Button className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> 
                Novo Caso
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Moderna */}
      {viewMode === 'list' && (
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-slate-700 font-bold">Processo / Título</TableHead>
                  <TableHead className="text-slate-700 font-bold">Prioridade</TableHead>
                  <TableHead className="text-slate-700 font-bold">Status</TableHead>
                  <TableHead className="text-slate-700 font-bold">Partes</TableHead>
                  <TableHead className="text-right text-slate-700 font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map(caseItem => (
                  <TableRow key={caseItem.id} className="group hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                          {caseItem.title}
                        </div>
                        <div className="text-sm text-slate-500 font-mono">
                          {caseItem.case_number || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start space-y-1">
                        {getStatusBadge(caseItem.main_status)}
                        {caseItem.status_reason && (
                          <span className="text-xs text-slate-500 mt-1">{caseItem.status_reason}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600">
                        {caseItem.case_parties.map(p => p.entities.name).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:scale-110 transition-all">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="hover:bg-slate-100 hover:scale-110 transition-all">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Kanban View Moderno */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['Em andamento', 'Acordo', 'Extinto', 'Pago'] as const).map(status => (
            <div key={status} className="space-y-4">
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-lg">{status}</h3>
                  <Badge variant="secondary" className="bg-white text-slate-700 font-semibold">
                    {filteredCases.filter(c => c.main_status === status).length}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-4 min-h-[400px]">
                {filteredCases
                  .filter(c => c.main_status === status)
                  .map(caseItem => (
                    <Card key={caseItem.id} className="cursor-move group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <p className="font-semibold text-slate-900 line-clamp-2">{caseItem.title}</p>
                          <p className="text-sm text-slate-500 font-mono">{caseItem.case_number}</p>
                          <div className="flex justify-between items-center">
                            {getPriorityBadge(caseItem.priority)}
                            <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================
// components/entities-module.tsx - VERSÃO MODERNA E SOFISTICADA
// =====================================

export function EntitiesModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // [Manter toda lógica existente...]

  return (
    <div className="space-y-8">
      {/* Header Moderno */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%20fill-rule%3D%22evenodd%22%3E%3Cpath%20d%3D%22m0%2040l40-40h-40v40zm40%200v-40h-40l40%2040z%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Gestão de Clientes e Partes</h2>
          <p className="text-blue-100 text-xl">Acesse a pasta virtual de cada entidade para ver processos e documentos organizados.</p>
        </div>
      </div>

      {/* Barra de Busca Moderna */}
      <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 justify-between items-center">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input 
                placeholder="Buscar por nome, documento ou informações..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-12 h-12 text-lg bg-white border-2 border-slate-200 focus:border-blue-400 rounded-xl"
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="border-2 border-slate-200 hover:border-slate-400 h-12">
                <Upload className="mr-2 h-4 w-4" /> 
                Importar Clientes
              </Button>
              <Button variant="outline" className="border-2 border-slate-200 hover:border-slate-400 h-12">
                <Upload className="mr-2 h-4 w-4" /> 
                Importar Executados
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg h-12">
                <Plus className="mr-2 h-4 w-4" /> 
                Novo Cadastro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Clientes Moderno */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Exemplo de card de cliente moderno */}
        <Card className="group cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-0 bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full transform translate-x-10 -translate-y-10 opacity-50 group-hover:opacity-70 transition-opacity"></div>
          
          <CardContent className="p-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    João da Silva Santos
                  </h3>
                  <p className="text-sm text-slate-600 font-mono">123.456.789-00</p>
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                  Cliente
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-600">📧 joao@email.com</p>
                <p className="text-sm text-slate-600">📱 (67) 99999-9999</p>
                <p className="text-sm text-slate-600">📍 Campo Grande, MS</p>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">3 processos ativos</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-100">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}