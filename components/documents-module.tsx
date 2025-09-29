// components/documents-module.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Download, Trash2, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AnyDoc = Record<string, any>;

interface UIDocument {
  id: number | string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  description: string | null;
  created_at: string;
  employee: { name: string } | null;
}

interface DocumentsModuleProps {
  caseId: number;
}

const BUCKET = "case-documents";

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/** Normaliza a resposta do endpoint para um array */
function normalizeResponseToArray(payload: any): AnyDoc[] {
  if (!payload) return [];
  // { data: { documents: [...] } }
  if (Array.isArray(payload?.data?.documents)) return payload.data.documents;
  // { data: [...] }
  if (Array.isArray(payload?.data)) return payload.data;
  // { documents: [...] }
  if (Array.isArray(payload?.documents)) return payload.documents;
  // já é array?
  if (Array.isArray(payload)) return payload;
  return [];
}

/** Converte um registro cru em um objeto que a UI espera */
function toUIDocument(raw: AnyDoc): UIDocument {
  const id =
    raw.id ??
    raw.document_id ??
    raw.uuid ??
    Math.random().toString(36).slice(2);

  // nome do arquivo (tentativas por colunas comuns)
  const file_name =
    raw.file_name ??
    raw.filename ??
    raw.name ??
    raw.original_name ??
    (() => {
      const path =
        raw.file_path ??
        raw.path ??
        raw.storage_path ??
        raw.url ??
        raw.file_url ??
        "";
      const parts = String(path).split("/");
      return parts[parts.length - 1] || "arquivo";
    })();

  // caminho / chave no bucket (usado no download)
  const file_path =
    raw.file_path ??
    raw.path ??
    raw.storage_path ??
    raw.url ??
    raw.file_url ??
    file_name;

  const file_size = Number(
    raw.file_size ?? raw.size ?? (raw.metadata?.size ?? 0)
  );

  const file_type =
    raw.file_type ?? raw.mimetype ?? raw.mime_type ?? raw.type ?? "application/octet-stream";

  const description =
    raw.description ??
    raw.notes ??
    raw.note ??
    raw.obs ??
    null;

  const created_at =
    raw.created_at ??
    raw.inserted_at ??
    raw.createdAt ??
    new Date().toISOString();

  const employeeName =
    raw.employee?.name ??
    raw.uploaded_by_name ??
    raw.user_name ??
    null;

  return {
    id,
    file_name: String(file_name),
    file_path: String(file_path),
    file_size: Number.isFinite(file_size) ? file_size : 0,
    file_type: String(file_type),
    description: description ? String(description) : null,
    created_at: String(created_at),
    employee: employeeName ? { name: String(employeeName) } : null,
  };
}

export function DocumentsModule({ caseId }: DocumentsModuleProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UIDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const supabase = createClient();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/documents?case_id=${caseId}`, { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `Falha ao carregar documentos (HTTP ${res.status})`);
      }
      const arr = normalizeResponseToArray(json);
      setDocuments(arr.map(toUIDocument));
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setDocuments([]); // evita map em undefined
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

  /**
   * Upload flow:
   * 1) Upload do arquivo para Supabase Storage (bucket "case-documents")
   * 2) POST /api/documents com metadados em JSON (compatível com a rota atual)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // 1) Upload pro Storage
      const key = `${caseId}/${Date.now()}-${selectedFile.name}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, selectedFile, {
          contentType: selectedFile.type || "application/octet-stream",
          upsert: false,
        });

      if (upErr) {
        throw new Error(`Falha no upload para o storage: ${upErr.message}`);
      }

      // 2) Registrar metadados no backend (JSON)
      const meta = {
        case_id: caseId,
        file_name: selectedFile.name,
        file_path: key,
        file_size: selectedFile.size,
        file_type: selectedFile.type || "application/octet-stream",
        description: description || null,
      };

      const resp = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meta),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(payload?.error || "Falha ao registrar metadados do documento.");
      }

      toast({ title: "Sucesso!", description: "Documento enviado com sucesso." });
      setSelectedFile(null);
      setDescription("");
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc: UIDocument) => {
    if (!confirm(`Tem certeza que deseja excluir o arquivo "${doc.file_name}"?`)) return;
    try {
      const response = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(json?.error || "Falha ao excluir.");
      }
      toast({ title: "Sucesso", description: "Documento excluído." });
      // (opcional) remover do bucket também, se a API já não fizer isso
      // await supabase.storage.from(BUCKET).remove([doc.file_path]);
      fetchDocuments();
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  const handleDownload = async (doc: UIDocument) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60); // URL válida por 60s

    if (error || !data?.signedUrl) {
      toast({
        title: "Erro ao gerar link",
        description: "Não foi possível criar o link para download.",
        variant: "destructive",
      });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Novo Documento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {selectedFile ? selectedFile.name : "Arraste e solte ou clique para selecionar"}
                </p>
                {selectedFile && (
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                )}
              </Label>
              {selectedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-500"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4 mr-1" /> Remover
                </Button>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Ex: Procuração assinada pelo cliente..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading ? "Enviando..." : "Enviar Documento"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos do Caso</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-slate-400" />
              <p>Nenhum documento encontrado para este caso.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li
                  key={String(doc.id)}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-800">{doc.file_name}</p>
                      <p className="text-sm text-slate-600">{doc.description || "Sem descrição"}</p>
                      <p className="text-xs text-slate-500">
                        Enviado por {doc.employee?.name || "—"} em{" "}
                        {new Date(doc.created_at).toLocaleDateString("pt-BR")} —{" "}
                        {formatFileSize(doc.file_size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(doc)}>
                      <Download className="h-4 w-4 mr-2" /> Baixar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

export default DocumentsModule;

