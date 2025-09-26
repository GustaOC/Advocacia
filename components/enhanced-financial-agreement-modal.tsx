// components/enhanced-financial-agreement-modal.tsx - VERSÃO CORRIGIDA E COMPLETA
"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller, ControllerRenderProps, FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EnhancedAgreementSchema } from "@/lib/schemas";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, DollarSign, Save, Calculator, Calendar, CreditCard, Scale, FileSignature, Handshake, Store, Users, Gavel, Info, Building, UserCheck, PiggyBank, Percent, CalendarDays, Target, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Tipagens
type FormData = z.infer<typeof EnhancedAgreementSchema>;

interface Entity {
  id: number;
  name: string;
  document?: string;
}

interface EnhancedFinancialAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement?: any; // Para edição
  caseId?: number;
  clientEntityId?: number;
  executedEntityId?: number;
}

// Função para buscar entidades
const fetchEntities = async (): Promise<Entity[]> => {
  const response = await fetch('/api/entities');
  if (!response.ok) throw new Error('Falha ao buscar entidades.');
  const data = await response.json();
  return data.entities; // Assumindo que a API retorna { entities: [...] }
};

export function EnhancedFinancialAgreementModal({
  isOpen,
  onClose,
  agreement,
  caseId,
  clientEntityId,
  executedEntityId,
}: EnhancedFinancialAgreementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basico");
  const isEditing = !!agreement;

  const { data: entities = [], isLoading: isLoadingEntities } = useQuery<Entity[]>({
    queryKey: ["entities"],
    queryFn: fetchEntities,
    enabled: isOpen,
  });

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(EnhancedAgreementSchema),
    defaultValues: isEditing ? {
      ...agreement,
      total_value: Number(agreement.total_value),
      entry_value: Number(agreement.entry_value || 0),
      installments: Number(agreement.installments),
      installment_value: Number(agreement.installment_value),
      first_due_date: new Date(agreement.first_due_date).toISOString().split('T')[0],
      contract_signed_date: agreement.contract_signed_date ? new Date(agreement.contract_signed_date).toISOString().split('T')[0] : null,
    } : {
      case_id: caseId,
      client_entity_id: clientEntityId,
      executed_entity_id: executedEntityId,
      agreement_type: 'Extrajudicial',
      total_value: 0,
      entry_value: 0,
      installments: 1,
      installment_value: 0,
      first_due_date: new Date().toISOString().split('T')[0],
      installment_interval: 'monthly',
      status: 'active',
      has_court_release: false,
      payment_method: 'pix',
      late_payment_fee: 2,
      late_payment_daily_interest: 0.033,
      renegotiation_count: 0,
      notes: '',
    },
  });

  const totalValue = watch("total_value");
  const entryValue = watch("entry_value");
  const installmentsCount = watch("installments");

  useEffect(() => {
    const total = Number(totalValue) || 0;
    const entry = Number(entryValue) || 0;
    const count = Number(installmentsCount) || 1;

    if (count > 0 && total > 0) {
      const remainingValue = total - entry;
      const calculatedInstallmentValue = parseFloat((remainingValue / count).toFixed(2));
      setValue("installment_value", calculatedInstallmentValue, { shouldValidate: true });
    } else {
      setValue("installment_value", 0);
    }
  }, [totalValue, entryValue, installmentsCount, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const url = isEditing ? `/api/financial-agreements/${agreement.id}` : "/api/financial-agreements";
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} o acordo.`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: `Acordo ${isEditing ? "atualizado" : "criado"} com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ["financialAgreements"] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };
  
  // Funções de ícone reintegradas
  const getAgreementTypeIcon = (type: string) => {
     switch(type) {
       case 'Judicial': return <Scale className="h-4 w-4" />;
       case 'Extrajudicial': return <FileSignature className="h-4 w-4" />;
       case 'Em Audiência': return <Handshake className="h-4 w-4" />;
       case 'Pela Loja': return <Store className="h-4 w-4" />;
       default: return <Scale className="h-4 w-4" />;
     }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch(method) {
      case 'pix': return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'bank_transfer': return <Building className="h-4 w-4 text-blue-600" />;
      case 'check': return <FileSignature className="h-4 w-4 text-orange-600" />;
      case 'cash': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'credit_card': return <CreditCard className="h-4 w-4 text-purple-600" />;
      case 'debit_card': return <CreditCard className="h-4 w-4 text-blue-600" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <DollarSign className="mr-2 h-6 w-6 text-green-600" />
            {isEditing ? 'Editar Acordo Financeiro' : 'Criar Novo Acordo Financeiro'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico"><DollarSign className="mr-2 h-4 w-4" /> Básico</TabsTrigger>
              <TabsTrigger value="parcelas"><Calendar className="mr-2 h-4 w-4" /> Parcelas</TabsTrigger>
              <TabsTrigger value="pagamento"><CreditCard className="mr-2 h-4 w-4" /> Pagamento</TabsTrigger>
              <TabsTrigger value="avancado"><Gavel className="mr-2 h-4 w-4" /> Avançado</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-1 mt-4">
              {/* ABA BÁSICO */}
              <TabsContent value="basico" className="space-y-6">
                 <Card>
                    <CardHeader><CardTitle>Informações do Acordo</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo de Acordo</Label>
                                <Controller
                                  name="agreement_type"
                                  control={control}
                                  render={({ field }: { field: ControllerRenderProps<FormData, 'agreement_type'> }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <SelectTrigger><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Judicial">Judicial</SelectItem>
                                        <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                                        <SelectItem value="Em Audiência">Em Audiência</SelectItem>
                                        <SelectItem value="Pela Loja">Pela Loja</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
                                {errors.agreement_type && <p className="text-red-500 text-sm mt-1">{errors.agreement_type.message}</p>}
                            </div>
                            <div>
                                <Label>Cliente</Label>
                                <Controller
                                  name="client_entity_id"
                                  control={control}
                                  render={({ field }: { field: ControllerRenderProps<FormData, 'client_entity_id'> }) => (
                                    <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value ?? '')} disabled={isLoadingEntities}>
                                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                      <SelectContent>{entities.map(e => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                  )}
                                />
                                {errors.client_entity_id && <p className="text-red-500 text-sm mt-1">{errors.client_entity_id.message}</p>}
                            </div>
                        </div>
                    </CardContent>
                 </Card>
              </TabsContent>

              {/* ABA PARCELAS */}
              <TabsContent value="parcelas" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Valores e Parcelamento</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <Label>Valor Total (R$)</Label>
                                <Controller name="total_value" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value || '0'))}/>} />
                                {errors.total_value && <p className="text-red-500 text-sm mt-1">{errors.total_value.message}</p>}
                            </div>
                            <div>
                                <Label>Valor de Entrada (R$)</Label>
                                <Controller name="entry_value" control={control} render={({ field }) => <Input type="number" step="0.01" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value || '0'))}/>} />
                                {errors.entry_value && <p className="text-red-500 text-sm mt-1">{errors.entry_value.message}</p>}
                            </div>
                            <div>
                                <Label>Nº de Parcelas</Label>
                                <Controller name="installments" control={control} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value || '1', 10))}/>} />
                                {errors.installments && <p className="text-red-500 text-sm mt-1">{errors.installments.message}</p>}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                           <div>
                                <Label>Valor da Parcela (calculado)</Label>
                                <Controller name="installment_value" control={control} render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />} />
                                {errors.installment_value && <p className="text-red-500 text-sm mt-1">{errors.installment_value.message}</p>}
                            </div>
                             <div>
                                <Label>1º Vencimento</Label>
                                <Controller name="first_due_date" control={control} render={({ field }) => <Input type="date" {...field} value={field.value ?? ''} />} />
                                {errors.first_due_date && <p className="text-red-500 text-sm mt-1">{errors.first_due_date.message}</p>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
              
              {/* ABA PAGAMENTO */}
              <TabsContent value="pagamento" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Taxas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <Label>Multa por Atraso (%)</Label>
                                <Controller name="late_payment_fee" control={control} render={({ field }) => <Input type="number" step="0.1" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
                                {errors.late_payment_fee && <p className="text-red-500 text-sm mt-1">{errors.late_payment_fee.message}</p>}
                            </div>
                            <div>
                                <Label>Juros de Mora ao Dia (%)</Label>
                                <Controller name="late_payment_daily_interest" control={control} render={({ field }) => <Input type="number" step="0.001" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value))}/>} />
                                {errors.late_payment_daily_interest && <p className="text-red-500 text-sm mt-1">{errors.late_payment_daily_interest.message}</p>}
                            </div>
                         </div>
                    </CardContent>
                </Card>
              </TabsContent>

              {/* ABA AVANÇADO */}
              <TabsContent value="avancado" className="space-y-6">
                <Card>
                    <CardHeader><CardTitle>Opções Avançadas</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                           <Controller name="has_court_release" control={control} render={({ field }) => <Checkbox id="has_court_release" checked={field.value} onCheckedChange={field.onChange} />} />
                           <Label htmlFor="has_court_release">Possui Alvará Judicial?</Label>
                        </div>
                        <div className="col-span-full">
                           <Label>Observações</Label>
                           <Controller name="notes" control={control} render={({ field }) => <Textarea {...field} value={field.value ?? ''} rows={4}/>} />
                        </div>
                    </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="pt-4 border-t mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>) : (isEditing ? "Salvar Alterações" : "Criar Acordo")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}