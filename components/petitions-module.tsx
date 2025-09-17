"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"; // ✅ CORREÇÃO: CardFooter importado
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, AlertTriangle, CheckCircle, Eye, Users, Loader2 } from "lucide-react";
// ✅ CORREÇÃO: Removido import inválido { clear } from "console"

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

// ✅ CORREÇÃO: Mock do apiClient com error handling
const apiClient = {
  getPetitions: async (): Promise<Petition[]> => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      { 
        id: 1, 
        title: "Petição Inicial XYZ", 
        status: 'pending', 
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
        cases: { id: 1, title: 'Ação de Cobrança', case_number: '001/2024', case_parties: [] }, 
        created_by: { id: 'uuid-user-1', name: 'Assistente Ana' }, 
        assigned_to: { id: 'uuid-user-2', name: 'Dr. Carlos' } 
      },
      { 
        id: 2, 
        title: "Contestação ABC", 
        status: 'under_review', 
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
        cases: { id: 2, title: 'Defesa Trabalhista', case_number: '002/2024', case_parties: [] }, 
        created_by: { id: 'uuid-user-1', name: 'Assistente Ana' }, 
        assigned_to: { id: 'uuid-user-2', name: 'Dr. Carlos' } 
      },
      { 
        id: 3, 
        title: "Recurso de Apelação", 
        status: 'approved', 
        deadline: null, 
        cases: { id: 3, title: 'Ação Trabalhista', case_number: '003/2024', case_parties: [] }, 
        created_by: { id: 'uuid-user-2', name: 'Dr. Carlos' }, 
        assigned_to: { id: 'uuid-user-1', name: 'Assistente Ana' } 
      },
    ];
  },
  
  getCases: async (): Promise<Case[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      { id: 1, case_number: "001/2024", title: "Ação de Cobrança - Empresa Exemplo vs. João da Silva", case_parties: [] },
      { id: 2, case_number: "002/2024", title: "Divórcio Consensual - Maria e José", case_parties: [] },
      { id: 3, case_number: "003/2024", title: "Ação Trabalhista - Funcionário vs. Empresa", case_parties: [] },
    ];
  },
  
  getEmployees: async (): Promise<Employee[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return [
      { id: 'uuid-user-1', name: 'Assistente Ana'},
      { id: 'uuid-user-2', name: 'Dr. Carlos'},
      { id: 'uuid-user-3', name: 'Dra. Maria'},
    ];
  }
};

