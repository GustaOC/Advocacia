// components/financial-agreement-modal.tsx - VERSÃO CORRIGIDA
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Tipagens
interface AgreementFormData {
  case_id: number | null;
  client_entity_id: number | null;
  agreement_type: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | string;
  total_value: number | string;
  entry_value?: number | string;
  installments: number | string;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  notes?: string;
}

interface Case {
  id: number;
  title: string;
  case_number: string | null;
  case_parties: { role: string; entities: { id: number; name: string } }[];
}

interface FinancialAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData?: Case | null; // Recebe os dados do caso para pré-preenchimento
}

export function FinancialAgreementModal({ isOpen, onClose, caseData }: FinancialAgreementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<AgreementFormData>({
    case_id: null,
    client_entity_id: null,
    agreement_type: 'Judicial',
    total_value: '',
    installments: 1,
    status: 'active',
  });

  // Efeito para pré-preencher o formulário quando os dados do caso são recebidos
  useEffect(() => {
    if (caseData) {
      const clientParty = caseData.case_parties.find(p => p.role === 'Cliente');
      setFormData(prev => ({
        ...prev,
        case_id: caseData.id,
        client_entity_id: clientParty?.entities.id ?? null,
      }));
    }
  }, [caseData]);

  const handleChange = (field: keyof AgreementFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createAgreementMutation = useMutation({
    mutationFn: (agreementData: AgreementFormData) => {
        // Converte valores numéricos antes de enviar para a API
        const numericData = {
            ...agreementData,
            total_value: Number(agreementData.total_value),
            entry_value: Number(agreementData.entry_value || 0),
            installments: Number(agreementData.installments),
        };
        return apiClient.createFinancialAgreement(numericData);
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Acordo financeiro criado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ['financialAgreements'] }); // Invalida a query do módulo financeiro principal
      onClose(); // Fecha o modal
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar acordo", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!formData.case_id || !formData.client_entity_id || !formData.total_value) {
        toast({ title: "Campos obrigatórios", description: "Caso, Cliente e Valor Total são obrigatórios.", variant: "destructive"});
        return;
    }
    createAgreementMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5 text-green-600" />
            Criar Novo Lançamento de Acordo
          </DialogTitle>
          {caseData && <DialogDescription>Acordo para o caso: {caseData.title}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total do Acordo *</Label>
              <Input type="number" placeholder="5000,00" value={String(formData.total_value)} onChange={e => handleChange('total_value', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor de Entrada (Opcional)</Label>
              <Input type="number" placeholder="1000,00" value={String(formData.entry_value || '')} onChange={e => handleChange('entry_value', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Parcelas *</Label>
              <Input type="number" min="1" value={String(formData.installments)} onChange={e => handleChange('installments', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Acordo *</Label>
              <Select value={formData.agreement_type} onValueChange={value => handleChange('agreement_type', value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Judicial">Judicial</SelectItem>
                  <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                  <SelectItem value="Em Audiência">Em Audiência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Detalhes do acordo, datas de vencimento das parcelas, etc." value={formData.notes || ''} onChange={e => handleChange('notes', e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createAgreementMutation.isPending}>
            {createAgreementMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Acordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}