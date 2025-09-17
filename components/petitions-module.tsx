"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, AlertTriangle, CheckCircle, Eye, Users } from "lucide-react";
import { clear } from "console";

// --- Tipos alinhados com o novo Schema ---
interface Employee {
  id: string; // UUID
  name: string;
}

interface Case {
  id: number;
  title: string;
  case_number: string | null;
  case_parties: any[]; // Simplificado para o mock
}

interface Petition {
  id: number;
  title: string;
  status: 'pending' | 'under_review' | 'approved' | 'corrections_needed' | 'rejected';
  deadline: string | null;
  cases: Case;
  created_by: Employee;
  assigned_to: Employee;
}

// --- Mock do apiClient ---
const apiClient = {
  getPetitions: async (): Promise<Petition[]> => [
    { id: 1, title: "Petição Inicial XYZ", status: 'pending', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), cases: { id: 1, title: 'Ação de Cobrança', case_number: '001/2024', case_parties: [] }, created_by: { id: 'uuid-user-1', name: 'Assistente Ana' }, assigned_to: { id: 'uuid-user-2', name: 'Dr. Carlos' } },
    { id: 2, title: "Contestação ABC", status: 'under_review', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), cases: { id: 2, title: 'Defesa Trabalhista', case_number: '002/2024', case_parties: [] }, created_by: { id: 'uuid-user-1', name: 'Assistente Ana' }, assigned_to: { id: 'uuid-user-2', name: 'Dr. Carlos' } },
  ],
  getCases: async (): Promise<Case[]> => [
      { id: 1, case_number: "001/2024", title: "Ação de Cobrança - Empresa Exemplo vs. João da Silva", case_parties: [] },
      { id: 2, case_number: "002/2024", title: "Divórcio Consensual - Maria e José", case_parties: [] },
  ],
  getEmployees: async (): Promise<Employee[]> => [
      { id: 'uuid-user-1', name: 'Assistente Ana'},
      { id: 'uuid-user-2', name: 'Dr. Carlos'}
  ]
};


export function PetitionsModule() {
  const [view, setView] = useState<'list' | 'create' | 'review'>('list');
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  
  const [cases, setCases] = useState<Case[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [petitionsData, casesData, employeesData] = await Promise.all([
        apiClient.getPetitions(),
        apiClient.getCases(),
        apiClient.getEmployees(),
      ]);
      setPetitions(petitionsData);
      setCases(casesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error("Falha ao carregar dados do módulo de petições:", error);
    }
  };

  const handleReviewPetition = (petition: Petition) => {
    setSelectedPetition(petition);
    setView('review');
  };

  const handleSuccess = () => {
    loadData();
    setView('list');
  };

  const renderContent = () => {
    switch (view) {
      case 'create':
        return <CreatePetition cases={cases} employees={employees} onSuccess={handleSuccess} onCancel={() => setView('list')} />;
      case 'review':
        return selectedPetition ? <ReviewPetition petition={selectedPetition} onSuccess={handleSuccess} onBack={() => setView('list')} /> : null;
      case 'list':
      default:
        return <PetitionList petitions={petitions} onReviewPetition={handleReviewPetition} />;
    }
  };
  
  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold mb-2">Módulo de Petições</h2>
            <p className="text-slate-300 text-lg">Crie, gerencie e revise todas as petições do escritório.</p>
        </div>
        {view === 'list' && (
            <Button onClick={() => setView('create')} className="bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="mr-2 h-4 w-4" /> Nova Petição
            </Button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
}

const CreatePetition = ({ cases, employees, onSuccess, onCancel }: { cases: Case[], employees: Employee[], onSuccess: () => void, onCancel: () => void }) => (
    <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle>Criar Nova Petição</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div><Label>Caso Associado</Label><Select><SelectTrigger><SelectValue placeholder="Selecione um caso..." /></SelectTrigger><SelectContent>{cases.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.title}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Título da Petição</Label><Input placeholder="Ex: Petição Inicial" /></div>
            <div><Label>Responsável pela Revisão</Label><Select><SelectTrigger><SelectValue placeholder="Selecione um advogado..." /></SelectTrigger><SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Arquivo (.doc, .docx)</Label><Input type="file" /></div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2"><Button variant="outline" onClick={onCancel}>Cancelar</Button><Button onClick={onSuccess}>Enviar para Revisão</Button></CardFooter>
    </Card>
);

const ReviewPetition = ({ petition, onSuccess, onBack }: { petition: Petition, onSuccess: () => void, onBack: () => void }) => (
    <Card className="border-0 shadow-lg">
        <CardHeader><CardTitle>Revisar Petição: {petition.title}</CardTitle></CardHeader>
        <CardContent><p>Detalhes da revisão para a petição do caso "{petition.cases.title}".</p></CardContent>
        <CardFooter className="flex justify-end gap-2"><Button variant="outline" onClick={onBack}>Voltar</Button><Button onClick={onSuccess}>Aprovar</Button></CardFooter>
    </Card>
);

const PetitionList = ({ petitions, onReviewPetition }: { petitions: Petition[], onReviewPetition: (p: Petition) => void }) => (
    <Card className="border-0 shadow-lg">
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Caso</TableHead><TableHead>Status</TableHead><TableHead>Responsável</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {petitions.map(p => (
                        <TableRow key={p.id}>
                            <TableCell>{p.title}</TableCell>
                            <TableCell>{p.cases.title}</TableCell>
                            <TableCell>{p.status}</TableCell>
                            <TableCell>{p.assigned_to.name}</TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => onReviewPetition(p)}><Eye className="h-4 w-4" /></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);