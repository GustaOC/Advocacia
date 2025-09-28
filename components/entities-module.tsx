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
  type: string; // "Cliente" | "Executado"
  email?: string | null;
  social_name?: string | null;
  image_url?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  district?: string | null;
  city?: string | null;
  zip_code?: string | null;
  cellphone1?: string | null;
  cellphone2?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  birth_date?: string | null;
  rg?: string | null;
  cnh?: string | null;
  profession?: string | null;
  marital_status?: string | null;
  mother_name?: string | null;
  father_name?: string | null;
  nationality?: string | null;
  observations?: string | null;
}

export default function EntitiesModule() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [importModal, setImportModal] = useState<{ isOpen: boolean; type: "Cliente" | "Executado" }>({ isOpen: false, type: "Cliente" });
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<"Cliente" | "Executado">("Cliente");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
  // ✅ NOVO: seletor para escolher a listagem exibida
  const [listType, setListType] = useState<'Cliente' | 'Executado'>('Cliente');

  const { data: clients = [], isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["entities"],
    queryFn: () => apiClient.getEntities(),
  });

  const saveMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => {
      // se não vier type, usa "Cliente" por padrão
      const dataToSave = { ...clientData, type: clientData.type || 'Cliente' };
      return dataToSave.id
        ? apiClient.updateEntity(dataToSave.id, dataToSave)
        : apiClient.createEntity(dataToSave);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Cadastro ${isEditMode ? "atualizado" : "criado"} com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ["entities"] });
      setIsEditMode(false);
      setCurrentClient({});
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err?.message || "Não foi possível salvar o cadastro.", variant: "destructive" });
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

  const { toast } = useToast();

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setIsEditMode(true);
      setCurrentClient(client);
    } else {
      setIsEditMode(false);
      // quando criar novo, herdamos o listType atual
      setCurrentClient({ type: listType });
    }
  };

  const handleCloseModal = () => {
    setIsEditMode(false);
    setCurrentClient({});
  };

  const handleSave = () => {
    if (!currentClient.name || !currentClient.document) {
      toast({ title: "Dados incompletos", description: "Informe ao menos Nome e Documento (CPF/CNPJ).", variant: "destructive" });
      return;
    }
    saveMutation.mutate(currentClient as Client);
  };

  const handleView = (client: Client) => {
    setSelectedClient(client);
  };

  const handleEdit = (client: Client) => {
    handleOpenModal(client);
  };
  
  const handleDelete = (clientId: string) => {
    if(confirm("Tem certeza que deseja excluir este cadastro?")) {
        deleteMutation.mutate(clientId);
    }
  };

  // ✅ AJUSTE: filtra por listType (Clientes/Executados) e depois aplica a busca
  const filteredClients = useMemo(() => clients
      .filter(client => (client.type || 'Cliente') === listType)
      .filter(client =>
        (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.document || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    , [clients, searchTerm, listType]);

  if (isLoading) {
    return ( <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin" /><span className="ml-4 text-slate-600">Carregando...</span></div> );
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
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Busca */}
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por nome ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>

              {/* ✅ NOVO: seletor da listagem (Clientes x Executados) */}
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

              {/* Ações */}
              <div className="flex gap-2">
                {/* Importações em massa (cada uma abre com o tipo correspondente) */}
                <Button onClick={() => setImportModal({isOpen: true, type: 'Cliente'})} variant="secondary">
                  <Upload className="mr-2 h-4 w-4" /> Importar Clientes
                </Button>
                <Button onClick={() => setImportModal({isOpen: true, type: 'Executado'})} variant="secondary">
                  <Upload className="mr-2 h-4 w-4" /> Importar Executados
                </Button>
                {/* Novo cadastro já herda o tipo da listagem selecionada */}
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

      {/* Dialog de criação/edição */}
      <Dialog open={isEditMode} onOpenChange={(o) => !o ? handleCloseModal() : null}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
            <DialogDescription>Preencha os dados da entidade.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo (Cliente/Executado) */}
            <div className="col-span-1">
              <Label>Tipo</Label>
              <Select
                value={(currentClient.type as any) || listType}
                onValueChange={(v) => setCurrentClient((c) => ({ ...c, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Executado">Executado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome</Label>
              <Input value={currentClient.name || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, name: e.target.value }))} />
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={currentClient.document || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, document: e.target.value }))} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={currentClient.email || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, email: e.target.value }))} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={currentClient.cellphone1 || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, cellphone1: e.target.value }))} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={currentClient.city || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, city: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Input value={currentClient.observations || ""} onChange={(e) => setCurrentClient((c) => ({ ...c, observations: e.target.value }))} />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Importação em Massa */}
      <Dialog open={importModal.isOpen} onOpenChange={(o) => setImportModal((s) => ({ ...s, isOpen: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar {importModal.type}s em Massa</DialogTitle>
            <DialogDescription>
              Envie uma planilha com as colunas: "Nome", "Documento", "E-mail", "Telefone", "Cidade", etc. O tipo será definido como “{importModal.type}”.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModal({ isOpen: false, type: importModal.type })}>Cancelar</Button>
            <Button
              onClick={async () => {
                if (!file) {
                  toast({ title: "Nenhum arquivo", description: "Selecione um arquivo para importar.", variant: "destructive" });
                  return;
                }
                try {
                  // Se sua API de importação existir, chame aqui passando importModal.type.
                  // await apiClient.importEntities(file, importModal.type)
                  toast({ title: "Importação iniciada", description: "Processaremos seu arquivo em segundo plano." });
                  setImportModal({ isOpen: false, type: importModal.type });
                } catch (err: any) {
                  toast({ title: "Erro na importação", description: err?.message || "Falha ao importar.", variant: "destructive" });
                }
              }}
            >
              <FileUp className="mr-2 h-4 w-4" /> Importar {importModal.type}s
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
