// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/enhanced-cases-module.tsx

'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Handshake } from 'lucide-react'
import { EnhancedFinancialAgreementModal } from '@/components/enhanced-financial-agreement-modal'
import { CaseSchema } from '@/lib/schemas' // Importando o schema para tipagem
import { z } from 'zod'

// Tipagem para um caso, inferida do Zod schema
type Case = z.infer<typeof CaseSchema> & {
    id: string; // Garantindo que o ID exista
    debtor: { id: string; name: string };
    creditor: { id: string; name: string };
};


// Mock de dados e hook - Em um cenário real, estes viriam de uma API
const mockCases: Case[] = [
  { id: 'case-1', case_number: '001/2023', status: 'Em Andamento', debtor_id: 'entity-1', creditor_id: 'entity-2', debtor: {id: 'entity-1', name: 'João da Silva'}, creditor: {id: 'entity-2', name: 'Empresa ABC Ltda'} },
  { id: 'case-2', case_number: '002/2023', status: 'Finalizado', debtor_id: 'entity-3', creditor_id: 'entity-2', debtor: {id: 'entity-3', name: 'Maria Oliveira'}, creditor: {id: 'entity-2', name: 'Empresa ABC Ltda'} },
  { id: 'case-3', case_number: '003/2023', status: 'Arquivado', debtor_id: 'entity-1', creditor_id: 'entity-3', debtor: {id: 'entity-1', name: 'João da Silva'}, creditor: {id: 'entity-3', name: 'Maria Oliveira'} },
];

const useGetCases = () => ({
  data: mockCases,
  isLoading: false,
});

const useUpdateCaseStatus = () => ({
    mutate: (data: {id: string, status: string}) => {
        console.log("Atualizando status do caso:", data);
        // Lógica de mutação aqui (seria uma chamada de API)
    }
})


export function EnhancedCasesModule() {
  const { data: cases, isLoading } = useGetCases();
  const updateStatusMutation = useUpdateCaseStatus();
  
  const [isFinancialModalOpen, setFinancialModalOpen] = useState(false);
  const [selectedCaseForAgreement, setSelectedCaseForAgreement] = useState<Case | null>(null);

  const handleStatusChange = (caseId: string, newStatus: string) => {
    if (newStatus === 'Acordo') {
      const selectedCase = cases?.find(c => c.id === caseId);
      if (selectedCase) {
        setSelectedCaseForAgreement(selectedCase);
        setFinancialModalOpen(true);
      }
    } else {
      updateStatusMutation.mutate({ id: caseId!, status: newStatus });
    }
  };

  const closeFinancialModal = () => {
    setFinancialModalOpen(false);
    setSelectedCaseForAgreement(null);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Processos</CardTitle>
          <CardDescription>Visualize e atualize o andamento dos seus processos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº do Processo</TableHead>
                <TableHead>Devedor</TableHead>
                <TableHead>Status Atual</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases?.map((caseItem) => (
                <TableRow key={caseItem.id}>
                  <TableCell className="font-mono">{caseItem.case_number}</TableCell>
                  <TableCell>{caseItem.debtor.name}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={caseItem.status}
                      onValueChange={(newStatus) => handleStatusChange(caseItem.id!, newStatus)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Mudar status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                        <SelectItem value="Finalizado">Finalizado</SelectItem>
                        <SelectItem value="Arquivado">Arquivado</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                        <SelectItem value="Acordo">
                          <div className="flex items-center">
                            <Handshake className="mr-2 h-4 w-4 text-green-500"/>
                            <span>Criar Acordo</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EnhancedFinancialAgreementModal
        isOpen={isFinancialModalOpen}
        onClose={closeFinancialModal}
        initialData={selectedCaseForAgreement ? {
            id: selectedCaseForAgreement.id,
            debtor_id: selectedCaseForAgreement.debtor_id,
            creditor_id: selectedCaseForAgreement.creditor_id,
        } : null}
      />
    </>
  );
}