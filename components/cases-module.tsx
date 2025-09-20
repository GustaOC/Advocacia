// components/cases-module.tsx - VERSÃO FINAL CORRIGIDA
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Briefcase, Filter, FileCog, Upload, FileUp, AlertTriangle, Clock, LayoutGrid, List, DollarSign, Archive } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FinancialAgreementModal } from "./financial-agreement-modal";

// --- Tipagens ---
interface Entity { id: number; name: string; }
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
interface CaseHistoryEvent {
    id: number;
    changed_at: string;
    changed_by_user_email: string;
    new_main_status: string;
    new_status_reason: string | null;
    notes: string | null;
}
interface CasesModuleProps { initialFilters?: { status: string }; }

type AutomationAction = {
    type: 'create-financial' | 'archive-documents';
    caseData: Case;
} | null;


// --- Componentes de Modal ---
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
            main_status: 'Em andamento',
            title: '',
            case_number: '',
        };
        setFormData(isCreating ? initialData : caseData!);
    }, [caseData, isOpen]);

    const handleChange = (field: keyof Case, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.title || (!formData.id && (!formData.client_entity_id || !formData.executed_entity_id))) {
            toast({ title: "Campos obrigatórios", description: "Cliente, Executado e Observação são obrigatórios para novos casos.", variant: "destructive"});
            return;
        }
        onSave(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{caseData?.id ? "Editar Caso" : "Novo Caso"}</DialogTitle>
                    <DialogDescription>Preencha os dados para criar um novo processo.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                    {!caseData?.id && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="client_entity_id">1. Cliente *</Label>
                                <Select value={String(formData.client_entity_id || '')} onValueChange={value => handleChange('client_entity_id', Number(value))}>
                                    <SelectTrigger disabled={isLoadingEntities}><SelectValue placeholder={isLoadingEntities ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger>
                                    <SelectContent>{entities.map(entity => (<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="executed_entity_id">3. Executado (Parte Contrária) *</Label>
                                <Select value={String(formData.executed_entity_id || '')} onValueChange={value => handleChange('executed_entity_id', Number(value))}>
                                    <SelectTrigger disabled={isLoadingEntities}><SelectValue placeholder={isLoadingEntities ? "Carregando..." : "Selecione o executado"} /></SelectTrigger>
                                    <SelectContent>{entities.map(entity => (<SelectItem key={entity.id} value={String(entity.id)}>{entity.name}</SelectItem>))}</SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="case_number">2. Número do Processo</Label>
                        <Input id="case_number" value={formData.case_number || ''} onChange={e => handleChange('case_number', e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="main_status">4. Status Principal</Label>
                            <Select value={formData.main_status || 'Em andamento'} onValueChange={value => handleChange('main_status', value)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Acordo">Acordo</SelectItem>
                                    <SelectItem value="Extinto">Extinto</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="priority">5. Prioridade</Label>
                            <Select value={formData.priority || 'Média'} onValueChange={value => handleChange('priority', value)}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Alta">Alta</SelectItem>
                                    <SelectItem value="Média">Média</SelectItem>
                                    <SelectItem value="Baixa">Baixa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {formData.main_status === 'Extinto' && (
                        <div className="space-y-2">
                            <Label htmlFor="status_reason">Motivo da Extinção</Label>
                            <Select value={formData.status_reason || ''} onValueChange={value => handleChange('status_reason', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione o motivo"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Falta de citação">Falta de citação</SelectItem>
                                    <SelectItem value="Penhora infrutífera">Penhora infrutífera</SelectItem>
                                    <SelectItem value="Abandono de causa">Abandono de causa</SelectItem>
                                    <SelectItem value="Outro">Outro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {formData.main_status === 'Acordo' && (
                        <div className="space-y-2">
                            <Label htmlFor="status_reason">Tipo de Acordo</Label>
                            <Select value={formData.status_reason || ''} onValueChange={value => handleChange('status_reason', value)}>
                                <SelectTrigger><SelectValue placeholder="Selecione o tipo de acordo"/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Judicial">Judicial</SelectItem>
                                    <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                                    <SelectItem value="Em Audiência">Em Audiência</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {formData.main_status === 'Pago' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="payment_date">Data do Pagamento</Label>
                                <Input id="payment_date" type="date" value={formData.payment_date || ''} onChange={e => handleChange('payment_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="final_value">Valor Final</Label>
                                <Input id="final_value" type="number" value={formData.final_value || ''} onChange={e => handleChange('final_value', Number(e.target.value))} />
                            </div>
                        </div>
                    )}
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

const CaseDetailModal = ({ caseItem, isOpen, onClose }: { caseItem: Case | null, isOpen: boolean, onClose: () => void }) => {
    const { data: history = [], isLoading } = useQuery<CaseHistoryEvent[]>({
        queryKey: ['caseHistory', caseItem?.id],
        queryFn: async () => {
            if (!caseItem) return [];
            const response = await fetch(`/api/cases/${caseItem.id}/history`);
            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }
            return response.json();
        },
        enabled: !!caseItem,
    });

    if (!caseItem) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>{caseItem.title}</DialogTitle>
                    <DialogDescription>{caseItem.case_number}</DialogDescription>
                 </DialogHeader>
                 <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="details">Detalhes</TabsTrigger><TabsTrigger value="timeline">Timeline</TabsTrigger></TabsList>
                    <TabsContent value="details" className="pt-4"><pre className="mt-2 w-full rounded-md bg-slate-950 p-4 max-h-[60vh] overflow-auto"><code className="text-white">{JSON.stringify(caseItem, null, 2)}</code></pre></TabsContent>
                    <TabsContent value="timeline" className="pt-4 max-h-[60vh] overflow-y-auto">
                        {isLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : (
                            <div className="space-y-6 border-l-2 border-slate-200 ml-2 pl-6">
                                {history.map(event => (
                                    <div key={event.id} className="relative">
                                        <div className="absolute -left-[35px] top-1 h-5 w-5 bg-blue-500 rounded-full border-4 border-white"></div>
                                        <p className="font-medium text-slate-800">
                                            Status alterado para <Badge variant="secondary">{event.new_main_status}</Badge>
                                            {event.new_status_reason && ` (${event.new_status_reason})`}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {format(new Date(event.changed_at), "dd 'de' MMMM 'de' yyyy, 'às' HH:mm", { locale: ptBR })}
                                        </p>
                                        <p className="text-xs text-slate-400">por {event.changed_by_user_email}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                 </Tabs>
            </DialogContent>
        </Dialog>
    );
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
  const [isImportModalOpen, setImportModalOpen] = useState(false);
  const [isFinancialModalOpen, setFinancialModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Partial<Case> | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [automationAction, setAutomationAction] = useState<AutomationAction>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => apiClient.getCases(),
  });
  
  const cases: Case[] = data?.cases ?? [];
  
  const saveCaseMutation = useMutation<Case, Error, Partial<Case>>({
    mutationFn: (caseData) => {
        return caseData.id
            ? apiClient.updateCase(String(caseData.id), caseData)
            : apiClient.createCase(caseData);
    },
    onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ['cases'] });
        setEditModalOpen(false);
        toast({ title: "Sucesso!", description: `Caso salvo com sucesso.` });

        if (data.main_status === 'Acordo') {
            setAutomationAction({ type: 'create-financial', caseData: data });
        } else if (data.main_status === 'Extinto') {
            setAutomationAction({ type: 'archive-documents', caseData: data });
        }
    },
    onError: (error: any) => {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (caseId: string) => apiClient.archiveCaseDocuments(caseId),
    onSuccess: () => {
        toast({
            title: "Ação Concluída",
            description: "Os documentos do caso foram arquivados com sucesso."
        });
    },
    onError: (error: any) => {
        toast({ title: "Erro ao arquivar", description: error.message, variant: "destructive" });
    },
    onSettled: () => {
        setAutomationAction(null);
    }
  });


  const handleOpenEditModal = (caseItem: Partial<Case> | null) => {
      setSelectedCase(caseItem);
      setEditModalOpen(true);
  };

  const handleOpenDetailModal = (caseItem: Case) => {
    setSelectedCase(caseItem);
    setDetailModalOpen(true);
  };

  const handleSaveCase = (data: Partial<Case>) => {
      saveCaseMutation.mutate(data);
  };
  
  const handleConfirmFinancialAction = () => {
    setAutomationAction(null);
    setFinancialModalOpen(true);
  }
  
  const handleConfirmArchiveAction = () => {
      if (automationAction?.caseData.id) {
          archiveMutation.mutate(String(automationAction.caseData.id));
      }
  }

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    return cases.filter(c => {
      const searchMatch = (c.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.case_number || "").toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = filterStatus === "all" || c.main_status === filterStatus;
      const priorityMatch = filterPriority === "all" || c.priority === filterPriority;
      return searchMatch && statusMatch && priorityMatch;
    });
  }, [cases, searchTerm, filterStatus, filterPriority]);

  const getStatusBadge = (status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago') => {
      const statusMap: { [key: string]: string } = {
          'Em andamento': 'bg-blue-100 text-blue-800',
          'Acordo': 'bg-yellow-100 text-yellow-800',
          'Extinto': 'bg-red-100 text-red-800',
          'Pago': 'bg-green-100 text-green-800',
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
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, caseItem: Case) => {
        e.dataTransfer.setData("caseId", String(caseItem.id));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: Case['main_status']) => {
        const caseId = e.dataTransfer.getData("caseId");
        const caseToUpdate = cases.find(c => c.id === Number(caseId));
        if (caseToUpdate && caseToUpdate.main_status !== newStatus) {
            saveCaseMutation.mutate({ ...caseToUpdate, main_status: newStatus });
        }
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
          <div className="flex gap-2">
            <Input placeholder="Buscar por título ou número..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
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
          <div className="flex gap-2 items-center">
             <div className="flex items-center gap-2">
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                <Button variant={viewMode === 'kanban' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('kanban')}><LayoutGrid className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => setImportModalOpen(true)} variant="outline"><Upload className="mr-2 h-4 w-4" />Importar Casos</Button>
            <Button onClick={() => handleOpenEditModal(null)} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Caso</Button>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'list' && (
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
                  <TableCell>
                    <div className="flex flex-col items-start">
                        {getStatusBadge(caseItem.main_status)}
                        {caseItem.status_reason && <span className="text-xs text-slate-500 mt-1">{caseItem.status_reason}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    {caseItem.case_parties.map(p => p.entities.name).join(', ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(caseItem)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDetailModal(caseItem)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(['Em andamento', 'Acordo', 'Extinto', 'Pago'] as const).map(status => (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
              className="bg-slate-100 rounded-lg p-4 space-y-4 min-h-[400px]"
            >
              <h3 className="font-semibold text-slate-800 text-lg px-2">{status}</h3>
              {filteredCases
                .filter(c => c.main_status === status)
                .map(caseItem => (
                  <div
                    key={caseItem.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, caseItem)}
                    className="cursor-move"
                  >
                    <Card className="bg-white hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <p className="font-semibold text-slate-900">{caseItem.title}</p>
                        <p className="text-sm text-slate-500 font-mono mt-2">{caseItem.case_number}</p>
                        <div className="mt-4 flex justify-between items-center">
                          {getPriorityBadge(caseItem.priority)}
                          <Button size="sm" variant="ghost" onClick={() => handleOpenDetailModal(caseItem)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}


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
       <CaseDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setDetailModalOpen(false)} 
        caseItem={selectedCase as Case} 
       />

       <FinancialAgreementModal
        isOpen={isFinancialModalOpen}
        onClose={() => setFinancialModalOpen(false)}
        caseData={automationAction?.type === 'create-financial' ? automationAction.caseData : null}
       />

        {/* --- Automation Modals --- */}
        <AlertDialog open={automationAction?.type === 'create-financial'} onOpenChange={() => setAutomationAction(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><DollarSign className="mr-2 h-5 w-5 text-green-600" />Ação Sugerida: Lançamento Financeiro</AlertDialogTitle>
                    <AlertDialogDescription>
                        O status do caso foi alterado para "Acordo". Deseja criar um novo lançamento no Módulo Financeiro para este acordo?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Depois</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmFinancialAction}>Sim, criar lançamento</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={automationAction?.type === 'archive-documents'} onOpenChange={() => setAutomationAction(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center"><Archive className="mr-2 h-5 w-5 text-gray-600" />Ação Sugerida: Arquivar Documentos</AlertDialogTitle>
                    <AlertDialogDescription>
                        O status do caso foi alterado para "Extinto". Deseja arquivar todos os documentos digitais vinculados a este caso para liberar espaço e organizar o sistema?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Depois</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirmArchiveAction}
                        disabled={archiveMutation.isPending}
                    >
                        {archiveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sim, arquivar tudo
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}