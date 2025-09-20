// components/cases-module.tsx - VERSÃO CORRIGIDA (COM IMPORTAÇÃO E MODAL DE CRIAÇÃO CORRETO)
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
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Filter, FileCog, Upload, FileUp, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// --- Tipagens ---
interface Entity { id: number; name: string; }
interface Case {
  id: number;
  case_number: string | null;
  title: string; // Este campo é a "Observação"
  status: string;
  value: number | null;
  court: string | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  description?: string | null;
  case_parties: { role: string; entities: Entity }[];
  client_entity_id?: number;
  executed_entity_id?: number;
}
interface Template { id: number; title: string; }
interface CasesModuleProps { initialFilters?: { status: string }; }

// --- Componentes de Modal ---

// Modal para Importação de Casos
const CaseImportModal = ({ isOpen, onClose, onImportSuccess }: { isOpen: boolean; onClose: () => void; onImportSuccess: () => void; }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFile(event.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast({ title: "Nenhum arquivo selecionado", variant: "destructive" });
            return;
        }
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await fetch('/api/cases/import', { method: 'POST', body: formData });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Falha na importação.");
            }
            toast({
                title: "Importação Concluída!",
                description: `${result.successCount} casos importados. ${result.errorCount > 0 ? `${result.errorCount} linhas com erros.` : ''}`
            });
            onImportSuccess();
            onClose();
        } catch (error: any) {
            toast({ title: "Erro na Importação", description: error.message, variant: "destructive" });
        } finally {
            setIsImporting(false);
            setFile(null);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Importar Casos em Massa</DialogTitle>
                    <DialogDescription>
                        Envie uma planilha (.xlsx ou .csv) com os dados dos processos. As colunas devem ser: "Cliente", "Executado", "Numero Processo", "Observacao", "Status", "Prioridade".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="import-file">Arquivo de Planilha</Label>
                    <Input id="import-file" type="file" onChange={handleFileChange} accept=".xlsx, .csv" />
                    <p className="text-sm text-blue-600">Lembre-se de que os nomes dos clientes e executados na planilha devem corresponder exatamente aos nomes cadastrados no sistema.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleImport} disabled={isImporting || !file}>
                        {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileUp className="mr-2 h-4 w-4" />}
                        {isImporting ? 'Importando...' : 'Iniciar Importação'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Modal para Criar/Editar Caso (VERSÃO CORRIGIDA)
const CaseEditModal = ({ isOpen, onClose, caseData, onSave }: { isOpen: boolean; onClose: () => void; caseData: Partial<Case> | null; onSave: (data: Partial<Case>) => void; }) => {
    const [formData, setFormData] = useState<Partial<Case>>({});
    const { toast } = useToast();

    const { data: entities = [], isLoading: isLoadingEntities } = useQuery<Entity[]>({
        queryKey: ['entities'],
        queryFn: () => apiClient.getEntities(),
    });

    React.useEffect(() => {
        const isCreating = !caseData?.id;
        const initialData = caseData || { 
            priority: 'Média', 
            status: 'active',
            title: '',
            case_number: '',
        };
        setFormData(isCreating ? initialData : caseData!);
    }, [caseData, isOpen]);

    const handleChange = (field: keyof Case, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.client_entity_id || !formData.executed_entity_id || !formData.title) {
            toast({ title: "Campos obrigatórios", description: "Cliente, Executado e Observação são obrigatórios.", variant: "destructive"});
            return;
        }
        onSave(formData);
    };

    // Se estiver editando, mostramos um formulário diferente (simplificado por enquanto)
    if (caseData?.id) {
         // Lógica de edição futura pode ser mais complexa
         return (
             <Dialog open={isOpen} onOpenChange={onClose}>
                 <DialogContent><DialogHeader><DialogTitle>Editar Caso</DialogTitle></DialogHeader><div>Edição de caso existente.</div></DialogContent>
             </Dialog>
         )
    }

    // Formulário de CRIAÇÃO
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Novo Caso</DialogTitle>
                    <DialogDescription>Preencha os dados para criar um novo processo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="client_entity_id">1. Cliente *</Label>
                        <Select value={String(formData.client_entity_id || '')} onValueChange={value => handleChange('client_entity_id', Number(value))}>
                            <SelectTrigger disabled={isLoadingEntities}><SelectValue placeholder={isLoadingEntities ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger>
                            <SelectContent>{entities.map(entity => (<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="case_number">2. Número do Processo</Label>
                        <Input id="case_number" value={formData.case_number || ''} onChange={e => handleChange('case_number', e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="executed_entity_id">3. Executado (Parte Contrária) *</Label>
                        <Select value={String(formData.executed_entity_id || '')} onValueChange={value => handleChange('executed_entity_id', Number(value))}>
                            <SelectTrigger disabled={isLoadingEntities}><SelectValue placeholder={isLoadingEntities ? "Carregando..." : "Selecione o executado"} /></SelectTrigger>
                            <SelectContent>{entities.map(entity => (<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>))}</SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">Se a parte não estiver na lista, cadastre-a primeiro na aba 'Clientes'.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="status">4. Status</Label>
                            <Select value={formData.status || 'active'} onValueChange={value => handleChange('status', value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="active">Ativo</SelectItem><SelectItem value="completed">Concluído</SelectItem><SelectItem value="archived">Arquivado</SelectItem><SelectItem value="suspended">Suspenso</SelectItem></SelectContent></Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">5. Prioridade</Label>
                            <Select value={formData.priority || 'Média'} onValueChange={value => handleChange('priority', value)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Alta">Alta</SelectItem><SelectItem value="Média">Média</SelectItem><SelectItem value="Baixa">Baixa</SelectItem></SelectContent></Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="title">6. Observação *</Label>
                        <Textarea id="title" value={formData.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Descreva o objetivo ou uma observação principal sobre o caso."/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave}>Salvar Caso</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// Modal para Gerar Documentos
const GenerateDocumentModal = ({ caseItem, isOpen, onClose }: { caseItem: Case, isOpen: boolean, onClose: () => void }) => {
    return (<Dialog open={isOpen} onOpenChange={onClose}><DialogContent>Gerar Documento</DialogContent></Dialog>);
};

// --- Módulo Principal ---
export function CasesModule({ initialFilters }: CasesModuleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialFilters?.status || "all");
  const [filterPriority, setFilterPriority] = useState("all");

  const [isDetailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isGenerateDocModalOpen, setGenerateDocModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const [selectedCase, setSelectedCase] = useState<Partial<Case> | null>(null);

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: () => apiClient.getCases(),
  });
  
  const saveCaseMutation = useMutation({
      mutationFn: (caseData: Partial<Case>) => {
          return caseData.id
            ? apiClient.updateCase(String(caseData.id), caseData)
            : apiClient.createCase(caseData);
      },
      onSuccess: () => {
          toast({ title: "Sucesso!", description: `Caso salvo com sucesso.` });
          queryClient.invalidateQueries({ queryKey: ['cases'] });
          setEditModalOpen(false);
      },
      onError: (error: any) => {
          toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      }
  });

  const handleOpenEditModal = (caseItem: Partial<Case> | null) => {
      setSelectedCase(caseItem);
      setEditModalOpen(true);
  };

  const handleSaveCase = (data: Partial<Case>) => {
      saveCaseMutation.mutate(data);
  };

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const searchMatch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === "all" || c.status === filterStatus;
      const priorityMatch = filterPriority === "all" || c.priority === filterPriority;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [cases, searchTerm, filterStatus, filterPriority]);
    
  const getStatusBadge = (status: string) => {
      const statusMap: { [key: string]: string } = {
          'active': 'bg-blue-100 text-blue-800',
          'completed': 'bg-green-100 text-green-800',
          'archived': 'bg-gray-100 text-gray-800',
      };
      return <Badge className={statusMap[status] || 'bg-slate-100'}>{status}</Badge>;
  };
  
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
          <Input placeholder="Buscar por título ou número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          <div className="flex gap-2">
            <Button onClick={() => setImportModalOpen(true)} variant="outline"><Upload className="mr-2 h-4 w-4" />Importar Casos</Button>
            <Button onClick={() => handleOpenEditModal(null)} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Processo / Título</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead><TableHead>Partes</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredCases.map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell>
                    <div className="font-medium">{caseItem.title}</div>
                    <div className="text-sm text-slate-500 font-mono">{caseItem.case_number || "-"}</div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(caseItem.priority)}</TableCell>
                  <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                  <TableCell>
                    {caseItem.case_parties.map(p => p.entities.name).join(', ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(caseItem)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCase(caseItem); setDetailModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedCase(caseItem); setGenerateDocModalOpen(true); }}><FileCog className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* --- Modais --- */}
      <CaseEditModal 
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        caseData={selectedCase}
        onSave={handleSaveCase}
      />
      
      <CaseImportModal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['cases'] })}
      />

      {selectedCase && (
        <GenerateDocumentModal
          caseItem={selectedCase as Case}
          isOpen={isGenerateDocModalOpen}
          onClose={() => setGenerateDocModalOpen(false)}
        />
      )}
      
       {selectedCase && (
        <Dialog open={isDetailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>{selectedCase.title}</DialogTitle>
                    <DialogDescription>{selectedCase.case_number}</DialogDescription>
                 </DialogHeader>
                 <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 max-h-[60vh] overflow-auto">
                    <code className="text-white">{JSON.stringify(selectedCase, null, 2)}</code>
                 </pre>
            </DialogContent>
        </Dialog>
       )}
    </div>
  );
}