export function PetitionsModule() {
  const [view, setView] = useState<'list' | 'create' | 'review'>('list');
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  
  const [cases, setCases] = useState<Case[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // ✅ CORREÇÃO: Estados de loading e erro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log("[PetitionsModule] Carregando dados...");
      setLoading(true);
      setError(null);
      
      const [petitionsData, casesData, employeesData] = await Promise.all([
        apiClient.getPetitions(),
        apiClient.getCases(),
        apiClient.getEmployees(),
      ]);
      
      setPetitions(petitionsData);
      setCases(casesData);
      setEmployees(employeesData);
      
      console.log("[PetitionsModule] ✅ Dados carregados:", {
        petitions: petitionsData.length,
        cases: casesData.length,
        employees: employeesData.length
      });
      
    } catch (error) {
      console.error("[PetitionsModule] ❌ Falha ao carregar dados:", error);
      setError("Erro ao carregar dados do módulo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewPetition = (petition: Petition) => {
    console.log("[PetitionsModule] Abrindo revisão da petição:", petition.id);
    setSelectedPetition(petition);
    setView('review');
  };

  const handleSuccess = () => {
    console.log("[PetitionsModule] Operação bem-sucedida, recarregando dados...");
    loadData();
    setView('list');
    setSelectedPetition(null);
  };

  const handleCancel = () => {
    console.log("[PetitionsModule] Operação cancelada");
    setView('list');
    setSelectedPetition(null);
  };

  // ✅ CORREÇÃO: Loading state aprimorado
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Módulo de Petições</h2>
              <p className="text-slate-300 text-lg">Carregando dados...</p>
            </div>
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
        
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              <p className="text-slate-600">Carregando módulo de petições...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ CORREÇÃO: Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div>
            <h2 className="text-3xl font-bold mb-2">Módulo de Petições</h2>
            <p className="text-slate-300 text-lg">Erro ao carregar dados</p>
          </div>
        </div>
        
        <Card className="border-0 shadow-lg border-red-200">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-2">Erro no Módulo</h3>
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={loadData} className="bg-red-600 hover:bg-red-700">
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'create':
        return (
          <CreatePetition 
            cases={cases} 
            employees={employees} 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        );
      case 'review':
        return selectedPetition ? (
          <ReviewPetition 
            petition={selectedPetition} 
            onSuccess={handleSuccess} 
            onBack={handleCancel} 
          />
        ) : null;
      case 'list':
      default:
        return (
          <PetitionList 
            petitions={petitions} 
            onReviewPetition={handleReviewPetition} 
          />
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">Módulo de Petições</h2>
          <p className="text-slate-300 text-lg">Crie, gerencie e revise todas as petições do escritório.</p>
          {/* ✅ CORREÇÃO: Estatísticas básicas */}
          <div className="flex space-x-6 mt-4 text-sm">
            <span className="text-slate-300">
              <strong className="text-white">{petitions.length}</strong> petições
            </span>
            <span className="text-slate-300">
              <strong className="text-white">{petitions.filter(p => p.status === 'pending').length}</strong> pendentes
            </span>
            <span className="text-slate-300">
              <strong className="text-white">{petitions.filter(p => p.status === 'approved').length}</strong> aprovadas
            </span>
          </div>
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

// ✅ CORREÇÃO: Componentes auxiliares melhorados
const CreatePetition = ({ 
  cases, 
  employees, 
  onSuccess, 
  onCancel 
}: { 
  cases: Case[], 
  employees: Employee[], 
  onSuccess: () => void, 
  onCancel: () => void 
}) => {
  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    assignedTo: '',
    file: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[CreatePetition] Enviando petição:", formData);
    // Simula criação
    setTimeout(onSuccess, 1000);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Criar Nova Petição
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Caso Associado</Label>
            <Select value={formData.caseId} onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um caso..." />
              </SelectTrigger>
              <SelectContent>
                {cases.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.case_number} - {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Título da Petição</Label>
            <Input 
              placeholder="Ex: Petição Inicial" 
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          
          <div>
            <Label>Responsável pela Revisão</Label>
            <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um advogado..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Arquivo (.doc, .docx)</Label>
            <Input 
              type="file" 
              accept=".doc,.docx,.pdf"
              onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!formData.title || !formData.caseId}>
          Enviar para Revisão
        </Button>
      </CardFooter>
    </Card>
  );
};

const ReviewPetition = ({ 
  petition, 
  onSuccess, 
  onBack 
}: { 
  petition: Petition, 
  onSuccess: () => void, 
  onBack: () => void 
}) => {
  const getStatusBadge = (status: Petition['status']) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      'under_review': { color: 'bg-blue-100 text-blue-800', label: 'Em Revisão' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
      'corrections_needed': { color: 'bg-orange-100 text-orange-800', label: 'Correções Necessárias' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejeitado' }
    };
    
    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            Revisar Petição: {petition.title}
          </span>
          {getStatusBadge(petition.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-slate-600">Caso Associado</Label>
            <p className="text-slate-900">{petition.cases.case_number} - {petition.cases.title}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600">Criado por</Label>
            <p className="text-slate-900">{petition.created_by.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600">Responsável</Label>
            <p className="text-slate-900">{petition.assigned_to.name}</p>
          </div>
          <div>
            <Label className="text-sm font-medium text-slate-600">Prazo</Label>
            <p className="text-slate-900">
              {petition.deadline ? new Date(petition.deadline).toLocaleDateString('pt-BR') : 'Sem prazo definido'}
            </p>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <p className="text-slate-600">
            Utilize esta área para revisar o conteúdo da petição "{petition.title}" 
            relacionada ao caso "{petition.cases.title}".
          </p>
          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">
              💡 <strong>Dica:</strong> Verifique se todos os argumentos estão bem fundamentados 
              e se a formatação está de acordo com os padrões do escritório.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
            Solicitar Correções
          </Button>
          <Button onClick={onSuccess} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprovar
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const PetitionList = ({ 
  petitions, 
  onReviewPetition 
}: { 
  petitions: Petition[], 
  onReviewPetition: (p: Petition) => void 
}) => {
  const getStatusBadge = (status: Petition['status']) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente' },
      'under_review': { color: 'bg-blue-100 text-blue-800', label: 'Em Revisão' },
      'approved': { color: 'bg-green-100 text-green-800', label: 'Aprovado' },
      'corrections_needed': { color: 'bg-orange-100 text-orange-800', label: 'Correções Necessárias' },
      'rejected': { color: 'bg-red-100 text-red-800', label: 'Rejeitado' }
    };
    
    const config = statusConfig[status];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Lista de Petições
        </CardTitle>
      </CardHeader>
      <CardContent>
        {petitions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhuma petição encontrada</h3>
            <p className="text-slate-600">Crie sua primeira petição para começar.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Caso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {petitions.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{p.cases.case_number}</div>
                      <div className="text-sm text-slate-500">{p.cases.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(p.status)}</TableCell>
                  <TableCell>{p.assigned_to.name}</TableCell>
                  <TableCell>
                    {p.deadline ? (
                      <div className="text-sm">
                        {new Date(p.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    ) : (
                      <span className="text-slate-400">Sem prazo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onReviewPetition(p)}
                      title="Revisar petição"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};