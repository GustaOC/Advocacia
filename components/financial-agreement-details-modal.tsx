// components/financial-agreement-details-modal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, Calendar, Users, Gavel, CreditCard, Phone, Mail, 
  MapPin, FileText, Clock, CheckCircle, AlertTriangle, TrendingUp,
  Eye, Edit, Download, Send, RefreshCw, Calculator, Target,
  Building, Scale, FileSignature, Handshake, Store, UserCheck,
  PiggyBank, Receipt, Banknote, CalendarDays, Info, History
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";

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

interface PaymentHistory {
  id: number;
  installment_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  late_fee: number;
  interest: number;
}

interface FinancialAgreementDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agreement: FinancialAgreement | null;
  onEdit?: (agreement: FinancialAgreement) => void;
  onRenegotiate?: (agreement: FinancialAgreement) => void;
  onSendMessage?: (agreement: FinancialAgreement) => void;
}

export function FinancialAgreementDetailsModal({ 
  isOpen, 
  onClose, 
  agreement,
  onEdit,
  onRenegotiate,
  onSendMessage 
}: FinancialAgreementDetailsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("resumo");

  // Buscar parcelas do acordo
  const { data: installments } = useQuery<Installment[]>({
    queryKey: ['agreementInstallments', agreement?.id],
    queryFn: () => agreement ? apiClient.getAgreementInstallments(String(agreement.id)) : Promise.resolve([]),
    enabled: !!agreement && isOpen,
  });

  // Buscar histórico de pagamentos
  const { data: paymentHistory } = useQuery<PaymentHistory[]>({
    queryKey: ['agreementPaymentHistory', agreement?.id],
    queryFn: () => agreement ? apiClient.getAgreementPaymentHistory(String(agreement.id)) : Promise.resolve([]),
    enabled: !!agreement && isOpen,
  });

  if (!agreement) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { label: 'Ativo', className: 'bg-green-100 text-green-800 border-green-200' },
      'completed': { label: 'Concluído', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'defaulted': { label: 'Em Atraso', className: 'bg-red-100 text-red-800 border-red-200' },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'renegotiated': { label: 'Renegociado', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge className={`${config.className} font-semibold border px-3 py-1`}>{config.label}</Badge>;
  };

  const getInstallmentStatusBadge = (status: string) => {
    const variants = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'paid': { label: 'Pago', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'overdue': { label: 'Em Atraso', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800', icon: FileText },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.className} font-medium border px-2 py-1 text-xs flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getAgreementTypeIcon = (type: string) => {
    switch(type) {
      case 'Judicial': return <Scale className="h-5 w-5 text-blue-600" />;
      case 'Extrajudicial': return <FileSignature className="h-5 w-5 text-green-600" />;
      case 'Em Audiência': return <Handshake className="h-5 w-5 text-orange-600" />;
      case 'Pela Loja': return <Store className="h-5 w-5 text-purple-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
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

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <span>Acordo Financeiro #{agreement.id}</span>
                <div className="flex items-center gap-2 mt-1">
                  {getAgreementTypeIcon(agreement.agreement_type)}
                  <span className="text-sm font-normal text-slate-600">
                    {agreement.agreement_type}
                  </span>
                  {getStatusBadge(agreement.status)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={() => onEdit(agreement)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              )}
              {onRenegotiate && (
                <Button variant="outline" size="sm" onClick={() => onRenegotiate(agreement)}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Renegociar
                </Button>
              )}
              {onSendMessage && (
                <Button variant="outline" size="sm" onClick={() => onSendMessage(agreement)}>
                  <Send className="h-4 w-4 mr-1" />
                  Mensagem
                </Button>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="partes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Partes</span>
              </TabsTrigger>
              <TabsTrigger value="parcelas" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Parcelas</span>
              </TabsTrigger>
              <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Pagamentos</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
            </TabsList>

            {/* ABA RESUMO */}
            <TabsContent value="resumo" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card Principal do Acordo */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <Calculator className="mr-2 h-5 w-5 text-green-600" />
                      Valores do Acordo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-600 font-medium">Valor Total</p>
                        <p className="text-2xl font-bold text-blue-800">
                          {formatCurrency(agreement.total_value)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600 font-medium">Entrada</p>
                        <p className="text-xl font-bold text-green-800">
                          {formatCurrency(agreement.entry_value)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-sm text-orange-600 font-medium">A Parcelar</p>
                        <p className="text-xl font-bold text-orange-800">
                          {formatCurrency(agreement.total_value - agreement.entry_value)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600 font-medium">Por Parcela</p>
                        <p className="text-xl font-bold text-purple-800">
                          {formatCurrency(agreement.installment_value)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">Progresso do Acordo</span>
                        <span className="text-sm font-bold text-slate-900">
                          {Math.round(agreement.completion_percentage || 0)}%
                        </span>
                      </div>
                      <Progress 
                        value={agreement.completion_percentage || 0} 
                        className="h-3" 
                      />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>
                          {formatCurrency(agreement.paid_amount || 0)} recebido
                        </span>
                        <span>
                          {formatCurrency(agreement.remaining_balance || 0)} restante
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Informações do Processo */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="mr-2 h-5 w-5 text-blue-600" />
                      Processo Vinculado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Número do Processo</Label>
                      <p className="text-lg font-mono font-semibold text-slate-900">
                        {agreement.cases.case_number || 'Sem número'}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Título do Caso</Label>
                      <p className="text-base font-medium text-slate-900">
                        {agreement.cases.title}
                      </p>
                    </div>
                    
                    {agreement.cases.court && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Vara/Tribunal</Label>
                        <p className="text-base text-slate-700">
                          {agreement.cases.court}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium text-slate-600">Status do Processo:</Label>
                      <Badge variant="outline" className="font-medium">
                        {agreement.cases.status}
                      </Badge>
                    </div>

                    {agreement.has_court_release && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Gavel className="h-5 w-5 text-purple-600" />
                          <span className="font-medium text-purple-800">Alvará Judicial</span>
                        </div>
                        <p className="text-sm text-purple-700">
                          Este acordo gerará alvará judicial
                        </p>
                        {agreement.court_release_value && (
                          <p className="text-sm font-semibold text-purple-800 mt-1">
                            Valor esperado: {formatCurrency(agreement.court_release_value)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Card Condições de Pagamento */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <CreditCard className="mr-2 h-5 w-5 text-purple-600" />
                    Condições de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        {getPaymentMethodIcon(agreement.payment_method)}
                        Forma de Pagamento
                      </Label>
                      <p className="text-base font-medium text-slate-900 capitalize">
                        {agreement.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        Parcelas
                      </Label>
                      <p className="text-base font-medium text-slate-900">
                        {agreement.paid_installments || 0} de {agreement.installments} pagas
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        Próximo Vencimento
                      </Label>
                      <p className="text-base font-medium text-slate-900">
                        {agreement.next_due_date ? formatDate(agreement.next_due_date) : 'N/A'}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Situação
                      </Label>
                      {agreement.days_overdue > 0 ? (
                        <p className="text-base font-medium text-red-600">
                          {agreement.days_overdue} dias em atraso
                        </p>
                      ) : (
                        <p className="text-base font-medium text-green-600">
                          Em dia
                        </p>
                      )}
                    </div>
                  </div>

                  {agreement.bank_account_info && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                      <Label className="text-sm font-medium text-slate-600 mb-2 block">
                        Informações para Pagamento
                      </Label>
                      <p className="text-sm text-slate-700 font-mono">
                        {agreement.bank_account_info}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {agreement.notes && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <FileText className="mr-2 h-5 w-5 text-slate-600" />
                      Observações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {agreement.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA PARTES */}
            <TabsContent value="partes" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cliente */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <UserCheck className="mr-2 h-5 w-5 text-green-600" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-slate-600">Nome</Label>
                      <p className="text-lg font-semibold text-slate-900">
                        {agreement.client_entities.name}
                      </p>
                    </div>
                    
                    {agreement.client_entities.document && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Documento</Label>
                        <p className="text-base font-mono text-slate-700">
                          {agreement.client_entities.document}
                        </p>
                      </div>
                    )}
                    
                    {agreement.client_entities.email && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-500" />
                          <p className="text-base text-slate-700">
                            {agreement.client_entities.email}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {agreement.client_entities.phone && (
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Telefone</Label>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-500" />
                          <p className="text-base text-slate-700">
                            {agreement.client_entities.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Executado */}
                {agreement.executed_entities && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center text-lg">
                        <Users className="mr-2 h-5 w-5 text-orange-600" />
                        Executado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Nome</Label>
                        <p className="text-lg font-semibold text-slate-900">
                          {agreement.executed_entities.name}
                        </p>
                      </div>
                      
                      {agreement.executed_entities.document && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Documento</Label>
                          <p className="text-base font-mono text-slate-700">
                            {agreement.executed_entities.document}
                          </p>
                        </div>
                      )}
                      
                      {agreement.executed_entities.email && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <p className="text-base text-slate-700">
                              {agreement.executed_entities.email}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {agreement.executed_entities.phone && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Telefone</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-500" />
                            <p className="text-base text-slate-700">
                              {agreement.executed_entities.phone}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Avalista/Fiador */}
              {agreement.guarantor_entities && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-lg">
                      <UserCheck className="mr-2 h-5 w-5 text-blue-600" />
                      Avalista/Fiador
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-slate-600">Nome</Label>
                        <p className="text-base font-semibold text-slate-900">
                          {agreement.guarantor_entities.name}
                        </p>
                      </div>
                      
                      {agreement.guarantor_entities.document && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Documento</Label>
                          <p className="text-base font-mono text-slate-700">
                            {agreement.guarantor_entities.document}
                          </p>
                        </div>
                      )}
                      
                      {agreement.guarantor_entities.phone && (
                        <div>
                          <Label className="text-sm font-medium text-slate-600">Telefone</Label>
                          <p className="text-base text-slate-700">
                            {agreement.guarantor_entities.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ABA PARCELAS */}
            <TabsContent value="parcelas" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                      Cronograma de Parcelas
                    </div>
                    <Badge variant="outline" className="font-semibold">
                      {installments?.length || 0} parcelas
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold text-slate-700">Parcela</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Vencimento</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Valor</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Pagamento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {installments?.map((installment, index) => (
                          <tr 
                            key={installment.id}
                            className={`
                              ${index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}
                              hover:bg-slate-50 transition-colors border-b border-slate-100
                              ${installment.status === 'overdue' ? 'bg-red-50/50' : ''}
                              ${installment.status === 'paid' ? 'bg-green-50/50' : ''}
                            `}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                                  {installment.installment_number}
                                </div>
                                <span className="font-medium text-slate-900">
                                  #{installment.installment_number}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-slate-900">
                                {formatDate(installment.due_date)}
                              </p>
                              {installment.status === 'overdue' && (
                                <p className="text-xs text-red-600 mt-1">
                                  {Math.floor((Date.now() - new Date(installment.due_date).getTime()) / (1000 * 60 * 60 * 24))} dias em atraso
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-slate-900">
                                {formatCurrency(installment.amount)}
                              </p>
                              {installment.late_fee_paid && installment.late_fee_paid > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  + {formatCurrency(installment.late_fee_paid)} multa
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              {getInstallmentStatusBadge(installment.status)}
                            </td>
                            <td className="p-4">
                              {installment.status === 'paid' && installment.paid_date ? (
                                <div>
                                  <p className="text-sm font-medium text-green-700">
                                    {formatDate(installment.paid_date)}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {formatCurrency(installment.amount_paid || installment.amount)}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-sm text-slate-500">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA PAGAMENTOS */}
            <TabsContent value="pagamentos" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <Receipt className="mr-2 h-5 w-5 text-green-600" />
                    Histórico de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="text-left p-4 font-semibold text-slate-700">Data</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Parcela</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Valor</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Método</th>
                            <th className="text-left p-4 font-semibold text-slate-700">Referência</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistory.map((payment, index) => (
                            <tr 
                              key={payment.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-slate-25'}
                            >
                              <td className="p-4">
                                <p className="font-medium text-slate-900">
                                  {formatDate(payment.payment_date)}
                                </p>
                              </td>
                              <td className="p-4">
                                <p className="text-slate-900">
                                  #{payment.installment_id}
                                </p>
                              </td>
                              <td className="p-4">
                                <p className="font-semibold text-green-700">
                                  {formatCurrency(payment.amount)}
                                </p>
                                {payment.late_fee > 0 && (
                                  <p className="text-xs text-orange-600">
                                    + {formatCurrency(payment.late_fee)} multa
                                  </p>
                                )}
                                {payment.interest > 0 && (
                                  <p className="text-xs text-red-600">
                                    + {formatCurrency(payment.interest)} juros
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  {getPaymentMethodIcon(payment.payment_method)}
                                  <span className="text-sm capitalize">
                                    {payment.payment_method.replace('_', ' ')}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <p className="text-sm text-slate-600 font-mono">
                                  {payment.reference || '-'}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 text-lg">Nenhum pagamento registrado</p>
                      <p className="text-slate-400">Os pagamentos aparecerão aqui quando forem registrados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA HISTÓRICO */}
            <TabsContent value="historico" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-lg">
                    <History className="mr-2 h-5 w-5 text-slate-600" />
                    Histórico de Alterações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">Acordo criado</p>
                        <p className="text-sm text-slate-600">
                          {formatDate(agreement.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    {agreement.renegotiation_count > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {agreement.renegotiation_count} renegociação(ões) realizada(s)
                          </p>
                          <p className="text-sm text-slate-600">
                            Último acordo modificado
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {agreement.updated_at && agreement.updated_at !== agreement.created_at && (
                      <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">Última atualização</p>
                          <p className="text-sm text-slate-600">
                            {formatDate(agreement.updated_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="pt-6 border-t">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>Acordo #{agreement.id} • Criado em {formatDate(agreement.created_at)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className = "", ...props }: any) {
  return (
    <label className={`block text-sm font-medium text-slate-700 ${className}`} {...props}>
      {children}
    </label>
  );
}