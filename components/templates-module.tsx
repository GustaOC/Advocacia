// components/templates-module.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Loader2, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface Template {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  content: string;
  created_at: string;
}

export function TemplatesModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { can } = useAuth();

  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<Partial<Template>>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Busca os templates usando React Query
  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: apiClient.getTemplates,
  });

  // Mutação para criar ou atualizar um template
  const saveTemplateMutation = useMutation({
    mutationFn: (templateData: Partial<Template>) => {
      if (isEditMode) {
        return apiClient.updateTemplate(templateData.id!, templateData);
      }
      return apiClient.createTemplate(templateData);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Modelo ${isEditMode ? 'atualizado' : 'criado'} com sucesso.` });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setModalOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  // Mutação para deletar um template
  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: number) => apiClient.deleteTemplate(templateId),
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Modelo excluído." });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const openModalForCreate = () => {
    setIsEditMode(false);
    setCurrentTemplate({ title: "", description: "", category: "", content: "" });
    setModalOpen(true);
  };

  const openModalForEdit = (template: Template) => {
    setIsEditMode(true);
    setCurrentTemplate(template);
    setModalOpen(true);
  };

  const handleSave = () => {
    saveTemplateMutation.mutate(currentTemplate);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este modelo? Esta ação não pode ser desfeita.")) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const filteredTemplates = useMemo(() =>
    templates.filter(t =>
      (t.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [templates, searchTerm]
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
        <h2 className="text-3xl font-bold mb-2">Modelos de Documentos</h2>
        <p className="text-slate-300 text-lg">Crie e gerencie templates para automatizar a geração de documentos.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <Input placeholder="Buscar por título, categoria ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          {can('templates_create') && (
            <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Modelo</Button>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredTemplates.map(template => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.title}</TableCell>
                  <TableCell>{template.category || '-'}</TableCell>
                  <TableCell className="text-sm text-slate-600">{template.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    {can('templates_edit') && <Button variant="ghost" size="icon" onClick={() => openModalForEdit(template)}><Edit className="h-4 w-4" /></Button>}
                    {can('templates_delete') && <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl bg-card">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Modelo" : "Criar Novo Modelo de Documento"}</DialogTitle>
            <CardDescription>Use variáveis como {{`{{cliente.nome}}`}}, {{`{{cliente.cpf}}`}}, {{`{{processo.numero}}`}} no conteúdo.</CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="title">Título *</Label><Input id="title" value={currentTemplate.title || ''} onChange={e => setCurrentTemplate({...currentTemplate, title: e.target.value})} /></div>
              <div className="space-y-2"><Label htmlFor="category">Categoria</Label><Input id="category" value={currentTemplate.category || ''} onChange={e => setCurrentTemplate({...currentTemplate, category: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" value={currentTemplate.description || ''} onChange={e => setCurrentTemplate({...currentTemplate, description: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="content">Conteúdo do Modelo *</Label><Textarea id="content" value={currentTemplate.content || ''} onChange={e => setCurrentTemplate({...currentTemplate, content: e.target.value})} className="min-h-[300px] font-mono text-sm" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveTemplateMutation.isPending}>
              {saveTemplateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Salvar Alterações" : "Criar Modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}