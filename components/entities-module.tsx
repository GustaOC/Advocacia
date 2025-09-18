// components/entities-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Edit, Trash2, Eye, Loader2, Users } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface Entity {
  id: number;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  status?: string; // Status pode não vir sempre da API, mas é bom ter
  // Outros campos podem ser adicionados aqui
}

export function EntitiesModule() {
  const { toast } = useToast();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEntity, setCurrentEntity] = useState<Partial<Entity>>({});

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
    setCurrentEntity({ name: '', document: '', email: '', phone: '' });
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

  const filteredEntities = useMemo(() =>
    entities.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.document?.includes(searchTerm)
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
          <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Nova Entidade</Button>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{isEditMode ? "Editar Entidade" : "Criar Nova Entidade"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={currentEntity.name || ''} onChange={e => setCurrentEntity({...currentEntity, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="document">CPF/CNPJ</Label>
              <Input id="document" value={currentEntity.document || ''} onChange={e => setCurrentEntity({...currentEntity, document: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={currentEntity.email || ''} onChange={e => setCurrentEntity({...currentEntity, email: e.target.value})} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={currentEntity.phone || ''} onChange={e => setCurrentEntity({...currentEntity, phone: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar Alterações" : "Criar Entidade"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}