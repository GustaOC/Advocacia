// components/documents-module.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Loader2, X } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client'; // Importando o apiClient

// Tipagem para os documentos que virão da API
interface Document {
  id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  created_at: string;
  employee: {
    name: string;
  } | null;
}

interface DocumentsModuleProps {
  caseId: number;
}

const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function DocumentsModule({ caseId }: DocumentsModuleProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const supabase = createClient();

  const fetchDocuments = useCallback(async () => {
    if (!caseId) return; // Não busca se o caseId não for válido
    setIsLoading(true);
    try {
      // Usando o apiClient para consistência
      const data = await apiClient.getDocumentsByCaseId(caseId);
      setDocuments(data);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [caseId, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({ title: "Arquivo não selecionado", description: "Selecione um arquivo para enviar.", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("case_id", String(caseId));
    formData.append("description", description);

    try {
      // CORREÇÃO: Usando o apiClient.uploadDocument que foi padronizado
      await apiClient.uploadDocument(formData);
      
      toast({ title: "Sucesso!", description: "Documento enviado com sucesso." });
      setSelectedFile(null);
      setDescription("");
      fetchDocuments(); // Recarrega a lista de documentos
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${doc.file_name}"?`)) return;
    try {
      await apiClient.deleteDocument(doc.id);
      toast({ title: "Sucesso", description: "Documento excluído." });
      fetchDocuments(); // Recarrega a lista de documentos
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };
  
  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from('case-documents')
      .createSignedUrl(doc.file_path, 60); // URL válida por 60 segundos

    if (error) {
      toast({ title: "Erro ao gerar link", description: "Não foi possível criar o link para download.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Upload de Novo Documento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">{selectedFile ? selectedFile.name : "Arraste e solte ou clique para selecionar"}</p>
                {selectedFile && <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>}
              </Label>
              {selectedFile && <Button variant="ghost" size="sm" className="mt-2 text-red-500" onClick={() => setSelectedFile(null)}><X className="h-4 w-4 mr-1" /> Remover</Button>}
            </div>
            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea id="description" placeholder="Ex: Procuração assinada pelo cliente..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {isUploading ? "Enviando..." : "Enviar Documento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Documentos do Caso</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (<div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>) : 
          documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-slate-400" />
              <p>Nenhum documento encontrado para este caso.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">{doc.file_name}</p>
                      <p className="text-sm text-slate-600">{doc.description || "Sem descrição"}</p>
                      <p className="text-xs text-slate-500">Enviado por {doc.employee?.name || 'Desconhecido'} em {new Date(doc.created_at).toLocaleDateString('pt-BR')} - {formatFileSize(doc.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}><Download className="h-4 w-4 mr-2" /> Baixar</Button>
                     <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(doc)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}