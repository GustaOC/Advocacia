// components/client-detail-view.tsx 
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Case } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Briefcase, FileCheck, FileWarning, CheckCircle, Loader2, FolderOpen, ArrowLeft } from 'lucide-react';
import { DocumentsModule } from './documents-module';

interface Client {
  id: string;
  name: string;
  document: string;
  type: string;
  email?: string | null;
  address?: string | null;
  address_number?: string | null;
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

const DocStatusItem = ({ name, isUploaded }: { name: string; isUploaded: boolean }) => (
  <li className={`flex items-center justify-between p-2 rounded ${isUploaded ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
    <span className="text-sm">{name}</span>
    {isUploaded ? <FileCheck className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
  </li>
);

export function ClientDetailView({ client, onBack }: { client: Client, onBack: () => void }) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const { data: casesResponse, isLoading, isError, error } = useQuery<{ cases: Case[]; total: number }>({
    queryKey: ['cases', { page: 1, limit: 1000 }],
    queryFn: async () => {
      const res = await fetch(`/api/cases?limit=1000`, { method: 'GET' });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || `Falha ao carregar processos (HTTP ${res.status})`);
      }
      const payload = await res.json();
      return payload?.data ?? payload; // { cases, total }
    },
    staleTime: 1000 * 60 * 2,
  });

  const allCases = casesResponse?.cases ?? [];

  // ✅ Mais robusto: aceita entities.id, entity_id ou entity?.id no case_parties
  const clientCases = useMemo(() => {
    if (!Array.isArray(allCases)) return [];
    const targetId = String(client.id);
    return allCases.filter((c: any) =>
      Array.isArray(c.case_parties) &&
      c.case_parties.some((p: any) => {
        const pid =
          p?.entities?.id ??
          p?.entity_id ??
          p?.entity?.id ??
          null;
        return pid != null && String(pid) === targetId;
      })
    );
  }, [allCases, client.id]);

  const uploadedDocs = useMemo(() =>
    [
      { name: "RG/CPF", isUploaded: true },
      { name: "Comprovante de Residência", isUploaded: true },
      { name: "Procuração", isUploaded: false },
      { name: "Contrato", isUploaded: false },
    ],
  []);

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="h-6 w-6" />
            Pasta Virtual de: {client.name}
          </CardTitle>
          <CardDescription>CPF/CNPJ: {client.document}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-slate-500">Tipo</p>
            <p className="font-medium">{client.type || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Cidade</p>
            <p className="font-medium">{client.city || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Telefone</p>
            <p className="font-medium">{client.cellphone1 || client.phone || '-'}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Briefcase className="h-5 w-5"/> Processos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <Loader2 className="animate-spin h-4 w-4" /> Carregando processos...
                </div>
              ) : isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Falha ao carregar processos</AlertTitle>
                  <AlertDescription>{(error as Error)?.message || 'Tente novamente.'}</AlertDescription>
                </Alert>
              ) : clientCases.length === 0 ? (
                <div className="text-slate-500 text-sm">Nenhum processo relacionado a este cliente.</div>
              ) : (
                <ul className="space-y-2">
                  {clientCases.map((c: any) => (
                    <li key={c.id}>
                      <Button
                        variant={selectedCase?.id === c.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setSelectedCase(c)}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">{c.title}</span>
                          <span className="text-xs font-mono">{c.case_number}</span>
                        </div>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><CheckCircle className="h-5 w-5"/> Documentos</CardTitle>
              <CardDescription>Status dos documentos enviados</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {uploadedDocs.map(d => (
                  <DocStatusItem key={d.name} name={d.name} isUploaded={d.isUploaded} />
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="space-y-4">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">{selectedCase.title}</CardTitle>
                  <CardDescription>Nº {selectedCase.case_number} — {selectedCase.status}</CardDescription>
                </CardHeader>
              </Card>

              {/* DocumentsModule espera number */}
              <DocumentsModule caseId={Number(selectedCase.id)} />
            </div>
          ) : (
            <Card className="border-0 shadow-lg h-full flex items-center justify-center">
              <CardContent className="text-center text-slate-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Selecione um processo ao lado</p>
                <p className="text-sm">para ver os documentos e detalhes.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
