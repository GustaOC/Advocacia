// components/entities-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Loader2, Upload } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface Entity {
  id: number;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  neighborhood: string | null;
  zip_code: string | null;
  city: string | null;
  state: string | null;
}

export function EntitiesModule() {
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<Partial<Entity>>({});
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  const loadEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getEntities();
      setEntities(data);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar entidades",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const openModalForCreate = () => {
    setIsEditMode(false);
    setCurrentEntity({});
    setModalOpen(true);
  };

  const openModalForEdit = (entity: Entity) => {
    setIsEditMode(true);
    setCurrentEntity(entity);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
        if (isEditMode) {
            await apiClient.updateEntity(String(currentEntity.id!), currentEntity);
            toast({ title: "Sucesso!", description: "Entidade atualizada." });
        } else {
            await apiClient.createEntity(currentEntity);
            toast({ title: "Sucesso!", description: "Nova entidade criada." });
        }
        setModalOpen(false);
        loadEntities();
        } catch (error: any) {
        toast({
            title: "Erro ao salvar",
            description: error.message,
            variant: "destructive",
        });
        }
  };
  
  const handleDelete = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta entidade?")) {
        try {
        await apiClient.deleteEntity(String(id));
        toast({ title: "Sucesso!", description: "Entidade excluída." });
        loadEntities();
        } catch (error: any) {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
        }
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

        const newEntities = worksheet.map(row => ({
          name: row.nome,
          document: row.cpf,
          phone: row.telefone,
          address: row.endereço,
          neighborhood: row.bairro,
          zip_code: row.cep,
          city: row.cidade,
          state: row.estado,
        }));

        for (const entity of newEntities) {
          await apiClient.createEntity(entity);
        }

        toast({ title: "Sucesso!", description: `${newEntities.length} entidades importadas.` });
        loadEntities();
        setImportModalOpen(false);
      } catch (error: any) {
        toast({ title: "Erro de Importação", description: error.message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };


  const filteredEntities = useMemo(() =>
    entities.filter(e =>
      (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.document || "").includes(searchTerm)
    ),
    [entities, searchTerm]
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Entidades</h2>
        <p className="text-slate-300 text-lg">Centralize clientes, partes contrárias e outros contatos.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <Input placeholder="Buscar por nome, email ou documento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          <div className="flex gap-2">
            <Button onClick={() => setImportModalOpen(true)} variant="outline"><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Nova Entidade</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Documento</TableHead><TableHead>Email</TableHead><TableHead>Telefone</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredEntities.map(entity => (
                <TableRow key={entity.id}>
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell className="font-mono text-sm">{entity.document || '-'}</TableCell>
                  <TableCell>{entity.email || '-'}</TableCell>
                  <TableCell>{entity.phone || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModalForEdit(entity)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(entity.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Criação/Edição */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        {/* ✅ CORREÇÃO APLICADA AQUI: Adicionada a classe bg-card */}
        <DialogContent className="sm:max-w-2xl bg-card">
          <DialogHeader><DialogTitle>{isEditMode ? "Editar Entidade" : "Criar Nova Entidade"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label htmlFor="name">Nome *</Label><Input id="name" value={currentEntity.name || ''} onChange={e => setCurrentEntity({...currentEntity, name: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="document">CPF/CNPJ</Label><Input id="document" value={currentEntity.document || ''} onChange={e => setCurrentEntity({...currentEntity, document: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={currentEntity.phone || ''} onChange={e => setCurrentEntity({...currentEntity, phone: e.target.value})} /></div>
            <div className="col-span-2 space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={currentEntity.email || ''} onChange={e => setCurrentEntity({...currentEntity, email: e.target.value})} /></div>
            <div className="col-span-2 space-y-2"><Label htmlFor="address">Endereço</Label><Input id="address" value={currentEntity.address || ''} onChange={e => setCurrentEntity({...currentEntity, address: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="neighborhood">Bairro</Label><Input id="neighborhood" value={currentEntity.neighborhood || ''} onChange={e => setCurrentEntity({...currentEntity, neighborhood: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="zip_code">CEP</Label><Input id="zip_code" value={currentEntity.zip_code || ''} onChange={e => setCurrentEntity({...currentEntity, zip_code: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="city">Cidade</Label><Input id="city" value={currentEntity.city || ''} onChange={e => setCurrentEntity({...currentEntity, city: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="state">Estado</Label><Input id="state" value={currentEntity.state || ''} onChange={e => setCurrentEntity({...currentEntity, state: e.target.value})} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar Alterações" : "Criar Entidade"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Importação */}
      <Dialog open={isImportModalOpen} onOpenChange={setImportModalOpen}>
        {/* ✅ CORREÇÃO APLICADA AQUI: Adicionada a classe bg-card */}
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Importar Entidades via Excel</DialogTitle>
            <DialogDescription>
              Selecione um arquivo .xlsx ou .csv. A primeira linha deve conter os cabeçalhos: nome, cpf, telefone, endereço, bairro, cep, cidade, estado.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" accept=".xlsx, .csv" onChange={handleFileImport} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}