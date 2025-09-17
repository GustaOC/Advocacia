"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trash2, Plus, Search, Eye, Edit, Clock, CheckCircle, XCircle, 
  Users, Scale, AlertTriangle, FileText, Loader2, FolderOpen
} from "lucide-react"
import { DocumentsModule } from "./documents-module"
import { useToast } from "@/hooks/use-toast"

// Tipos de dados alinhados com o schema do seu banco de dados
interface Entity { id: number; name: string }
interface CaseParty { role: string; entities: Entity }
interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: string;
  court: string | null;
  created_at: string;
  case_parties: CaseParty[];
  // Adicione outros campos que você espera da API
  description?: string | null;
  value?: number;
  source?: string;
  store?: string;
  last_update?: string;
  next_deadline?: string;
  client_id?: number;
  client_name?: string;
}
interface ProcessTimeline {
  id: number;
  event: string;
  description: string;
  date: string;
}


export function ProcessControl() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProcess, setSelectedProcess] = useState<(Case & { timeline?: ProcessTimeline[] }) | null>(null);
  const [processes, setProcesses] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProcesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cases'); // Busca da API de casos
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao carregar os processos.");
      }
      const data: Case[] = await response.json();
      setProcesses(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProcesses();
  }, [loadProcesses]);

  const filteredProcesses = useMemo(() =>
    processes.filter(p => {
      const searchMatch = 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.case_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.case_parties.some(party => party.entities.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const statusMatch = filterStatus === "all" || p.status === filterStatus;

      return searchMatch && statusMatch;
    }),
  [processes, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
        active: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        suspended: "bg-yellow-100 text-yellow-800",
        archived: "bg-gray-100 text-gray-800",
    };
    return <Badge className={statusClasses[status] || "bg-gray-100"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Controle de Processos</h2>
        <p className="text-slate-300 text-lg">Gerencie todos os processos judiciais do escritório.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="Buscar por título, número ou parte..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-10 h-11" 
            />
          </div>
          <Button className="h-11 bg-slate-800 hover:bg-slate-900">
            <Plus className="mr-2 h-4 w-4" /> Novo Processo
          </Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título do Caso</TableHead>
                <TableHead>Nº do Processo</TableHead>
                <TableHead>Partes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProcesses.map(processItem => (
                <TableRow key={processItem.id}>
                  <TableCell className="font-medium">{processItem.title}</TableCell>
                  <TableCell className="font-mono text-sm">{processItem.case_number || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {processItem.case_parties.slice(0, 2).map(party => (
                        <Badge key={`${party.entities.id}-${party.role}`} variant="outline" className="text-xs">
                          {party.entities.name} ({party.role})
                        </Badge>
                      ))}
                      {processItem.case_parties.length > 2 && <Badge variant="secondary">...</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(processItem.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedProcess(processItem)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Processo */}
      <Dialog open={!!selectedProcess} onOpenChange={() => setSelectedProcess(null)}>
        <DialogContent className="max-w-5xl bg-white border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>Detalhes do Processo</span>
            </DialogTitle>
          </DialogHeader>
          {selectedProcess && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="pt-4">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                    <div className="bg-gray-100 p-4 rounded-xl">
                        <Label className="font-semibold text-slate-700">Número do Processo</Label>
                        <p className="font-mono text-lg font-medium text-slate-900">{selectedProcess.case_number || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-xl">
                        <Label className="font-semibold text-slate-700">Título</Label>
                        <p className="text-slate-900">{selectedProcess.title}</p>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-xl">
                        <Label className="font-semibold text-slate-700">Vara/Tribunal</Label>
                        <p className="text-slate-900">{selectedProcess.court || 'N/A'}</p>
                    </div>
                    </div>
                    <div className="space-y-3">
                    <div className="bg-gray-100 p-4 rounded-xl">
                        <Label className="font-semibold text-slate-700">Status</Label>
                        <div className="mt-2">{getStatusBadge(selectedProcess.status)}</div>
                    </div>
                    <div className="bg-gray-100 p-4 rounded-xl">
                        <Label className="font-semibold text-slate-700">Partes Envolvidas</Label>
                        <div className="mt-2 flex flex-col gap-1">
                        {selectedProcess.case_parties.map(party => (
                            <Badge key={`${party.entities.id}-${party.role}`} variant="outline" className="text-xs">
                            {party.entities.name} ({party.role})
                            </Badge>
                        ))}
                        </div>
                    </div>
                    </div>
                </div>
              </TabsContent>
              <TabsContent value="timeline" className="pt-4">
                <p className="text-center text-slate-500">Timeline do processo será exibida aqui.</p>
              </TabsContent>
              <TabsContent value="documents" className="pt-4">
                <DocumentsModule caseId={selectedProcess.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}