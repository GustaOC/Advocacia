"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, DollarSign, FileText, Briefcase, Users } from "lucide-react";
// import { apiClient } from "@/lib/api-client";

// --- Tipos alinhados com o novo Schema ---
interface Entity {
  id: number;
  name: string;
}

interface CaseParty {
  role: string;
  entities: Entity;
}

interface Case {
  id: number;
  case_number: string | null;
  title: string;
  case_parties: CaseParty[];
}

interface FinancialAgreement {
  id: number;
  total_value: number;
  status: string;
  agreement_type: string;
  installments: number;
  cases: { title: string, case_number: string | null };
  entities: { name: string };
}

// --- Mock do apiClient para demonstração ---
const apiClient = {
  getFinancialAgagreements: async (): Promise<FinancialAgreement[]> => [
    { id: 1, total_value: 5000, status: 'active', agreement_type: 'Parcelamento', installments: 10, cases: { title: 'Ação de Cobrança', case_number: '001/2024' }, entities: { name: 'João da Silva' } },
    { id: 2, total_value: 12000, status: 'completed', agreement_type: 'Acordo Judicial', installments: 1, cases: { title: 'Divórcio Consensual', case_number: '002/2024' }, entities: { name: 'Maria Souza' } },
  ],
  getCases: async (): Promise<Case[]> => [
      { id: 1, case_number: "001/2024", title: "Ação de Cobrança - Empresa Exemplo vs. João da Silva", case_parties: [{ role: 'CLIENTE', entities: { id: 1, name: 'Empresa Exemplo Ltda' }}, { role: 'RÉU', entities: { id: 2, name: 'João da Silva' }}] },
      { id: 2, case_number: "002/2024", title: "Divórcio Consensual - Maria e José", case_parties: [{ role: 'CLIENTE', entities: { id: 3, name: 'Maria Souza' }}] },
  ],
  createFinancialAgreement: async (data: any) => { console.log("Criando acordo (mock):", data); return { id: Math.random(), ...data }; },
};

export function FinancialModule() {
  const [agreements, setAgreements] = useState<FinancialAgreement[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  
  // Estado para o formulário de criação
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [newAgreement, setNewAgreement] = useState({
    total_value: "",
    entry_value: "",
    installments: "1",
    agreement_type: "Acordo Judicial",
    notes: ""
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [agreementsData, casesData] = await Promise.all([
        apiClient.getFinancialAgreements(),
        apiClient.getCases(),
      ]);
      setAgreements(agreementsData);
      setCases(casesData);
    } catch (error) {
      console.error("Falha ao carregar dados financeiros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAgreement = async () => {
    if (!selectedCase || !selectedEntityId || !newAgreement.total_value) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }
    const payload = {
        case_id: selectedCase.id,
        client_entity_id: parseInt(selectedEntityId, 10),
        total_value: parseFloat(newAgreement.total_value),
        entry_value: parseFloat(newAgreement.entry_value) || 0,
        installments: parseInt(newAgreement.installments, 10),
        agreement_type: newAgreement.agreement_type,
        notes: newAgreement.notes,
    };
    try {
        await apiClient.createFinancialAgreement(payload);
        setModalOpen(false);
        resetForm();
        loadInitialData(); // Recarrega os dados
    } catch(error) {
        console.error("Falha ao criar acordo:", error);
    }
  };
  
  const resetForm = () => {
      setSelectedCase(null);
      setSelectedEntityId("");
      setNewAgreement({ total_value: "", entry_value: "", installments: "1", agreement_type: "Acordo Judicial", notes: "" });
  };
  
  const getStatusBadge = (status: string) => {
    const statusClasses: { [key: string]: string } = {
        active: "bg-green-100 text-green-800",
        completed: "bg-blue-100 text-blue-800",
        defaulted: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-800",
    };
    return <Badge className={statusClasses[status] || "bg-gray-100"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
        <p className="text-slate-300 text-lg">Gestão de acordos, pagamentos e recebíveis.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <Input placeholder="Buscar acordo..." className="max-w-xs" />
          <Button onClick={() => { resetForm(); setModalOpen(true); }} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Acordo</Button>
        </CardContent>
      </Card>
      
      {isLoading ? <p>Carregando...</p> : (
        <Card className="border-0 shadow-lg">
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Caso</TableHead><TableHead>Cliente</TableHead><TableHead>Valor Total</TableHead><TableHead>Parcelas</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {agreements.map(agreement => (
                  <TableRow key={agreement.id}>
                    <TableCell className="font-medium">{agreement.cases.title}</TableCell>
                    <TableCell>{agreement.entities.name}</TableCell>
                    <TableCell>R$ {agreement.total_value.toFixed(2)}</TableCell>
                    <TableCell>{agreement.installments}</TableCell>
                    <TableCell>{getStatusBadge(agreement.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal de Criação */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>Criar Novo Acordo Financeiro</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label><Briefcase className="inline h-4 w-4 mr-2"/>Selecione o Caso *</Label>
              <Select onValueChange={(caseId) => setSelectedCase(cases.find(c => c.id === parseInt(caseId)) || null)}>
                <SelectTrigger><SelectValue placeholder="Escolha um caso..." /></SelectTrigger>
                <SelectContent>
                  {cases.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title} ({c.case_number})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {selectedCase && (
              <div className="space-y-2">
                <Label><Users className="inline h-4 w-4 mr-2"/>Selecione a Entidade (Cliente) *</Label>
                <Select onValueChange={setSelectedEntityId} value={selectedEntityId}>
                  <SelectTrigger><SelectValue placeholder="Escolha a parte pagante..." /></SelectTrigger>
                  <SelectContent>
                    {selectedCase.case_parties.map(party => (
                      <SelectItem key={party.entities.id} value={party.entities.id.toString()}>
                        {party.entities.name} ({party.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_value">Valor Total *</Label>
                <Input id="total_value" type="number" placeholder="R$ 1000,00" value={newAgreement.total_value} onChange={e => setNewAgreement({...newAgreement, total_value: e.target.value})} />
              </div>
               <div className="space-y-2">
                <Label htmlFor="entry_value">Valor de Entrada</Label>
                <Input id="entry_value" type="number" placeholder="R$ 100,00" value={newAgreement.entry_value} onChange={e => setNewAgreement({...newAgreement, entry_value: e.target.value})} />
              </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Input id="installments" type="number" min="1" value={newAgreement.installments} onChange={e => setNewAgreement({...newAgreement, installments: e.target.value})} />
              </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" onClick={handleCreateAgreement}>Salvar Acordo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}