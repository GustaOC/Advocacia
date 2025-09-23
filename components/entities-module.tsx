// components/entities-module.tsx 
"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User, FolderOpen, Edit, Trash2, Loader2, Upload, FileUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetailView } from "./client-detail-view";
import { useToast } from "@/hooks/use-toast";
import { maskCPFCNPJ, maskPhone } from "@/lib/form-utils";

// --- Tipagem Atualizada com todos os campos ---
interface Client {
  id: string;
  name: string;
  document: string; // Cpf
  type: string;
  email?: string | null;
  // Endereço
  address?: string | null;
  address_number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  zip_code?: string | null; // Cep
  // Contato
  phone?: string | null;   // Celular 1
  phone2?: string | null;  // Celular 2
}

// Modal de Importação REUTILIZÁVEL (com descrição atualizada)
const ImportModal = ({ isOpen, onClose, onImportSuccess, importType }: { isOpen: boolean; onClose: () => void; onImportSuccess: () => void; importType: 'Cliente' | 'Executado' }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const { toast } = useToast();

    const title = `Importar ${importType}s em Massa`;
    const description = `Envie uma planilha com as colunas: "Nome Completo", "Cpf", "Endereço", "Nº", "Bairro", "Cidade", "Cep", "Celular 1", "Celular 2".`;

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
        formData.append('type', importType);

        try {
            const response = await fetch('/api/entities/import', { method: 'POST', body: formData });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Falha na importação.");
            }

            toast({
                title: "Importação Concluída!",
                description: `${result.successCount} ${importType.toLowerCase()}s importados. ${result.errorCount > 0 ? `${result.errorCount} linhas com erros.` : ''}`
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
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Label htmlFor="import-file">Arquivo de Planilha</Label>
                    <Input id="import-file" type="file" onChange={handleFileChange} accept=".xlsx, .csv" />
                    <a href="/modelo-importacao.xlsx" download className="text-sm text-blue-600 hover:underline">
                        Baixar modelo de planilha (.xlsx)
                    </a>
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

export function EntitiesModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [importModal, setImportModal] = useState<{isOpen: boolean; type: 'Cliente' | 'Executado'}>({isOpen: false, type: 'Cliente'});
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  const { data: clients = [], isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["entities"],
    queryFn: () => apiClient.getEntities(),
  });

  const saveMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => {
      const dataToSave = { ...clientData, type: clientData.type || 'Cliente' };
      return dataToSave.id
        ? apiClient.updateEntity(dataToSave.id, dataToSave)
        : apiClient.createEntity(dataToSave);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Cadastro ${isEditMode ? 'atualizado' : 'salvo'} com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ['entities'] });
      setModalOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.deleteEntity(clientId),
    onSuccess: () => {
        toast({ title: "Sucesso!", description: "Cadastro excluído com sucesso." });
        queryClient.invalidateQueries({ queryKey: ['entities'] });
    },
    onError: (error: any) => {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const handleOpenModal = (client: Partial<Client> | null = null) => {
    if (client) {
      setIsEditMode(true);
      setCurrentClient(client);
    } else {
      setIsEditMode(false);
      setCurrentClient({ type: 'Cliente' }); // Define um tipo padrão ao criar
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!currentClient.name || !currentClient.document) {
      toast({ title: "Campos obrigatórios", description: "Nome Completo e CPF/CNPJ são obrigatórios.", variant: "destructive"});
      return;
    }
    saveMutation.mutate(currentClient);
  };
  
  const handleDelete = (clientId: string) => {
    if(confirm("Tem certeza que deseja excluir este cadastro?")) {
        deleteMutation.mutate(clientId);
    }
  };

  const filteredClients = useMemo(() => clients.filter(client =>
    (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.document || "").toLowerCase().includes(searchTerm.toLowerCase())
  ), [clients, searchTerm]);

  if (isLoading) {
    return ( <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /><span className="ml-4 text-slate-600">Carregando...</span></div> );
  }
  if (isError) return <div>Erro ao carregar dados: {(error as Error).message}</div>;

  // ✅ CORREÇÃO: Lógica de renderização ajustada para passar a função onBack.
  if (selectedClient) {
    return (
      <ClientDetailView 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)} 
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Gestão de Clientes e Partes</h2>
          <p className="text-slate-300 text-lg">Acesse a pasta virtual de cada entidade para ver processos e documentos.</p>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input placeholder="Buscar por nome ou documento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11" />
            </div>
             <div className="flex gap-2">
                <Button onClick={() => setImportModal({isOpen: true, type: 'Cliente'})} variant="outline" className="h-11"><Upload className="mr-2 h-4 w-4" /> Importar Clientes</Button>
                <Button onClick={() => setImportModal({isOpen: true, type: 'Executado'})} variant="outline" className="h-11"><Upload className="mr-2 h-4 w-4" /> Importar Executados</Button>
                <Button onClick={() => handleOpenModal()} className="h-11 bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo</Button>
            </div>
          </CardContent>
        </Card>
        
        {filteredClients.length > 0 ? (
            <Card className="border-0 shadow-lg">
            <CardContent>
                <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Tipo</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {filteredClients.map((client) => (
                    <TableRow key={client.id} >
                        <TableCell className="font-medium cursor-pointer hover:text-blue-600" onClick={() => setSelectedClient(client)}>{client.name}</TableCell>
                        <TableCell className="font-mono cursor-pointer" onClick={() => setSelectedClient(client)}>{client.document}</TableCell>
                        <TableCell><Badge variant={client.type === 'Cliente' ? 'default' : 'secondary'}>{client.type}</Badge></TableCell>
                        <TableCell className="cursor-pointer" onClick={() => setSelectedClient(client)}>{client.email || '-'}</TableCell>
                        <TableCell className="cursor-pointer" onClick={() => setSelectedClient(client)}>{client.phone || '-'}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => setSelectedClient(client)}><FolderOpen className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenModal(client)}><Edit className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>
            </Card>
        ) : (
            <Card className="border-0 shadow-lg"><CardContent className="text-center py-20 text-slate-500"><User className="h-12 w-12 mx-auto mb-4 text-slate-400"/><h3 className="text-xl font-semibold text-slate-800">Nenhum cadastro encontrado</h3><p className="mt-2">Use a busca para refinar ou adicione um novo cadastro.</p></CardContent></Card>
        )}
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-card">
            <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
                <DialogDescription>Preencha os dados abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome Completo*</Label><Input value={currentClient.name || ''} onChange={e => setCurrentClient({...currentClient, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>CPF/CNPJ*</Label><Input value={currentClient.document || ''} onChange={e => setCurrentClient({...currentClient, document: maskCPFCNPJ(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-8 space-y-2"><Label>Endereço</Label><Input value={currentClient.address || ''} onChange={e => setCurrentClient({...currentClient, address: e.target.value})} /></div>
                    <div className="col-span-4 space-y-2"><Label>N.º</Label><Input value={currentClient.address_number || ''} onChange={e => setCurrentClient({...currentClient, address_number: e.target.value})} /></div>
                </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Bairro</Label><Input value={currentClient.neighborhood || ''} onChange={e => setCurrentClient({...currentClient, neighborhood: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Cidade</Label><Input value={currentClient.city || ''} onChange={e => setCurrentClient({...currentClient, city: e.target.value})} /></div>
                    <div className="space-y-2"><Label>CEP</Label><Input value={currentClient.zip_code || ''} onChange={e => setCurrentClient({...currentClient, zip_code: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Celular 1</Label><Input value={currentClient.phone || ''} onChange={e => setCurrentClient({...currentClient, phone: maskPhone(e.target.value)})} /></div>
                    <div className="space-y-2"><Label>Celular 2</Label><Input value={currentClient.phone2 || ''} onChange={e => setCurrentClient({...currentClient, phone2: maskPhone(e.target.value)})} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({...currentClient, email: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Tipo de Cadastro</Label>
                        <Select value={currentClient.type || 'Cliente'} onValueChange={(value: 'Cliente' | 'Executado') => setCurrentClient(prev => ({...prev, type: value}))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cliente">Cliente</SelectItem>
                                <SelectItem value="Executado">Executado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-slate-800 text-white hover:bg-slate-900">
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ImportModal 
        isOpen={importModal.isOpen} 
        importType={importModal.type}
        onClose={() => setImportModal({isOpen: false, type: 'Cliente'})} 
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['entities'] })}
      />
    </>
  );
}