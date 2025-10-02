// components/installment-payment-modal.tsx - VERSÃO CORRIGIDA E ALINHADA À API

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Loader2, DollarSign, Save, Calendar, CreditCard, Building, 
  AlertTriangle, CheckCircle, Receipt, Calculator, Info,
  Banknote, FileSignature, Target, Percent, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Installment {
  id: number;
  agreement_id: number;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paid_date?: string;
  amount_paid?: number;
  late_fee_paid?: number;
  interest_paid?: number;
}

interface PaymentData {
  amount_paid: number;
  payment_date: string; // ✅ Sempre string, nunca undefined
  payment_method: string;
  payment_reference: string;
  late_fee_paid: number;
  interest_paid: number;
  discount_applied: number;
  notes: string;
}

interface InstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: Installment | null;
  agreementData?: {
    id: number;
    client_name: string;
    case_number?: string;
    late_payment_fee: number;
    late_payment_daily_interest: number;
  };
  onSuccess?: () => void;
}

export function InstallmentPaymentModal({ 
  isOpen, 
  onClose, 
  installment,
  agreementData,
  onSuccess 
}: InstallmentPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Sempre retorna string (YYYY-MM-DD) sem risco de undefined
  const getCurrentDate = (): string => new Date().toISOString().slice(0, 10);

  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount_paid: 0,
    payment_date: getCurrentDate(), // ✅ Usa função que sempre retorna string
    payment_method: 'pix',
    payment_reference: '',
    late_fee_paid: 0,
    interest_paid: 0,
    discount_applied: 0,
    notes: '',
  });

  const [calculatedFees, setCalculatedFees] = useState({
    lateFee: 0,
    interest: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    if (installment && agreementData && installment.status === 'overdue') {
      const dueDate = new Date(installment.due_date);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const lateFeePercentage = agreementData.late_payment_fee || 2;
      const dailyInterestPercentage = agreementData.late_payment_daily_interest || 0.033;
      
      const lateFee = (installment.amount * lateFeePercentage) / 100;
      const interest = (installment.amount * dailyInterestPercentage * daysOverdue) / 100;
      const totalAmount = installment.amount + lateFee + interest;

      setCalculatedFees({ lateFee, interest, totalAmount });
      
      setPaymentData(prev => ({
        ...prev,
        amount_paid: totalAmount,
        late_fee_paid: lateFee,
        interest_paid: interest,
      }));
    } else if (installment) {
      setPaymentData(prev => ({
        ...prev,
        amount_paid: installment.amount,
        late_fee_paid: 0,
        interest_paid: 0,
      }));
      setCalculatedFees({ lateFee: 0, interest: 0, totalAmount: installment.amount });
    }
  }, [installment, agreementData]);

  const handleChange = (field: keyof PaymentData, value: any) => {
    // ✅ Garante que payment_date é sempre string (YYYY-MM-DD)
    if (field === 'payment_date') {
      setPaymentData(prev => ({ 
        ...prev, 
        [field]: value || getCurrentDate(),
      }));
    } else {
      setPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const recordPaymentMutation = useMutation({
    mutationFn: (data: PaymentData) => {
      if (!installment || !agreementData) throw new Error("Dados insuficientes");
      
      // ✅ Garante string
      const paymentDate = data.payment_date || getCurrentDate();

      // ✅ Alinha com assinatura do apiClient.recordInstallmentPayment(installmentId, { amount_paid, payment_date, payment_method, notes? })
      return apiClient.recordInstallmentPayment(String(installment.id), {
        amount_paid: data.amount_paid,
        payment_date: paymentDate,
        payment_method: data.payment_method,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Sucesso!", 
        description: "Pagamento registrado com sucesso." 
      });
      queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
      queryClient.invalidateQueries({ queryKey: ['agreementInstallments'] });
      queryClient.invalidateQueries({ queryKey: ['agreementPaymentHistory'] });
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao registrar pagamento", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = () => {
    if (!installment) return;

    if (paymentData.amount_paid <= 0) {
      toast({ 
        title: "Valor inválido", 
        description: "O valor pago deve ser maior que zero.", 
        variant: "destructive"
      });
      return;
    }

    // ✅ Validação de data robusta
    if (!paymentData.payment_date || paymentData.payment_date.trim() === '') {
      toast({ 
        title: "Data obrigatória", 
        description: "A data de pagamento é obrigatória.", 
        variant: "destructive"
      });
      return;
    }

    if (!paymentData.payment_method) {
      toast({ 
        title: "Método obrigatório", 
        description: "O método de pagamento é obrigatório.", 
        variant: "destructive"
      });
      return;
    }

    recordPaymentMutation.mutate(paymentData);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'pix': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'bank_transfer': return <Building className="h-4 w-4 text-blue-600" />;
      case 'check': return <Receipt className="h-4 w-4 text-orange-600" />;
      case 'cash': return <Banknote className="h-4 w-4 text-green-600" />;
      case 'credit_card': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'debit_card': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'paid': { label: 'Pago', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'overdue': { label: 'Em Atraso', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800', icon: FileSignature },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.className} font-medium border px-3 py-1 flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (!installment || !agreementData) return null;

  const isOverdue = installment.status === 'overdue';
  const daysOverdue = isOverdue 
    ? Math.ceil((new Date().getTime() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Receipt className="mr-2 h-6 w-6 text-green-600" />
            Registrar Pagamento - Parcela #{installment.installment_number}
          </DialogTitle>
          <p className="text-sm text-slate-600">
            Cliente: <span className="font-semibold">{agreementData.client_name}</span>
            {agreementData.case_number && (
              <span className="ml-2 font-mono">({agreementData.case_number})</span>
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center">
                  <Target className="mr-2 h-5 w-5 text-blue-600" />
                  Informações da Parcela
                </div>
                {getStatusBadge(installment.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Valor Original</p>
                  <p className="text-xl font-bold text-blue-800">
                    {formatCurrency(installment.amount)}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Vencimento</p>
                  <p className="text-lg font-semibold text-green-800">
                    {formatDate(installment.due_date)}
                  </p>
                </div>
                {isOverdue && (
                  <>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">Dias em Atraso</p>
                      <p className="text-xl font-bold text-red-800">
                        {daysOverdue}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-orange-600 font-medium">Total com Juros</p>
                      <p className="text-xl font-bold text-orange-800">
                        {formatCurrency(calculatedFees.totalAmount)}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {isOverdue && (
                <div className="mt-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Parcela em atraso!</strong> Foram calculadas automaticamente a multa de 
                      {agreementData.late_payment_fee}% e juros de {agreementData.late_payment_daily_interest}% ao dia.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>

          {isOverdue && (
            <Card className="border-orange-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <Calculator className="mr-2 h-5 w-5 text-orange-600" />
                  Cálculo de Taxas e Juros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded">
                    <span className="text-sm text-slate-600">Valor da parcela:</span>
                    <span className="font-semibold">{formatCurrency(installment.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span className="text-sm text-red-600">Multa por atraso ({agreementData.late_payment_fee}%):</span>
                    <span className="font-semibold text-red-700">{formatCurrency(calculatedFees.lateFee)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                    <span className="text-sm text-orange-600">Juros de mora ({daysOverdue} dias × {agreementData.late_payment_daily_interest}%):</span>
                    <span className="font-semibold text-orange-700">{formatCurrency(calculatedFees.interest)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded border border-blue-200">
                    <span className="text-base font-medium text-blue-700">Total a pagar:</span>
                    <span className="text-xl font-bold text-blue-800">{formatCurrency(calculatedFees.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="mr-2 h-5 w-5 text-purple-600" />
                Dados do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Valor Pago *
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={String(paymentData.amount_paid)} 
                    onChange={e => handleChange('amount_paid', Number(e.target.value))}
                    className="h-11 text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Data do Pagamento *
                  </Label>
                  <Input 
                    type="date" 
                    value={paymentData.payment_date} 
                    onChange={e => handleChange('payment_date', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Método de Pagamento *</Label>
                  <Select value={paymentData.payment_method} onValueChange={value => handleChange('payment_method', value)}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(paymentData.payment_method)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          PIX
                        </div>
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-blue-600" />
                          Transferência Bancária
                        </div>
                      </SelectItem>
                      <SelectItem value="check">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-orange-600" />
                          Cheque
                        </div>
                      </SelectItem>
                      <SelectItem value="cash">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-green-600" />
                          Dinheiro
                        </div>
                      </SelectItem>
                      <SelectItem value="credit_card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-purple-600" />
                          Cartão de Crédito
                        </div>
                      </SelectItem>
                      <SelectItem value="debit_card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          Cartão de Débito
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Referência do Pagamento</Label>
                  <Input 
                    placeholder="Comprovante, TID, etc." 
                    value={paymentData.payment_reference} 
                    onChange={e => handleChange('payment_reference', e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Multa Paga
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={String(paymentData.late_fee_paid)} 
                    onChange={e => handleChange('late_fee_paid', Number(e.target.value))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Percent className="h-4 w-4 text-orange-600" />
                    Juros Pagos
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={String(paymentData.interest_paid)} 
                    onChange={e => handleChange('interest_paid', Number(e.target.value))}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    Desconto Aplicado
                  </Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    value={String(paymentData.discount_applied)} 
                    onChange={e => handleChange('discount_applied', Number(e.target.value))}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea 
                  placeholder="Observações sobre o pagamento..."
                  value={paymentData.notes} 
                  onChange={e => handleChange('notes', e.target.value)}
                  className="min-h-16"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-lg text-green-800">
                <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                Resumo do Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Valor da parcela:</span>
                  <span className="font-medium">{formatCurrency(installment.amount)}</span>
                </div>
                {paymentData.late_fee_paid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Multa:</span>
                    <span className="font-medium text-red-700">{formatCurrency(paymentData.late_fee_paid)}</span>
                  </div>
                )}
                {paymentData.interest_paid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Juros:</span>
                    <span className="font-medium text-orange-700">{formatCurrency(paymentData.interest_paid)}</span>
                  </div>
                )}
                {paymentData.discount_applied > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Desconto:</span>
                    <span className="font-medium text-green-700">-{formatCurrency(paymentData.discount_applied)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-slate-900">Total Pago:</span>
                  <span className="text-green-700">{formatCurrency(paymentData.amount_paid)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {paymentData.amount_paid < installment.amount && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                O valor pago é menor que o valor da parcela. Este pagamento será registrado como pagamento parcial.
              </AlertDescription>
            </Alert>
          )}

          {paymentData.amount_paid > (installment.amount + calculatedFees.lateFee + calculatedFees.interest) && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                O valor pago é maior que o esperado. Verifique se está correto ou considere aplicar um desconto.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="pt-6 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Receipt className="h-4 w-4" />
                Pagamento da parcela #{installment.installment_number}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={recordPaymentMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {recordPaymentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Confirmar Pagamento
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
