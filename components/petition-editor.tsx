// components/petition-editor.tsx
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Usaremos Textarea como um fallback simples
import { Save, Case, User, FileText, ArrowLeft } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Tipos simulados (em um app real, viriam de um local central)
interface Case { id: number; title: string; case_number: string | null; }
interface Employee { id: string; name: string; }

interface PetitionEditorProps {
  cases: Case[];
  employees: Employee[];
  onSave: (data: any) => void;
  onCancel: () => void;
}

export function PetitionEditor({ cases, employees, onSave, onCancel }: PetitionEditorProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    caseId: '',
    title: '',
    assignedTo: '',
    content: ''
  });

  const handleSubmit = () => {
    if (!formData.caseId || !formData.title || !formData.assignedTo || !formData.content) {
      toast({
        title: "Campos Incompletos",
        description: "Por favor, preencha todos os campos para salvar a petição.",
        variant: "destructive",
      });
      return;
    }
    // Em uma implementação real, o 'content' viria do Monaco Editor
    onSave(formData);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editor de Petição
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Caso Associado *</Label>
            <Select value={formData.caseId} onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}>
              <SelectTrigger><SelectValue placeholder="Selecione um caso..." /></SelectTrigger>
              <SelectContent>{cases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Título da Petição *</Label>
            <Input placeholder="Ex: Petição Inicial de Cobrança" value={formData.title} onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}/>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Responsável pela Correção *</Label>
          <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
            <SelectTrigger><SelectValue placeholder="Selecione um advogado..." /></SelectTrigger>
            <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Conteúdo da Petição *</Label>
          {/* Abaixo, idealmente, seria o MonacoEditor. Usamos Textarea por simplicidade. */}
          <Textarea 
            placeholder="Digite o corpo da sua petição aqui..."
            className="min-h-[400px] font-mono"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={handleSubmit}>
            <Save className="mr-2 h-4 w-4" />
            Salvar e Enviar para Revisão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}