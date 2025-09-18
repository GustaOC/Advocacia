// components/cases-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Scale, Upload, Filter } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { DocumentsModule } from "./documents-module";

// Tipos de dados atualizados
interface Entity { id: number; name: string }
interface CaseParty { role: string; entities: Entity }
interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: string;
  sub_status: string | null; // Para Acordo e Extinção
  value: number | null;
  court: string | null;
  created_at: string;
  case_parties: CaseParty[];
  description?: string | null;
  // Adicionando campos para exequente e executada
  exequente?: Entity | null;
  executada?: Entity | null;
}

export function CasesModule() {
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]); // Para os selects no modal
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCase, setCurrentCase] = useState<Partial<Case>>({});
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<Case | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [casesData, entitiesData] = await Promise.all([
        apiClient.getCases(),
        apiClient.getEntities()
      ]);
      setCases(casesData);
      setEntities(entitiesData);
    } catch (error: any) {
      toast({ title: "Erro", description: `Falha ao carregar dados: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const openModalForCreate = () => {
    setIsEditMode(false);
    setCurrentCase({
      title: '',
      case_number: '',
      court: '',
      description: '',
      value: 0,
      status: 'Em andamento' // Status padrão
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    // ... lógica de salvar
  };
  
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const searchMatch = 
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.exequente?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.executada?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const statusMatch = filterStatus === "all" || c.status === filterStatus;
      
      return searchMatch && statusMatch;
    });
  }, [cases, searchTerm, filterStatus]);
    
  const getStatusBadge = (status: string, sub_status?: string | null) => {
    const baseClasses = "font-semibold";
    let statusLabel = status;
    let colorClasses = "bg-gray-100 text-gray-800";

    switch (status) {
      case 'Em andamento': colorClasses = "bg-blue-100 text-blue-800"; break;
      case 'Em acordo': 
        colorClasses = "bg-purple-100 text-purple-800";
        if(sub_status) statusLabel += ` (${sub_status})`;
        break;
      case 'Extinção': 
        colorClasses = "bg-green-100 text-green-800";
        if(sub_status) statusLabel += ` (${sub_status})`;
        break;
      case 'Pagamento': colorClasses = "bg-teal-100 text-teal-800"; break; // Caso especial de filtro
    }
    return <Badge className={`${baseClasses} ${colorClasses}`}>{statusLabel}</Badge>;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Casos e Processos</h2>
        <p className="text-slate-300 text-lg">Administre todos os casos do escritório de forma centralizada.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between">
          <Input placeholder="Buscar por título, número ou parte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          
          <div className="flex gap-2">
            {/* ✅ MELHORIA: Filtros por status */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2"/>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Em andamento">Em Andamento</SelectItem>
                <SelectItem value="Em acordo">Em Acordo</SelectItem>
                <SelectItem value="Extinção">Extinção</SelectItem>
                <SelectItem value="Pagamento">Extinto por Pagamento</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo / Título</TableHead>
                <TableHead>Exequente</TableHead>
                <TableHead>Executado</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    <div className="font-medium">{caseItem.title}</div>
                    <div className="text-sm text-slate-500 font-mono">{caseItem.case_number || "-"}</div>
                  </TableCell>
                  <TableCell>{caseItem.exequente?.name || '-'}</TableCell>
                  <TableCell>{caseItem.executada?.name || '-'}</TableCell>
                  <TableCell>{caseItem.value ? `R$ ${caseItem.value.toLocaleString('pt-BR')}` : '-'}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status, caseItem.sub_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCaseForDetails(caseItem)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ✅ MELHORIA: Modal de Criação/Edição Aprimorado */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>{isEditMode ? "Editar Caso" : "Criar Novo Caso"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nº do Processo</Label><Input value={currentCase.case_number || ''} onChange={e => setCurrentCase({...currentCase, case_number: e.target.value})} /></div>
            <div className="space-y-2"><Label>Entidade (Executada)</Label>
              <Select onValueChange={id => setCurrentCase({...currentCase, executada: entities.find(e => e.id === Number(id))})}>
                <SelectTrigger><SelectValue placeholder="Selecione a parte executada..." /></SelectTrigger>
                <SelectContent>{entities.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Entidade (Exequente)</Label>
              <Select onValueChange={id => setCurrentCase({...currentCase, exequente: entities.find(e => e.id === Number(id))})}>
                <SelectTrigger><SelectValue placeholder="Selecione a parte exequente..." /></SelectTrigger>
                <SelectContent>{entities.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Valor da Ação</Label><Input type="number" value={currentCase.value || ''} onChange={e => setCurrentCase({...currentCase, value: Number(e.target.value)})} /></div>
            
            <div className="space-y-2"><Label>Status</Label>
              <Select value={currentCase.status} onValueChange={status => setCurrentCase({...currentCase, status, sub_status: null})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Em andamento">Em Andamento</SelectItem>
                  <SelectItem value="Em acordo">Em Acordo</SelectItem>
                  <SelectItem value="Extinção">Extinção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Condicional: Acordo */}
            {currentCase.status === 'Em acordo' && (
              <div className="space-y-2 pl-4 border-l-2 border-purple-500">
                <Label>Tipo de Acordo</Label>
                <Select value={currentCase.sub_status || ''} onValueChange={sub => setCurrentCase({...currentCase, sub_status: sub})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo de acordo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Judicial">Judicial</SelectItem>
                    <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                    <SelectItem value="Acordo em audiência">Acordo em audiência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Status Condicional: Extinção */}
            {currentCase.status === 'Extinção' && (
              <div className="space-y-2 pl-4 border-l-2 border-green-500">
                <Label>Motivo da Extinção</Label>
                <Select value={currentCase.sub_status || ''} onValueChange={sub => setCurrentCase({...currentCase, sub_status: sub})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pagamento">Pagamento</SelectItem>
                    <SelectItem value="Grupo econômico">Grupo econômico</SelectItem>
                    <SelectItem value="Citação negativa">Citação negativa</SelectItem>
                    <SelectItem value="Penhora infrutífera">Penhora infrutífera</SelectItem>
                    <SelectItem value="Morte">Morte</SelectItem>
                    <SelectItem value="Desistência">Desistência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}