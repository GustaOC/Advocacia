// components/client-detail-view.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DocumentsModule } from './documents-module';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// ✅ CORREÇÃO APLICADA AQUI: Adicionado 'FolderOpen' à lista de importações.
import { User, Briefcase, FileCheck, FileWarning, CheckCircle, Loader2, FolderOpen } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface Case {
  id: number;
  title: string;
  case_number: string;
  status: string;
  // Adicione um campo para o tipo de ação para o checklist de documentos
  action_type: 'cobranca' | 'divorcio' | 'inventario' | 'outros'; 
}

// Definição dos documentos necessários por tipo de ação
const REQUIRED_DOCS_CHECKLIST: Record<Case['action_type'], string[]> = {
  cobranca: ['Procuração', 'Documentos Pessoais (CNH/RG)', 'Comprovante de Residência', 'Contrato ou Título de Dívida', 'Comprovantes de Pagamento Parcial (se houver)'],
  divorcio: ['Procuração', 'Documentos Pessoais (CNH/RG)', 'Comprovante de Residência', 'Certidão de Casamento', 'Pacto Antenupcial (se houver)'],
  inventario: ['Procuração', 'Documentos Pessoais do Falecido', 'Certidão de Óbito', 'Documentos dos Herdeiros', 'Relação de Bens'],
  outros: ['Procuração', 'Documentos Pessoais (CNH/RG)', 'Comprovante de Residência'],
};

const DocumentChecklistItem = ({ name, isUploaded }: { name: string, isUploaded: boolean }) => (
  <li className={`flex items-center justify-between p-2 rounded ${isUploaded ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
    <span className="text-sm">{name}</span>
    {isUploaded ? <FileCheck className="h-4 w-4" /> : <FileWarning className="h-4 w-4" />}
  </li>
);

export function ClientDetailView({ client }: { client: Client }) {
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  // Busca os casos (processos) associados a este cliente específico
  const { data: allCases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases'],
    queryFn: () => apiClient.getCases(),
  });

  // Filtra os casos para exibir apenas os do cliente selecionado
  // Esta é uma simulação, o ideal seria uma API que buscasse os casos por clienteId
  const clientCases = useMemo(() => allCases.filter(c => (c as any).client_id === client.id || c.title.includes(client.name)), [allCases, client.id, client.name]);
  
  // Simulação dos documentos já enviados para o caso selecionado
  const uploadedDocs = useMemo(() => {
    if (!selectedCase) return [];
    // Em um sistema real, isso viria da API (documentsModule)
    if (selectedCase.action_type === 'cobranca') return ['Procuração', 'Documentos Pessoais (CNH/RG)', 'Comprovante de Residência'];
    if (selectedCase.action_type === 'divorcio') return ['Procuração', 'Documentos Pessoais (CNH/RG)', 'Comprovante de Residência', 'Certidão de Casamento', 'Pacto Antenupcial (se houver)'];
    return ['Procuração'];
  }, [selectedCase]);
  
  const requiredDocs = selectedCase ? REQUIRED_DOCS_CHECKLIST[selectedCase.action_type] : [];
  const isReadyForPetition = selectedCase && requiredDocs.every(doc => uploadedDocs.includes(doc));


  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <User className="h-6 w-6" />
            <span>Pasta Virtual de: {client.name}</span>
          </CardTitle>
          <CardDescription>Visualize todos os processos e documentos do cliente em um só lugar.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna de Processos */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Briefcase className="h-5 w-5"/> Processos</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="animate-spin" /> : (
                <ul className="space-y-2">
                  {clientCases.map(c => (
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
        </div>

        {/* Coluna de Documentos e Detalhes */}
        <div className="lg:col-span-2">
          {selectedCase ? (
            <div className="space-y-6">
                {isReadyForPetition && (
                <Alert className="bg-green-100 border-green-300 text-green-900">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <AlertTitle className="font-bold">Ação Pronta!</AlertTitle>
                  <AlertDescription>
                    Todos os documentos necessários para este processo foram anexados. A ação está pronta para ser peticionada.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Checklist de Documentos */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-xl">Checklist de Documentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {requiredDocs.map(doc => (
                                <DocumentChecklistItem key={doc} name={doc} isUploaded={uploadedDocs.includes(doc)} />
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                
                {/* Módulo de Upload e Listagem */}
                <div className="md:col-span-1">
                    <DocumentsModule caseId={selectedCase.id} />
                </div>
              </div>

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