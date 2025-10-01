// gustaoc/advocacia/Advocacia-dc2c3ca59752c81675b94fe13f5aec0c2ed506d0/components/entities-module.tsx
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
import { maskCPFCNPJ, maskPhone, unmask } from "@/lib/form-utils";
import { Entity as Client } from "@/lib/types"; // Importando a interface centralizada

function onlyDigits(v: string | null | undefined) {
  return (v ?? "").replace(/\D+/g, "");
}

// CORREÇÃO APLICADA AQUI
// A função cleanEntityPayload foi ajustada para garantir que o campo 'district' seja enviado corretamente.
function cleanEntityPayload(input: Partial<Client>): Partial<Client> {
    const payload: Partial<Client> = {
        id: input.id,
        name: (input.name ?? "").trim(),
        document: onlyDigits(input.document),
        type: (input.type as any) || "Cliente",
        email: input.email?.trim() || undefined,
        cellphone1: onlyDigits(input.cellphone1),
        city: input.city?.trim() || undefined,
        observations: input.observations?.trim() || undefined,
        address: input.address?.trim() || undefined,
        address_number: input.address_number?.trim() || undefined,
        district: input.district?.trim() || undefined, // Este é o campo correto a ser enviado
        state: input.state?.trim() || undefined,
        zip_code: onlyDigits(input.zip_code),
        birth_date: input.birth_date || undefined,
        marital_status: input.marital_status || undefined,
        profession: input.profession?.trim() || undefined,
        rg: onlyDigits(input.rg),
    };
  // remove keys undefined
  Object.keys(payload).forEach((k) => {
    const key = k as keyof typeof payload;
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        delete payload[key];
    }
  });
  return payload;
}

