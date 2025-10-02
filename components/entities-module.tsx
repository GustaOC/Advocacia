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
import { Plus, Search, User, FolderOpen, Edit, Trash2, Loader2, Upload, FileUp, Users, Building2, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientDetailView } from "./client-detail-view";
import { useToast } from "@/hooks/use-toast";
import { maskCPFCNPJ, maskPhone, unmask } from "@/lib/form-utils";
import { Entity as Client } from "@/lib/types";

function onlyDigits(v: string | null | undefined) {
  return (v ?? "").replace(/\D+/g, "");
}

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
        district: input.district?.trim() || undefined,
        state: input.state?.trim() || undefined,
        zip_code: onlyDigits(input.zip_code),
        birth_date: input.birth_date || undefined,
        marital_status: input.marital_status || undefined,
        profession: input.profession?.trim() || undefined,
        rg: onlyDigits(input.rg),
    };
  Object.keys(payload).forEach((k) => {
    const key = k as keyof typeof payload;
    if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        delete payload[key];
    }
  });
  return payload;
}

function EntitiesStats({ clients, listType }: { clients: Client[], listType: string }) {
  const totalClientes = clients.filter(c => (c.type || 'Cliente') === 'Cliente').length;
  const totalExecutados = clients.filter(c => (c.type || 'Cliente') === 'Executado').length;
  
  const stats = [
    { label: "Total de Clientes", value: totalClientes.toString(), icon: Users, color: "text-blue-600", bg: "from-blue-50 to-blue-100", trend: "+12%" },
    { label: "Total de Executados", value: totalExecutados.toString(), icon: Building2, color: "text-red-600", bg: "from-red-50 to-red-100", trend: "+8%" },
    { label: "Cadastros Ativos", value: clients.length.toString(), icon: User, color: "text-green-600", bg: "from-green-50 to-green-100", trend: "+15%" },
    { label: "Novos este Mês", value: "23", icon: TrendingUp, color: "text-purple-600", bg: "from-purple-50 to-purple-100", trend: "+25%" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <StatIcon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
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
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
          <p className="text-slate-600 font-medium">Carregando cadastros...</p>
        </div>
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
        <div className="relative bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 rounded-3xl p-8 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-3">Gestão de Clientes e Partes</h2>
            <p className="text-emerald-100 text-xl">Acesse a pasta virtual de cada entidade para ver processos e documentos.</p>
          </div>
        </div>

        <EntitiesStats clients={clients} listType={listType} />

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por nome ou documento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-emerald-400 rounded-xl"
                />
              </div>
              <div className="w-48">
                <Select value={listType} onValueChange={(v) => setListType(v as 'Cliente' | 'Executado')}>
                  <SelectTrigger className="h-12 bg-white border-2 border-slate-200 rounded-xl">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Clientes</SelectItem>
                    <SelectItem value="Executado">Executados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button onClick={() => setImportModal({isOpen: true, type: 'Cliente'})} variant="outline" className="border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl">
                  <Upload className="mr-2 h-4 w-4" /> Importar Clientes
                </Button>
                <Button onClick={() => setImportModal({isOpen: true, type: 'Executado'})} variant="outline" className="border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-xl">
                  <FileUp className="mr-2 h-4 w-4" /> Importar Executados
                </Button>
                <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg rounded-xl">
                  <Plus className="mr-2 h-4 w-4" /> Novo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredClients.length > 0 ? (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                    <TableHead className="text-slate-700 font-bold">Nome</TableHead>
                    <TableHead className="text-slate-700 font-bold">Documento</TableHead>
                    <TableHead className="text-slate-700 font-bold">Tipo</TableHead>
                    <TableHead className="text-slate-700 font-bold">Cidade</TableHead>
                    <TableHead className="text-slate-700 font-bold">Telefone</TableHead>
                    <TableHead className="text-right text-slate-700 font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-transparent transition-all duration-200">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:scale-110 transition-transform">
                            <User className="h-4 w-4 text-emerald-600" />
                          </div>
                          <span className="group-hover:text-emerald-700 transition-colors">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{maskCPFCNPJ(client.document)}</TableCell>
                      <TableCell>
                        <Badge className={`${client.type === "Executado" ? "bg-gradient-to-r from-red-500 to-red-600" : "bg-gradient-to-r from-emerald-500 to-teal-600"} text-white border-0 shadow-lg`}>
                          {client.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{client.city || "-"}</TableCell>
                      <TableCell className="text-slate-600">{maskPhone(client.cellphone1 || client.phone || "") || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" onClick={() => handleView(client)} className="hover:bg-emerald-100 hover:text-emerald-700 rounded-lg">
                            <FolderOpen className="h-4 w-4 mr-1" /> Abrir
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(client)} className="hover:bg-blue-100 hover:text-blue-700 rounded-lg">
                            <Edit className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(client.id)} className="hover:bg-red-100 hover:text-red-700 rounded-lg">
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <User className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum registro encontrado</h3>
              <p className="text-slate-500">Nenhum {listType} encontrado com os filtros aplicados.</p>
            </CardContent>
          </Card>
        )}
      </div>

      
      <Dialog open={importModal.isOpen} onOpenChange={(o) => setImportModal((m) => ({...m, isOpen: o}))}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Importar {importModal.type === 'Executado' ? 'Executados' : 'Clientes'}</DialogTitle>
            <DialogDescription className="text-slate-600">Envie uma planilha .xlsx com as colunas esperadas (ex.: Nome Completo, Cpf, Email...).</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 font-semibold">Tipo</Label>
              <Select value={importModal.type} onValueChange={(v) => setImportModal((m) => ({...m, type: v as 'Cliente' | 'Executado'}))}>
                <SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cliente">Cliente</SelectItem>
                  <SelectItem value="Executado">Executado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 font-semibold">Arquivo (.xlsx)</Label>
              <Input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="bg-white border-2 border-slate-200 rounded-xl" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportModal((m)=>({...m, isOpen:false})); setFile(null); }} className="border-2 border-slate-200 rounded-xl">Cancelar</Button>
            <Button onClick={handleImport} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg rounded-xl"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


        <Dialog open={isFormOpen} onOpenChange={(o) => (o ? setIsFormOpen(true) : handleCloseModal())}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{isEditMode ? "Editar Cadastro" : "Novo Cadastro"}</DialogTitle>
            <DialogDescription className="text-slate-600">Preencha os dados da entidade. Campos com * são obrigatórios.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 font-semibold">Tipo *</Label>
                <Select
                  value={(currentClient.type as any) || listType}
                  onValueChange={(v) => setCurrentClient((c) => ({ ...c, type: v }))}
                >
                  <SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cliente">Cliente</SelectItem>
                    <SelectItem value="Executado">Executado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-700 font-semibold">Nome Completo *</Label>
                <Input value={currentClient.name || ""} onChange={(e) => handleInputChange('name', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold">CPF/CNPJ *</Label>
                <Input value={currentClient.document || ""} onChange={(e) => handleInputChange('document', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold">RG</Label>
                <Input value={currentClient.rg || ""} onChange={(e) => handleInputChange('rg', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
               <div>
                <Label className="text-slate-700 font-semibold">Data de Nascimento</Label>
                <Input type="date" value={currentClient.birth_date || ""} onChange={(e) => handleInputChange('birth_date', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-slate-700 font-semibold">Email</Label>
                <Input type="email" value={currentClient.email || ""} onChange={(e) => handleInputChange('email', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold">Telefone Celular</Label>
                <Input value={currentClient.cellphone1 || ""} onChange={(e) => handleInputChange('cellphone1', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
               <div>
                <Label className="text-slate-700 font-semibold">Estado Civil</Label>
                <Select value={currentClient.marital_status || ""} onValueChange={(v) => handleInputChange('marital_status', v)}>
                    <SelectTrigger className="bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                <Label className="text-slate-700 font-semibold">Profissão</Label>
                <Input value={currentClient.profession || ""} onChange={(e) => handleInputChange('profession', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
              <div>
                <Label className="text-slate-700 font-semibold">Nacionalidade</Label>
                <Input value={currentClient.nationality || ""} onChange={(e) => handleInputChange('nationality', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
            </div>

            <div className="space-y-4">
               <div>
                <Label className="text-slate-700 font-semibold">Endereço</Label>
                <Input value={currentClient.address || ""} onChange={(e) => handleInputChange('address', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-slate-700 font-semibold">Nº</Label>
                  <Input value={currentClient.address_number || ""} onChange={(e) => handleInputChange('address_number', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
                </div>
                 <div>
                  <Label className="text-slate-700 font-semibold">Bairro</Label>
                  <Input value={currentClient.district || ""} onChange={(e) => handleInputChange('district', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-slate-700 font-semibold">Cidade</Label>
                  <Input value={currentClient.city || ""} onChange={(e) => handleInputChange('city', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
                </div>
                <div>
                  <Label className="text-slate-700 font-semibold">Estado</Label>
                  <Input value={currentClient.state || ""} onChange={(e) => handleInputChange('state', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
                </div>
              </div>
               <div className="md:col-span-2">
                <Label className="text-slate-700 font-semibold">Observações</Label>
                <Input value={currentClient.observations || ""} onChange={(e) => handleInputChange('observations', e.target.value)} className="bg-white border-2 border-slate-200 rounded-xl" />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={handleCloseModal} className="border-2 border-slate-200 rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg rounded-xl">
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEditMode ? "Salvar Alterações" : "Criar Cadastro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}