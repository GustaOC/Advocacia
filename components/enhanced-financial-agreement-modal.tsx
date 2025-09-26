// components/enhanced-financial-agreement-modal.tsx - MODAL COMPLETAMENTE EXPANDIDO
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, DollarSign, Save, Calculator, Calendar, CreditCard, 
  Scale, FileSignature, Handshake, Store, Users, Gavel, AlertCircle,
  Info, Building, UserCheck, Phone, Mail, PiggyBank, Percent,
  CalendarDays, Target, TrendingUp, Clock, CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Tipagens expandidas
interface EnhancedAgreementFormData {
  case_id: number | null;
  client_entity_id: number | null;
  executed_entity_id?: number | null;
  agreement_type: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | 'Pela Loja';
  total_value: number | string;
  entry_value: number | string;
  installments: number | string;
  installment_value: number | string;
  first_due_date: string;
  installment_interval: 'monthly' | 'biweekly' | 'weekly' | 'custom';
  payment_method: 'bank_transfer' | 'pix' | 'check' | 'cash' | 'credit_card' | 'debit_card';
  bank_account_info?: string;
  has_court_release: boolean;
  court_release_value?: number | string;
  guarantor_entity_id?: number | null;
  late_payment_fee: number;
  late_payment_daily_interest: number;
  contract_signed_date?: string;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  notes?: string;
}

interface Case {
  id: number;
  title: string;
  case_number: string | null;
  case_parties: { role: string; entities: { id: number; name: string } }[];
}

interface Entity {
  id: number;
  name: string;
  document?: string;
  email?: string;
  phone?: string;
}

interface EnhancedFinancialAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData?: Case | null;
  agreementData?: any | null; // Para edição
  mode?: 'create' | 'edit';
}

