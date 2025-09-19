// components/cases-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Upload, Filter, FileCog, Copy, Download, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// Tipos
interface Entity { id: number; name: string }
interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: string;
  sub_status: string | null;
  value: number | null;
  court: string | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa'; // Novo campo de prioridade
  exequente?: Entity | null;
  executada?: Entity | null;
}
interface Template { id: number; title: string; }
interface CasesModuleProps { initialFilters?: { status: string }; }

// Modal de Geração de Documento (permanece o mesmo)
const GenerateDocumentModal = ({ caseItem, isOpen, onClose }: { caseItem: Case, isOpen: boolean, onClose: () => void }) => {
    // ...código do modal inalterado...
};


export function CasesModule({ initialFilters }: CasesModuleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialFilters?.status || "all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<Case | null>(null);
  const [selectedCaseForDocs, setSelectedCaseForDocs] = useState<Case | null>(null);

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: apiClient.getCases,
  });

  useEffect(() => {
    if (initialFilters?.status) {
      setFilterStatus(initialFilters.status);
    }
  }, [initialFilters]);

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const searchMatch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === "all" || c.status === filterStatus;
      const priorityMatch = filterPriority === "all" || c.priority === filterPriority;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [cases, searchTerm, filterStatus, filterPriority]);
    
  const getStatusBadge = (status: string) => <Badge>{status}</Badge>;
  
  const getPriorityBadge = (priority: string) => {
    const colors = {
      'Alta': 'bg-red-100 text-red-800 border-red-200',
      'Média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Baixa': 'bg-green-100 text-green-800 border-green-200',
    };
    return <Badge className={colors[priority as keyof typeof colors] || 'bg-slate-100'}><AlertTriangle className="h-3 w-3 mr-1" />{priority}</Badge>;
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>;

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Casos e Processos</h2>
        <p className="text-slate-300 text-lg">Administre todos os casos do escritório de forma centralizada.</p>
      </div>
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between">
          <Input placeholder="Buscar por título, número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2"/><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Em andamento">Em Andamento</SelectItem>
                <SelectItem value="Em acordo">Em Acordo</SelectItem>
                <SelectItem value="Extinção">Extinção</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[180px]"><AlertTriangle className="h-4 w-4 mr-2"/><SelectValue placeholder="Prioridade" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            <Button className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Processo / Título</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredCases.map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    <div className="font-medium">{caseItem.title}</div>
                    <div className="text-sm text-slate-500 font-mono">{caseItem.case_number || "-"}</div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCaseForDetails(caseItem)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCaseForDocs(caseItem)}><FileCog className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Modal de Geração de Documento */}
      {selectedCaseForDocs && (
        <GenerateDocumentModal
          caseItem={selectedCaseForDocs}
          isOpen={!!selectedCaseForDocs}
          onClose={() => setSelectedCaseForDocs(null)}
        />
      )}
    </div>
  );
}