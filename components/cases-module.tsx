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
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Filter, Upload, AlertTriangle, Clock, LayoutGrid, List, Star, TrendingUp } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Interfaces
interface Entity { 
  id: number; 
  name: string; 
}

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

interface CasesModuleProps { 
  initialFilters?: { status: string }; 
}

// Componente de estatísticas
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
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialFilters?.status || "all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  
  // Estados para modal de novo caso
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    case_number: '',
    court: '',
    priority: 'Média' as 'Alta' | 'Média' | 'Baixa',
    main_status: 'Em andamento' as Case['main_status'],
    description: '',
    value: '',
  });
  
  // Estados para modal de importação
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Query para buscar casos
  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => apiClient.getCases(),
  });
  
  const cases: Case[] = data?.cases ?? [];

  // Mutation para criar caso
  const createCaseMutation = useMutation({
    mutationFn: (caseData: typeof newCaseForm) => {
      return apiClient.createCase({
        ...caseData,
        value: caseData.value ? parseFloat(caseData.value) : null,
      });
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Caso criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setIsNewCaseModalOpen(false);
      // Reset form
      setNewCaseForm({
        title: '',
        case_number: '',
        court: '',
        priority: 'Média',
        main_status: 'Em andamento',
        description: '',
        value: '',
      });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar caso", description: error.message, variant: "destructive" });
    },
  });

  // Handler para salvar novo caso
  const handleSaveNewCase = () => {
    if (!newCaseForm.title) {
      toast({ title: "Erro", description: "O título do caso é obrigatório.", variant: "destructive" });
      return;
    }
    createCaseMutation.mutate(newCaseForm);
  };

  // Handler para importação
  const handleImportCases = async () => {
    if (!importFile) {
      toast({ title: "Erro", description: "Selecione um arquivo para importar.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await fetch('/api/cases/import', { 
        method: 'POST', 
        body: formData 
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Falha na importação.");
      }

      toast({
        title: "Importação Concluída!",
        description: `${result.successCount || 0} casos importados com sucesso.`
      });
      
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setIsImportModalOpen(false);
      setImportFile(null);
    } catch (error: any) {
      toast({ 
        title: "Erro na Importação", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Filtrar casos
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

  // Funções de renderização de badges
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
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
        
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Gestão de Casos e Processos</h2>
          <p className="text-slate-300 text-xl">Administre todos os casos do escritório de forma centralizada e eficiente.</p>
        </div>
      </div>

      {/* Estatísticas */}
      <CasesStats cases={cases} />

      {/* Controles de Filtro */}
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
              {/* Botões de visualização */}
              <div className="flex items-center gap-2 bg-slate-200 rounded-xl p-1">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg ${viewMode === 'list' ? '' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setViewMode('kanban')}
                  className={`rounded-lg ${viewMode === 'kanban' ? '' : 'text-slate-700 hover:text-slate-900'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Botão Importar - FUNCIONAL */}
              <Button 
                variant="outline" 
                className="border-2 border-slate-200 hover:border-slate-400"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
              
              {/* Botão Novo Caso - TEXTO SEMPRE VISÍVEL */}
              <Button
  onClick={() => setIsNewCaseModalOpen(true)}
  className="flex items-center shadow-lg rounded-lg font-semibold transition-colors"
  style={{
    background: 'linear-gradient(90deg,#0f172a,#111827)', // equivalente ao from-slate-900 -> to-slate-800
    color: '#ffffff',
  }}
>
  <Plus className="mr-2 h-4 w-4" />
  Novo Caso
</Button>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização em Lista */}
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

      {/* Visualização Kanban */}
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

      {/* Modal de Novo Caso */}
      <Dialog open={isNewCaseModalOpen} onOpenChange={setIsNewCaseModalOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Briefcase className="mr-2 h-5 w-5 text-slate-600" />
              Criar Novo Caso
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do novo caso/processo judicial
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Caso *</Label>
                <Input
                  id="title"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  placeholder="Ex: Ação de Cobrança - João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="case_number">Número do Processo</Label>
                <Input
                  id="case_number"
                  value={newCaseForm.case_number}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, case_number: e.target.value })}
                  placeholder="0000000-00.0000.0.00.0000"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court">Vara/Tribunal</Label>
                <Input
                  id="court"
                  value={newCaseForm.court}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, court: e.target.value })}
                  placeholder="Ex: 1ª Vara Cível de Campo Grande"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor da Causa</Label>
                <Input
                  id="value"
                  type="number"
                  value={newCaseForm.value}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, value: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newCaseForm.priority}
                  onValueChange={(value: 'Alta' | 'Média' | 'Baixa') => 
                    setNewCaseForm({ ...newCaseForm, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCaseForm.main_status}
                  onValueChange={(value: Case['main_status']) => 
                    setNewCaseForm({ ...newCaseForm, main_status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Acordo">Acordo</SelectItem>
                    <SelectItem value="Extinto">Extinto</SelectItem>
                    <SelectItem value="Pago">Pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={newCaseForm.description}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                placeholder="Descrição detalhada do caso..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCaseModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveNewCase}
              disabled={createCaseMutation.isPending}
              className="bg-slate-800 hover:bg-slate-900"
              style={{ color: 'white' }}
            >
              {createCaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Salvando...</span>
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4 text-white" />
                  <span className="text-white">Criar Caso</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Importação */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5 text-slate-600" />
              Importar Casos em Massa
            </DialogTitle>
            <DialogDescription>
              Faça upload de uma planilha Excel ou CSV com os casos para importar
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-900">
                    {importFile ? importFile.name : 'Clique para selecionar ou arraste o arquivo aqui'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Formatos aceitos: Excel (.xlsx, .xls) ou CSV
                  </p>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Formato esperado da planilha:</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Título | Número do Processo | Vara/Tribunal | Status | Prioridade | Valor | Descrição
                </p>
                <a 
                  href="/modelo-importacao-casos.xlsx" 
                  download 
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Baixar modelo de planilha
                </a>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleImportCases}
              disabled={isImporting || !importFile}
              className="bg-slate-800 hover:bg-slate-900"
              style={{ color: 'white' }}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  <span className="text-white">Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4 text-white" />
                  <span className="text-white">Importar Casos</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}