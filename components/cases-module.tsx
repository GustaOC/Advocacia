// components/cases-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Scale } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { DocumentsModule } from "./documents-module";

// Tipos de dados
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
  description?: string | null;
}

export function CasesModule() {
  const { toast } = useToast();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCase, setCurrentCase] = useState<Partial<Case>>({});
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<Case | null>(null);

  const loadCases = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCases();
      setCases(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar casos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);
  
  const openModalForCreate = () => {
    setIsEditMode(false);
    setCurrentCase({ title: '', case_number: '', court: '', description: '' });
    setModalOpen(true);
  };

  const openModalForEdit = (caseItem: Case) => {
    setIsEditMode(true);
    setCurrentCase(caseItem);
    setModalOpen(true);
  };
  
  const handleSave = async () => {
    try {
      if (isEditMode) {
        await apiClient.updateCase(String(currentCase.id!), currentCase);
        toast({ title: "Sucesso!", description: "Caso atualizado." });
      } else {
        await apiClient.createCase(currentCase);
        toast({ title: "Sucesso!", description: "Novo caso criado." });
      }
      setModalOpen(false);
      loadCases();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir este caso? Esta ação não pode ser desfeita.")) {
      try {
        await apiClient.deleteCase(String(id));
        toast({ title: "Sucesso!", description: "Caso excluído." });
        loadCases();
      } catch (error: any) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      }
    }
  };

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter(c => {
      // ✅ CORREÇÃO APLICADA AQUI
      const searchMatch = 
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.case_parties || []).some(party => 
          (party.entities?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return searchMatch;
    });
  }, [cases, searchTerm]);
    
  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
        active: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        suspended: "bg-yellow-100 text-yellow-800",
        archived: "bg-gray-100 text-gray-800",
    };
    return <Badge className={statusClasses[status] || "bg-gray-100"}>{status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Indefinido'}</Badge>;
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
        <h2 className="text-3xl font-bold mb-2">Gestão de Casos</h2>
        <p className="text-slate-300 text-lg">Administre todos os casos e processos do escritório.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <Input placeholder="Buscar por título, número ou parte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Nº Processo</TableHead><TableHead>Partes</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredCases.map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-medium">{caseItem.title}</TableCell>
                  <TableCell className="font-mono text-sm">{caseItem.case_number || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {(caseItem.case_parties || []).slice(0, 2).map(party => (
                        <Badge key={`${party.entities.id}-${party.role}`} variant="outline">{party.entities.name} ({party.role})</Badge>
                      ))}
                      {caseItem.case_parties && caseItem.case_parties.length > 2 && <Badge variant="secondary">...</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedCaseForDetails(caseItem)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openModalForEdit(caseItem)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(caseItem.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedCaseForDetails} onOpenChange={() => setSelectedCaseForDetails(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Detalhes do Caso</DialogTitle></DialogHeader>
          {selectedCaseForDetails && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList><TabsTrigger value="details">Detalhes</TabsTrigger><TabsTrigger value="documents">Documentos</TabsTrigger></TabsList>
              <TabsContent value="details" className="pt-4 space-y-4">
                <p><strong>Título:</strong> {selectedCaseForDetails.title}</p>
                <p><strong>Descrição:</strong> {selectedCaseForDetails.description || 'N/A'}</p>
              </TabsContent>
              <TabsContent value="documents" className="pt-4">
                <DocumentsModule caseId={selectedCaseForDetails.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{isEditMode ? "Editar Caso" : "Criar Novo Caso"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="title">Título *</Label><Input id="title" value={currentCase.title || ''} onChange={e => setCurrentCase({...currentCase, title: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="case_number">Nº do Processo</Label><Input id="case_number" value={currentCase.case_number || ''} onChange={e => setCurrentCase({...currentCase, case_number: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="court">Vara/Tribunal</Label><Input id="court" value={currentCase.court || ''} onChange={e => setCurrentCase({...currentCase, court: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={currentCase.description || ''} onChange={e => setCurrentCase({...currentCase, description: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar Alterações" : "Criar Caso"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}