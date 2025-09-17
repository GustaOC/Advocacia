"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Folder, FileText, Users, Briefcase, Trash2, Edit } from "lucide-react";

// Mock do apiClient para refletir as novas funções de 'cases'
const apiClient = {
  getCases: async () => {
    console.log("Buscando casos (mock)...");
    return [
      { id: 1, case_number: "001/2024", title: "Ação de Cobrança - Empresa Exemplo vs. João da Silva", status: "active", court: "1ª Vara Cível", created_at: new Date().toISOString(), case_parties: [{ role: 'CLIENTE', entities: { id: 1, name: 'Empresa Exemplo Ltda' }}, { role: 'RÉU', entities: { id: 2, name: 'João da Silva' }}] },
      { id: 2, case_number: "002/2024", title: "Divórcio Consensual - Maria e José", status: "completed", court: "Vara de Família", created_at: new Date().toISOString(), case_parties: [{ role: 'CLIENTE', entities: { id: 3, name: 'Maria Souza' }}] },
    ];
  },
  createCase: async (caseData: any) => { console.log("Criando caso (mock):", caseData); return { id: Math.random(), ...caseData }; },
  // Adicione update e delete se necessário
};

// Tipos de dados alinhados com o novo schema
interface Entity {
  id: number;
  name: string;
  document?: string;
}

interface CaseParty {
  role: string;
  entities: Entity;
}

interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: string;
  court: string | null;
  created_at: string;
  case_parties: CaseParty[];
}

export function CasesModule() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ title: "", case_number: "", court: "" });

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getCases();
      setCases(data);
    } catch (error) {
      console.error("Falha ao carregar casos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCase = async () => {
    if (!newCase.title) return;
    try {
        await apiClient.createCase(newCase);
        setCreateModalOpen(false);
        setNewCase({ title: "", case_number: "", court: "" });
        loadCases();
    } catch(error) {
        console.error("Falha ao criar caso:", error);
    }
  };

  const filteredCases = useMemo(() =>
    cases.filter(c =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.case_parties.some(p => p.entities.name.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [cases, searchTerm]);

  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
        active: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        suspended: "bg-yellow-100 text-yellow-800",
        archived: "bg-gray-100 text-gray-800",
    };
    return <Badge className={statusClasses[status] || "bg-gray-100"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Casos e Processos</h2>
        <p className="text-slate-300 text-lg">Visualize e administre todos os casos do escritório de forma centralizada.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input placeholder="Buscar por título, número do caso ou nome da parte..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 h-11" />
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="h-11 bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
        </CardContent>
      </Card>

      {isLoading ? <p>Carregando casos...</p> : (
        <Card className="border-0 shadow-lg">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título do Caso</TableHead>
                  <TableHead>Nº do Processo</TableHead>
                  <TableHead>Partes Envolvidas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map(caseItem => (
                  <TableRow key={caseItem.id}>
                    <TableCell className="font-medium">{caseItem.title}</TableCell>
                    <TableCell className="font-mono text-sm">{caseItem.case_number || "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {caseItem.case_parties.map(party => (
                          <Badge key={`${party.entities.id}-${party.role}`} variant="outline" className="text-xs">
                            {party.entities.name} ({party.role})
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação de Caso */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Novo Caso</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Título *</Label>
              <Input id="title" value={newCase.title} onChange={e => setNewCase({...newCase, title: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="case_number" className="text-right">Nº do Processo</Label>
              <Input id="case_number" value={newCase.case_number} onChange={e => setNewCase({...newCase, case_number: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="court" className="text-right">Vara/Tribunal</Label>
              <Input id="court" value={newCase.court} onChange={e => setNewCase({...newCase, court: e.target.value})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleCreateCase}>Salvar Caso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}