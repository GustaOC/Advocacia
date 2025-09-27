// components/financial-renegotiation-modal.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, RefreshCw, Save, Calculator, DollarSign, Calendar,
  TrendingDown, TrendingUp, AlertTriangle, Info, CheckCircle,
  Target, PiggyBank, Percent, Clock, FileText, History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface RenegotiationData {
  new_total_value?: number;
  new_installments?: number;
  new_first_due_date: string;
  new_entry_value?: number;
  renegotiation_reason: string;
  discount_applied?: number;
  additional_fees?: number;
}

interface FinancialRenegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: FinancialAgreement | null;
  onSuccess?: () => void;
}

export function FinancialRenegotiationModal({
  isOpen,
  onClose,
  agreement,
  onSuccess
}: FinancialRenegotiationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<RenegotiationData>({
    new_first_due_date: '',
    renegotiation_reason: '',
    discount_applied: 0,
    additional_fees: 0,
  });

  const [showComparison, setShowComparison] = useState(false);

  // Inicializar dados quando o acordo é carregado
  useEffect(() => {
    if (agreement && isOpen) {
      setFormData({
        new_total_value: agreement.total_value,
        new_installments: agreement.installments,
        new_first_due_date: agreement.next_due_date || '',
        new_entry_value: 0, // Nova entrada opcional
        renegotiation_reason: '',
        discount_applied: 0,
        additional_fees: 0,
      });
    }
  }, [agreement, isOpen]);

  // Cálculos automáticos
  const calculations = useMemo(() => {
    if (!agreement || !formData.new_total_value || !formData.new_installments) {
      return {
        newInstallmentValue: 0,
        totalDifference: 0,
        installmentDifference: 0,
        discountAmount: 0,
        feesAmount: 0,
        finalTotal: 0,
      };
    }

    const newTotal = formData.new_total_value || agreement.total_value;
    const newEntry = formData.new_entry_value || 0;
    const newInstallments = formData.new_installments || agreement.installments;
    const discountPercent = formData.discount_applied || 0;
    const additionalFees = formData.additional_fees || 0;

    const discountAmount = (newTotal * discountPercent) / 100;
    const finalTotal = newTotal - discountAmount + additionalFees;
    const newInstallmentValue = (finalTotal - newEntry) / newInstallments;

    return {
      newInstallmentValue,
      totalDifference: finalTotal - agreement.total_value,
      // ✅ CORREÇÃO: Adicionado fallback para o caso de installment_value ser nulo.
      installmentDifference: newInstallmentValue - (agreement.installment_value ?? 0),
      discountAmount,
      feesAmount: additionalFees,
      finalTotal,
    };
  }, [agreement, formData]);

  const handleChange = (field: keyof RenegotiationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renegotiateMutation = useMutation({
    mutationFn: (data: RenegotiationData) => {
      if (!agreement) throw new Error("Acordo não encontrado");
      return apiClient.renegotiateFinancialAgreement(String(agreement.id), data);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Acordo renegociado com sucesso."
      });
      queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreementInstallments', agreement?.id] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na renegociação",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleSubmit = () => {
    if (!agreement) return;

    // Validações
    if (!formData.renegotiation_reason.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O motivo da renegociação é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (formData.renegotiation_reason.trim().length < 10) {
      toast({
        title: "Motivo insuficiente",
        description: "O motivo da renegociação deve ter pelo menos 10 caracteres.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.new_first_due_date) {
      toast({
        title: "Data obrigatória",
        description: "A nova data de vencimento é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    const today = new Date();
    const newDate = new Date(formData.new_first_due_date);
    if (newDate < today) {
      toast({
        title: "Data inválida",
        description: "A nova data de vencimento não pode ser anterior a hoje.",
        variant: "destructive"
      });
      return;
    }

    renegotiateMutation.mutate(formData);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (!agreement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <RefreshCw className="mr-2 h-6 w-6 text-orange-600" />
            Renegociar Acordo Financeiro #{agreement.id}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Cliente: <span className="font-semibold">{agreement.client_entities.name}</span>
            {agreement.cases.case_number && (
              <span className="ml-2 font-mono">({agreement.cases.case_number})</span>
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Acordo Atual */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <History className="mr-2 h-5 w-5 text-blue-600" />
                Acordo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium">Valor Total</p>
                  <p className="text-lg font-bold text-blue-800">
                    {formatCurrency(agreement.total_value)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Por Parcela</p>
                  <p className="text-lg font-bold text-green-800">
                    {formatCurrency(agreement.installment_value ?? 0)}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-purple-600 font-medium">Parcelas</p>
                  <p className="text-lg font-bold text-purple-800">
                    {agreement.installments}x
                  </p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Renegociações</p>
                  <p className="text-lg font-bold text-orange-800">
                    {agreement.renegotiation_count}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ... (o resto do JSX permanece inalterado) ... */}
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <Calculator className="mr-2 h-5 w-5 text-green-600" />
                Novos Valores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Novo Valor Total
                  </Label>
                  <Input 
                    type="number" 
                    placeholder={String(agreement.total_value)}
                    value={String(formData.new_total_value || '')} 
                    onChange={e => handleChange('new_total_value', Number(e.target.value))}
                    className="h-11 text-lg font-semibold"
                  />
                  <p className="text-xs text-slate-500">
                    Deixe vazio para manter o valor atual
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-600" />
                    Novo Número de Parcelas
                  </Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="120" 
                    placeholder={String(agreement.installments)}
                    value={String(formData.new_installments || '')} 
                    onChange={e => handleChange('new_installments', Number(e.target.value))}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Deixe vazio para manter as parcelas atuais
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-blue-600" />
                    Nova Entrada (Opcional)
                  </Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={String(formData.new_entry_value || '')} 
                    onChange={e => handleChange('new_entry_value', Number(e.target.value))}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Valor adicional de entrada na renegociação
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    Nova Data de Vencimento *
                  </Label>
                  <Input 
                    type="date" 
                    value={formData.new_first_due_date || ''} 
                    onChange={e => handleChange('new_first_due_date', e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Data da primeira parcela renegociada
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-green-600" />
                    Desconto Aplicado (%)
                  </Label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="100" 
                    step="0.1"
                    value={String(formData.discount_applied || '')} 
                    onChange={e => handleChange('discount_applied', Number(e.target.value))}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Percentual de desconto sobre o valor total
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                    Taxas Adicionais
                  </Label>
                  <Input 
                    type="number" 
                    min="0"
                    value={String(formData.additional_fees || '')} 
                    onChange={e => handleChange('additional_fees', Number(e.target.value))}
                    className="h-11"
                  />
                  <p className="text-xs text-slate-500">
                    Valor fixo de taxas ou custas adicionais
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
           <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Calculator className="mr-2 h-5 w-5 text-indigo-600" />
                  Comparação de Valores
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? 'Ocultar' : 'Mostrar'} Comparação
                </Button>
              </CardTitle>
            </CardHeader>
            {showComparison && (
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Valores Atuais */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-center">ATUAL</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-slate-50 rounded">
                        <span className="text-sm text-slate-600">Valor Total:</span>
                        <span className="font-semibold">{formatCurrency(agreement.total_value)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded">
                        <span className="text-sm text-slate-600">Por Parcela:</span>
                        <span className="font-semibold">{formatCurrency(agreement.installment_value ?? 0)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-slate-50 rounded">
                        <span className="text-sm text-slate-600">Parcelas:</span>
                        <span className="font-semibold">{agreement.installments}x</span>
                      </div>
                    </div>
                  </div>

                  {/* Valores Novos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-800 text-center">NOVO</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between p-3 bg-blue-50 rounded">
                        <span className="text-sm text-blue-600">Valor Total:</span>
                        <span className="font-semibold text-blue-800">{formatCurrency(calculations.finalTotal)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded">
                        <span className="text-sm text-blue-600">Por Parcela:</span>
                        <span className="font-semibold text-blue-800">{formatCurrency(calculations.newInstallmentValue)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50 rounded">
                        <span className="text-sm text-blue-600">Parcelas:</span>
                        <span className="font-semibold text-blue-800">{formData.new_installments || agreement.installments}x</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Diferenças */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-800 text-center">DIFERENÇAS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg text-center ${
                      calculations.totalDifference > 0 
                        ? 'bg-red-50 border border-red-200' 
                        : calculations.totalDifference < 0 
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {calculations.totalDifference > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : calculations.totalDifference < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <Target className="h-4 w-4 text-slate-600" />
                        )}
                        <span className="text-xs font-medium">Valor Total</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        calculations.totalDifference > 0 ? 'text-red-700' : 
                        calculations.totalDifference < 0 ? 'text-green-700' : 'text-slate-700'
                      }`}>
                        {calculations.totalDifference >= 0 ? '+' : ''}{formatCurrency(calculations.totalDifference)}
                      </p>
                    </div>

                    <div className={`p-4 rounded-lg text-center ${
                      calculations.installmentDifference > 0 
                        ? 'bg-red-50 border border-red-200' 
                        : calculations.installmentDifference < 0 
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-slate-50 border border-slate-200'
                    }`}>
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {calculations.installmentDifference > 0 ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : calculations.installmentDifference < 0 ? (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        ) : (
                          <Target className="h-4 w-4 text-slate-600" />
                        )}
                        <span className="text-xs font-medium">Por Parcela</span>
                      </div>
                      <p className={`text-lg font-bold ${
                        calculations.installmentDifference > 0 ? 'text-red-700' : 
                        calculations.installmentDifference < 0 ? 'text-green-700' : 'text-slate-700'
                      }`}>
                        {calculations.installmentDifference >= 0 ? '+' : ''}{formatCurrency(calculations.installmentDifference)}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg text-center border border-blue-200">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium">Economia</span>
                      </div>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(calculations.discountAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
           <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <FileText className="mr-2 h-5 w-5 text-slate-600" />
                Motivo da Renegociação *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea 
                  placeholder="Ex: Cliente enfrentando dificuldades financeiras devido à pandemia. Solicitou redução do valor das parcelas e extensão do prazo..."
                  value={formData.renegotiation_reason} 
                  onChange={e => handleChange('renegotiation_reason', e.target.value)}
                  className="min-h-24"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-slate-500">
                    Descreva detalhadamente o motivo da renegociação
                  </p>
                  <p className="text-xs text-slate-500">
                    {formData.renegotiation_reason.length}/500
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="pt-6 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Renegociação #{agreement.renegotiation_count + 1}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={renegotiateMutation.isPending || !formData.renegotiation_reason.trim()}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {renegotiateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Confirmar Renegociação
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}