export function EnhancedFinancialAgreementModal({ 
  isOpen, 
  onClose, 
  caseData, 
  agreementData, 
  mode = 'create' 
}: EnhancedFinancialAgreementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("basico");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);
  
  const [formData, setFormData] = useState<EnhancedAgreementFormData>({
    case_id: null,
    client_entity_id: null,
    executed_entity_id: null,
    agreement_type: 'Judicial',
    total_value: '',
    entry_value: '',
    installments: 1,
    installment_value: '',
    first_due_date: '',
    installment_interval: 'monthly',
    payment_method: 'pix',
    has_court_release: false,
    court_release_value: '',
    late_payment_fee: 2,
    late_payment_daily_interest: 0.033,
    status: 'active',
  });

  // Carregar entidades
  useEffect(() => {
    const loadEntities = async () => {
      setIsLoadingEntities(true);
      try {
        const entitiesData = await apiClient.getEntities();
        setEntities(entitiesData);
      } catch (error) {
        toast({ title: "Erro ao carregar entidades", variant: "destructive" });
      } finally {
        setIsLoadingEntities(false);
      }
    };

    if (isOpen) {
      loadEntities();
    }
  }, [isOpen, toast]);

  // Pré-preencher formulário
  useEffect(() => {
    if (mode === 'create' && caseData) {
      const clientParty = caseData.case_parties.find(p => p.role === 'Cliente');
      const executedParty = caseData.case_parties.find(p => p.role === 'Executado');
      
      setFormData(prev => ({
        ...prev,
        case_id: caseData.id,
        client_entity_id: clientParty?.entities.id ?? null,
        executed_entity_id: executedParty?.entities.id ?? null,
      }));
    } else if (mode === 'edit' && agreementData) {
      setFormData({
        ...agreementData,
        total_value: String(agreementData.total_value),
        entry_value: String(agreementData.entry_value || ''),
        installments: String(agreementData.installments),
        installment_value: String(agreementData.installment_value),
        court_release_value: agreementData.court_release_value ? String(agreementData.court_release_value) : '',
      });
    }
  }, [caseData, agreementData, mode]);

  // Calcular valor da parcela automaticamente
  const calculatedInstallmentValue = useMemo(() => {
    const total = Number(formData.total_value) || 0;
    const entry = Number(formData.entry_value) || 0;
    const installments = Number(formData.installments) || 1;
    
    if (total <= 0 || installments <= 0) return 0;
    
    return (total - entry) / installments;
  }, [formData.total_value, formData.entry_value, formData.installments]);

  // Atualizar valor da parcela quando necessário
  useEffect(() => {
    if (calculatedInstallmentValue > 0) {
      setFormData(prev => ({
        ...prev,
        installment_value: calculatedInstallmentValue.toFixed(2)
      }));
    }
  }, [calculatedInstallmentValue]);

  const handleChange = (field: keyof EnhancedAgreementFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const createAgreementMutation = useMutation({
    mutationFn: (agreementData: EnhancedAgreementFormData) => {
      const numericData = {
        ...agreementData,
        total_value: Number(agreementData.total_value),
        entry_value: Number(agreementData.entry_value || 0),
        installments: Number(agreementData.installments),
        installment_value: Number(agreementData.installment_value),
        court_release_value: agreementData.court_release_value ? Number(agreementData.court_release_value) : null,
      };
      
      if (mode === 'edit' && agreementData?.id) {
        return apiClient.updateFinancialAgreement(String(agreementData.id), numericData);
      } else {
        return apiClient.createFinancialAgreement(numericData);
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Sucesso!", 
        description: `Acordo financeiro ${mode === 'edit' ? 'atualizado' : 'criado'} com sucesso.` 
      });
      queryClient.invalidateQueries({ queryKey: ['financialAgreements'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: `Erro ao ${mode === 'edit' ? 'atualizar' : 'criar'} acordo`, 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSave = () => {
    // Validações básicas
    if (!formData.case_id || !formData.client_entity_id || !formData.total_value) {
      toast({ 
        title: "Campos obrigatórios", 
        description: "Caso, Cliente e Valor Total são obrigatórios.", 
        variant: "destructive"
      });
      return;
    }

    if (Number(formData.total_value) <= 0) {
      toast({ 
        title: "Valor inválido", 
        description: "O valor total deve ser maior que zero.", 
        variant: "destructive"
      });
      return;
    }

    if (!formData.first_due_date) {
      toast({ 
        title: "Data obrigatória", 
        description: "A data de vencimento da primeira parcela é obrigatória.", 
        variant: "destructive"
      });
      return;
    }

    createAgreementMutation.mutate(formData);
  };

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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <DollarSign className="mr-2 h-6 w-6 text-green-600" />
            {mode === 'edit' ? 'Editar Acordo Financeiro' : 'Criar Novo Acordo Financeiro'}
          </DialogTitle>
          {caseData && (
            <DialogDescription className="text-base">
              Acordo para o caso: <span className="font-semibold">{caseData.title}</span>
              {caseData.case_number && (
                <span className="ml-2 font-mono text-sm">({caseData.case_number})</span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Básico</span>
              </TabsTrigger>
              <TabsTrigger value="parcelas" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Parcelas</span>
              </TabsTrigger>
              <TabsTrigger value="pagamento" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamento</span>
              </TabsTrigger>
              <TabsTrigger value="avancado" className="flex items-center gap-2">
                <Gavel className="h-4 w-4" />
                <span className="hidden sm:inline">Avançado</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA BÁSICO */}
            <TabsContent value="basico" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Scale className="mr-2 h-5 w-5 text-blue-600" />
                    Informações do Acordo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Acordo *</Label>
                      <Select value={formData.agreement_type} onValueChange={value => handleChange('agreement_type', value)}>
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            {getAgreementTypeIcon(formData.agreement_type)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Judicial">
                            <div className="flex items-center gap-2">
                              <Scale className="h-4 w-4 text-blue-600" />
                              Judicial
                            </div>
                          </SelectItem>
                          <SelectItem value="Extrajudicial">
                            <div className="flex items-center gap-2">
                              <FileSignature className="h-4 w-4 text-green-600" />
                              Extrajudicial
                            </div>
                          </SelectItem>
                          <SelectItem value="Em Audiência">
                            <div className="flex items-center gap-2">
                              <Handshake className="h-4 w-4 text-orange-600" />
                              Em Audiência
                            </div>
                          </SelectItem>
                          <SelectItem value="Pela Loja">
                            <div className="flex items-center gap-2">
                              <Store className="h-4 w-4 text-purple-600" />
                              Pela Loja
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status do Acordo</Label>
                      <Select value={formData.status} onValueChange={value => handleChange('status', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                          <SelectItem value="defaulted">Em Atraso</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cliente *</Label>
                      <Select 
                        value={String(formData.client_entity_id || '')} 
                        onValueChange={value => handleChange('client_entity_id', Number(value))}
                        disabled={isLoadingEntities || mode === 'edit'}
                      >
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <SelectValue placeholder="Selecione o cliente" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {entities.filter(e => e.name.toLowerCase().includes('client')).map(entity => (
                            <SelectItem key={entity.id} value={String(entity.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{entity.name}</span>
                                {entity.document && (
                                  <span className="text-xs text-slate-500">{entity.document}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Executado</Label>
                      <Select 
                        value={String(formData.executed_entity_id || '')} 
                        onValueChange={value => handleChange('executed_entity_id', value ? Number(value) : null)}
                        disabled={isLoadingEntities || mode === 'edit'}
                      >
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-orange-600" />
                            <SelectValue placeholder="Selecione o executado" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {entities.map(entity => (
                            <SelectItem key={entity.id} value={String(entity.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{entity.name}</span>
                                {entity.document && (
                                  <span className="text-xs text-slate-500">{entity.document}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA PARCELAS */}
            <TabsContent value="parcelas" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Calculator className="mr-2 h-5 w-5 text-green-600" />
                    Cálculo de Valores e Parcelas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Valor Total do Acordo *
                      </Label>
                      <Input 
                        type="number" 
                        placeholder="10000,00" 
                        value={String(formData.total_value)} 
                        onChange={e => handleChange('total_value', e.target.value)}
                        className="h-11 text-lg font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <PiggyBank className="h-4 w-4 text-blue-600" />
                        Valor de Entrada
                      </Label>
                      <Input 
                        type="number" 
                        placeholder="2000,00" 
                        value={String(formData.entry_value)} 
                        onChange={e => handleChange('entry_value', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        Número de Parcelas *
                      </Label>
                      <Input 
                        type="number" 
                        min="1" 
                        max="120" 
                        value={String(formData.installments)} 
                        onChange={e => handleChange('installments', e.target.value)}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-orange-600" />
                        Valor da Parcela
                      </Label>
                      <Input 
                        type="number" 
                        value={String(formData.installment_value)} 
                        onChange={e => handleChange('installment_value', e.target.value)}
                        className="h-11 font-semibold"
                        readOnly
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-600" />
                        Intervalo entre Parcelas
                      </Label>
                      <Select value={formData.installment_interval} onValueChange={value => handleChange('installment_interval', value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-red-600" />
                      Data de Vencimento da 1ª Parcela *
                    </Label>
                    <Input 
                      type="date" 
                      value={formData.first_due_date || ''} 
                      onChange={e => handleChange('first_due_date', e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Resumo Visual */}
                  <Card className="bg-slate-50 border-slate-200">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-slate-600">Valor Total</p>
                          <p className="text-lg font-bold text-slate-900">
                            R$ {Number(formData.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Entrada</p>
                          <p className="text-lg font-bold text-blue-600">
                            R$ {Number(formData.entry_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">A Parcelar</p>
                          <p className="text-lg font-bold text-orange-600">
                            R$ {((Number(formData.total_value || 0)) - (Number(formData.entry_value || 0))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Por Parcela</p>
                          <p className="text-lg font-bold text-green-600">
                            R$ {calculatedInstallmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA PAGAMENTO */}
            <TabsContent value="pagamento" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <CreditCard className="mr-2 h-5 w-5 text-purple-600" />
                    Forma de Pagamento e Taxas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Forma de Pagamento Preferida</Label>
                      <Select value={formData.payment_method} onValueChange={value => handleChange('payment_method', value)}>
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(formData.payment_method)}
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
                              <FileSignature className="h-4 w-4 text-orange-600" />
                              Cheque
                            </div>
                          </SelectItem>
                          <SelectItem value="cash">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
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
                      <Label>Data de Assinatura do Contrato</Label>
                      <Input 
                        type="date" 
                        value={formData.contract_signed_date || ''} 
                        onChange={e => handleChange('contract_signed_date', e.target.value)}
                        className="h-11"
                      />
                    </div>
                  </div>

                  {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'pix') && (
                    <div className="space-y-2">
                      <Label>Informações da Conta Bancária / PIX</Label>
                      <Textarea 
                        placeholder="Ex: Banco do Brasil, Ag: 1234-5, CC: 12345-6, PIX: exemplo@email.com"
                        value={formData.bank_account_info || ''} 
                        onChange={e => handleChange('bank_account_info', e.target.value)}
                        className="min-h-20"
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-red-600" />
                        Taxa de Multa por Atraso (%)
                      </Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.1"
                        value={String(formData.late_payment_fee)} 
                        onChange={e => handleChange('late_payment_fee', Number(e.target.value))}
                        className="h-11"
                      />
                      <p className="text-xs text-slate-500">Padrão: 2% sobre o valor em atraso</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600" />
                        Juros de Mora ao Dia (%)
                      </Label>
                      <Input 
                        type="number" 
                        min="0" 
                        max="1" 
                        step="0.001"
                        value={String(formData.late_payment_daily_interest)} 
                        onChange={e => handleChange('late_payment_daily_interest', Number(e.target.value))}
                        className="h-11"
                      />
                      <p className="text-xs text-slate-500">Padrão: 0.033% ao dia (1% ao mês)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA AVANÇADO */}
            <TabsContent value="avancado" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Gavel className="mr-2 h-5 w-5 text-purple-600" />
                      Alvará Judicial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="has_court_release"
                        checked={formData.has_court_release}
                        onCheckedChange={checked => handleChange('has_court_release', checked)}
                      />
                      <Label htmlFor="has_court_release" className="text-base font-medium">
                        Este acordo gerará alvará judicial
                      </Label>
                    </div>

                    {formData.has_court_release && (
                      <div className="space-y-2 pl-6 border-l-2 border-purple-200">
                        <Label>Valor Esperado do Alvará</Label>
                        <Input 
                          type="number" 
                          placeholder="15000,00" 
                          value={String(formData.court_release_value)} 
                          onChange={e => handleChange('court_release_value', e.target.value)}
                          className="h-11"
                        />
                        <p className="text-xs text-slate-500">
                          Valor que será liberado pelo tribunal após cumprimento do acordo
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
                      Garantias
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Avalista/Fiador (Opcional)</Label>
                      <Select 
                        value={String(formData.guarantor_entity_id || '')} 
                        onValueChange={value => handleChange('guarantor_entity_id', value ? Number(value) : null)}
                        disabled={isLoadingEntities}
                      >
                        <SelectTrigger className="h-11">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-blue-600" />
                            <SelectValue placeholder="Selecionar avalista/fiador" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {entities.map(entity => (
                            <SelectItem key={entity.id} value={String(entity.id)}>
                              <div className="flex flex-col">
                                <span className="font-medium">{entity.name}</span>
                                {entity.document && (
                                  <span className="text-xs text-slate-500">{entity.document}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Info className="mr-2 h-5 w-5 text-slate-600" />
                    Observações Adicionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Observações e Cláusulas Especiais</Label>
                    <Textarea 
                      placeholder="Observações sobre o acordo, cláusulas especiais, condições específicas..."
                      value={formData.notes || ''} 
                      onChange={e => handleChange('notes', e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-6 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={createAgreementMutation.isPending}
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
          >
            {createAgreementMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'edit' ? 'Salvar Alterações' : 'Criar Acordo'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}