export default function EntitiesModule() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importModal, setImportModal] = useState<{ isOpen: boolean; type: "Cliente" | "Executado" }>({ isOpen: false, type: "Cliente" });
  const [file, setFile] = useState<File | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
  const [listType, setListType] = useState<'Cliente' | 'Executado'>('Cliente');
  const { toast } = useToast();

  async function handleImport() {
    try {
      if (!file) {
        toast({ title: "Selecione um arquivo", description: "Escolha uma planilha (.xlsx) para importar.", variant: "destructive" });
        return;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", importModal.type);

      const res = await fetch("/api/entities/import", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Falha na importação");
      }

      toast({ title: "Importação concluída", description: json?.message || "Dados importados com sucesso." });
      setImportModal({ isOpen: false, type: importModal.type });
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    } catch (err: any) {
      toast({ title: "Erro ao importar", description: err?.message ?? String(err), variant: "destructive" });
    }
  }


  const { data: clients = [], isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["entities"],
    queryFn: () => apiClient.getEntities(),
    staleTime: 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: async (clientData: Partial<Client>) => {
      const dataToSave = cleanEntityPayload(clientData);
      if (!dataToSave.name || !dataToSave.document) {
        throw new Error("Informe Nome e Documento válidos.");
      }
      return clientData.id
        ? apiClient.updateEntity(clientData.id, dataToSave)
        : apiClient.createEntity(dataToSave);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Cadastro ${isEditMode ? "atualizado" : "criado"} com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsEditMode(false);
      setIsFormOpen(false);
      setCurrentClient({});
    },
    onError: (err: any) => {
      toast({ title: "Dados inválidos", description: err?.message || "Não foi possível salvar o cadastro.", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (clientId: string) => apiClient.deleteEntity(clientId),
    onSuccess: () => {
      toast({ title: "Excluído", description: "Cadastro removido com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao excluir", description: err?.message || "Não foi possível excluir o cadastro.", variant: "destructive" });
    }
  });

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setIsEditMode(true);
      setCurrentClient(client);
    } else {
      setIsEditMode(false);
      setCurrentClient({ type: listType });
    }
    setIsFormOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditMode(false);
    setIsFormOpen(false);
    setCurrentClient({});
  };

  const handleSave = () => {
    saveMutation.mutate(currentClient as Client);
  };

  const handleView = (client: Client) => setSelectedClient(client);
  const handleEdit = (client: Client) => handleOpenModal(client);

  const handleDelete = (clientId: string) => {
    if (confirm("Tem certeza que deseja excluir este cadastro?")) {
      deleteMutation.mutate(clientId);
    }
  };
  
  const handleInputChange = (field: keyof Client, value: string) => {
    let finalValue = value;
    if (field === 'document') {
      finalValue = maskCPFCNPJ(value);
    } else if (field === 'cellphone1' || field === 'phone') {
        finalValue = maskPhone(value);
    }
    setCurrentClient(prev => ({ ...prev, [field]: finalValue }));
  };


  const filteredClients = useMemo(() => clients
      .filter(client => (client.type || 'Cliente') === listType)
      .filter(client =>
        (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.document || "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [clients, searchTerm, listType]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4 text-slate-600">Carregando...</span>
      </div>
    );
  }
  if (isError) return <div>Erro ao carregar dados: {(error as Error).message}</div>;

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
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por nome ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              <div className="w-48">
                <Select value={listType} onValueChange={(v) => setListType(v as 'Cliente' | 'Executado')}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Clientes</SelectItem>
                    <SelectItem value="Executado">Executados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setImportModal({isOpen: true, type: 'Cliente'})} variant="secondary">
                  <Upload className="mr-2 h-4 w-4" /> Importar Clientes
                </Button>
                <Button onClick={() => setImportModal({isOpen: true, type: 'Executado'})} variant="secondary">
                  <FileUp className="mr-2 h-4 w-4" /> Importar Executados
                </Button>
                <Button onClick={() => handleOpenModal()} className="bg-slate-900 hover:bg-slate-900">
                  <Plus className="mr-2 h-4 w-4" /> Novo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredClients.length > 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        {client.name}
                      </TableCell>
                      <TableCell>{maskCPFCNPJ(client.document)}</TableCell>
                      <TableCell>
                        <Badge variant={client.type === "Executado" ? "destructive" : "default"}>
                          {client.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.city || "-"}</TableCell>
                      <TableCell>{maskPhone(client.cellphone1 || client.phone || "") || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleView(client)}>
                          <FolderOpen className="h-4 w-4 mr-1" /> Abrir
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(client)}>
                          <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(client.id)}>
                          <Trash2 className="h-4 w-4 mr-1" /> Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-16 text-center text-slate-500">
              Nenhum registro encontrado para “{listType}”.
            </CardContent>
          </Card>
        )}
      </div>

      
      {/* Dialog de Importação */}
      <Dialog open={importModal.isOpen} onOpenChange={(o) => setImportModal((m) => ({...m, isOpen: o}))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar {importModal.type === 'Executado' ? 'Executados' : 'Clientes'}</DialogTitle>
            <DialogDescription>Envie uma planilha .xlsx com as colunas esperadas (ex.: Nome Completo, Cpf, Email...).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={importModal.type} onValueChange={(v) => setImportModal((m) => ({...m, type: v as 'Cliente' | 'Executado'}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Executado">Executado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Arquivo (.xlsx)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportModal((m)=>({...m, isOpen:false})); setFile(null); }}>Cancelar</Button>
            <Button onClick={handleImport}><Upload className="mr-2 h-4 w-4" /> Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


        <Dialog open={isFormOpen} onOpenChange={(o) => (o ? setIsFormOpen(true) : handleCloseModal())}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
            <DialogDescription>Preencha os dados da entidade. Campos com * são obrigatórios.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            {/* Coluna 1 */}
            <div className="space-y-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={(currentClient.type as any) || listType}
                  onValueChange={(v) => setCurrentClient((c) => ({ ...c, type: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Executado">Executado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome Completo *</Label>
                <Input value={currentClient.name || ""} onChange={(e) => handleInputChange('name', e.target.value)} />
              </div>
              <div>
                <Label>CPF/CNPJ *</Label>
                <Input value={currentClient.document || ""} onChange={(e) => handleInputChange('document', e.target.value)} />
              </div>
              <div>
                <Label>RG</Label>
                <Input value={currentClient.rg || ""} onChange={(e) => handleInputChange('rg', e.target.value)} />
              </div>
               <div>
                <Label>Data de Nascimento</Label>
                <Input type="date" value={currentClient.birth_date || ""} onChange={(e) => handleInputChange('birth_date', e.target.value)} />
              </div>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={currentClient.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} />
              </div>
              <div>
                <Label>Telefone Celular</Label>
                <Input value={currentClient.cellphone1 || ""} onChange={(e) => handleInputChange('cellphone1', e.target.value)} />
              </div>
               <div>
                <Label>Estado Civil</Label>
                <Select value={currentClient.marital_status || ""} onValueChange={(v) => handleInputChange('marital_status', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                        <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                        <SelectItem value="Divorciado(a)">Divorciado(a)</SelectItem>
                        <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                        <SelectItem value="União Estável">União Estável</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Profissão</Label>
                <Input value={currentClient.profession || ""} onChange={(e) => handleInputChange('profession', e.target.value)} />
              </div>
              <div>
                <Label>Nacionalidade</Label>
                <Input value={currentClient.nationality || ""} onChange={(e) => handleInputChange('nationality', e.target.value)} />
              </div>
            </div>

            {/* Coluna 3 */}
            <div className="space-y-4">
               <div>
                <Label>Endereço</Label>
                <Input value={currentClient.address || ""} onChange={(e) => handleInputChange('address', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Nº</Label>
                  <Input value={currentClient.address_number || ""} onChange={(e) => handleInputChange('address_number', e.target.value)} />
                </div>
                 <div>
                  <Label>Bairro</Label>
                  <Input value={currentClient.district || ""} onChange={(e) => handleInputChange('district', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cidade</Label>
                  <Input value={currentClient.city || ""} onChange={(e) => handleInputChange('city', e.target.value)} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={currentClient.state || ""} onChange={(e) => handleInputChange('state', e.target.value)} />
                </div>
              </div>
               <div className="md:col-span-2">
                <Label>Observações</Label>
                <Input value={currentClient.observations || ""} onChange={(e) => handleInputChange('observations', e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEditMode ? "Salvar Alterações" : "Criar Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}