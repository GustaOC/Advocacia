// components/entities-module.tsx - VERSÃO FINAL COM CORREÇÃO DEFINITIVA
"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, User, FolderOpen, ArrowLeft, Edit, Trash2, Loader2 } from "lucide-react";
import { ClientDetailView } from "./client-detail-view";
import { useToast } from "@/hooks/use-toast";
import { maskCPFCNPJ, maskPhone } from "@/lib/form-utils";

interface Client {
  id: string;
  name: string;
  document: string;
  type: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
}

export function EntitiesModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  const { data: clients = [], isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["entities"],
    queryFn: () => apiClient.getEntities(),
  });

  const saveMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => {
      return clientData.id
        ? apiClient.updateEntity(clientData.id, clientData)
        : apiClient.createEntity(clientData);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Cliente ${isEditMode ? 'atualizado' : 'salvo'} com sucesso.` });
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
        toast({ title: "Sucesso!", description: "Cliente excluído com sucesso." });
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
      setCurrentClient({});
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!currentClient.name || !currentClient.document) {
      toast({ title: "Campos obrigatórios", description: "Nome e Documento são obrigatórios.", variant: "destructive"});
      return;
    }
    
    // ✅ CORREÇÃO APLICADA AQUI:
    // Garante que o campo 'type' seja definido como 'Cliente' para novos cadastros,
    // que é um campo obrigatório (NOT NULL) no banco de dados.
    const dataToSave = {
      ...currentClient,
      type: currentClient.type || 'Cliente',
    };

    saveMutation.mutate(dataToSave);
  };
  
  const handleDelete = (clientId: string) => {
    if(confirm("Tem certeza que deseja excluir este cliente?")) {
        deleteMutation.mutate(clientId);
    }
  };

  const filteredClients = useMemo(() => clients.filter(client =>
    (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.document || "").toLowerCase().includes(searchTerm.toLowerCase())
  ), [clients, searchTerm]);

  if (isLoading) return <div>Carregando clientes...</div>;
  if (isError) return <div>Erro ao carregar clientes: {(error as Error).message}</div>;

  if (selectedClient) {
    return (
      <div>
        <Button variant="outline" onClick={() => setSelectedClient(null)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Lista de Clientes
        </Button>
        <ClientDetailView client={selectedClient} />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Gestão de Clientes</h2>
          <p className="text-slate-300 text-lg">Acesse a pasta virtual de cada cliente para ver processos e documentos.</p>
        </div>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 flex justify-between items-center">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Buscar por nome ou documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="h-11 bg-slate-800 hover:bg-slate-900">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} >
                    <TableCell className="font-medium cursor-pointer" onClick={() => setSelectedClient(client)}>{client.name}</TableCell>
                    <TableCell className="font-mono cursor-pointer" onClick={() => setSelectedClient(client)}>{client.document}</TableCell>
                    <TableCell className="cursor-pointer" onClick={() => setSelectedClient(client)}>{client.email}</TableCell>
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
      </div>
      
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card">
            <DialogHeader>
                <DialogTitle>{isEditMode ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
                <DialogDescription>Preencha os dados abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome Completo*</Label><Input value={currentClient.name || ''} onChange={e => setCurrentClient({...currentClient, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>CPF/CNPJ*</Label><Input value={currentClient.document || ''} onChange={e => setCurrentClient({...currentClient, document: maskCPFCNPJ(e.target.value)})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={currentClient.email || ''} onChange={e => setCurrentClient({...currentClient, email: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Telefone</Label><Input value={currentClient.phone || ''} onChange={e => setCurrentClient({...currentClient, phone: maskPhone(e.target.value)})} /></div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Endereço</Label><Input value={currentClient.address || ''} onChange={e => setCurrentClient({...currentClient, address: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Cidade</Label><Input value={currentClient.city || ''} onChange={e => setCurrentClient({...currentClient, city: e.target.value})} /></div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saveMutation.isPending}
                  className="bg-slate-800 text-white hover:bg-slate-900"
                >
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Salvar Cliente
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}