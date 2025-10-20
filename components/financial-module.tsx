// components/financial-module.tsx - VERSÃO COM CORREÇÃO E MELHORIAS
"use client";

import React, { useState, useMemo, useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus, DollarSign, Send, Loader2, AlertCircle, RefreshCw, TrendingUp, Receipt, CheckCircle,
  FileText, Calendar, CreditCard, Search, Eye, Edit, Users, Scale, Store,
  FileSignature, Handshake, Clock, ChevronDown, ChevronRight, Calculator,
  Phone, Mail, Banknote, Sparkles, Zap, Target, ArrowUp, ArrowDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement, type MonthlyInstallment, type ReceivedPayment, type Alvara } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FinancialAgreementModal } from "@/components/financial-agreement-modal";

// ===================== TIPOS & UTILS =====================
// O tipo Alvara agora é importado de 'api-client', mas o mantemos aqui como referência
// interface Alvara {
//   id: number; case_id: number; case_number: string; value: number; received: boolean;
//   issue_date: string; received_date?: string | null; creditor_name?: string; court?: string;
// }
interface Expense {
  id: number; description: string; category: string; value: number; date: string;
  status: 'pending' | 'paid'; due_date?: string; payment_method?: string; notes?: string;
}
interface OverdueInstallment {
  id: number; agreement_id: number; client_name: string; case_number: string;
  installment_number: number; value: number; due_date: string; days_overdue: number;
  total_agreement_value: number; client_contact?: { phone?: string; email?: string; };
}

type StatusUI = "PAGA" | "PENDENTE" | "ATRASADA";

function normalizeStatus(raw?: string): StatusUI {
  const s = String(raw ?? "").toUpperCase();
  if (["PAGO", "PAGA", "PAID"].includes(s)) return "PAGA";
  if (["ATRASADO", "ATRASADA", "OVERDUE"].includes(s)) return "ATRASADA";
  return "PENDENTE";
}

const formatCurrency = (value: number | null | undefined) => {
  const v = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "Data não informada";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "Data inválida";
  return d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

// ===================== MOCKS (Mantidos para despesas e atrasados, pois não foram migrados ainda) =====================
const mockExpenses: Expense[] = [
  { id: 1, description: 'Aluguel Escritório', category: 'Fixo', value: 2500, date: '2025-09-05', status: 'paid', payment_method: 'Transferência Bancária' },
  { id: 2, description: 'Software Jurídico', category: 'Software', value: 250, date: '2025-09-10', status: 'pending', due_date: '2025-09-15' },
];
const mockOverdueInstallments: OverdueInstallment[] = [
  { id: 1, agreement_id: 1, client_name: 'Carlos Mendes', case_number: '001/2024', installment_number: 3, value: 1200, due_date: '2024-08-15', days_overdue: 42, total_agreement_value: 15000, client_contact: { phone: '(11) 99999-1234', email: 'carlos@email.com' } },
];

// ===================== CÁLCULOS & HELPERS =====================
const calculateInstallmentInfo = (agreement: FinancialAgreement) => {
  const totalValue = agreement.total_amount || 0;
  const entryValue = agreement.down_payment || 0;
  const remainingValue = totalValue - entryValue;
  const numInstallments = agreement.number_of_installments || 0;
  const installmentValue = numInstallments > 0 ? remainingValue / numInstallments : 0;

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 30);
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - Date.now()) / (1000 * 3600 * 24));
  return { installmentValue, nextDueDate: nextDueDate.toISOString().split('T')[0], daysUntilDue };
};

// ===================== STATS COM DESIGN APERFEIÇOADO =====================
function FinancialStats({ agreements }: { agreements: FinancialAgreement[] }) {
  const stats = useMemo(() => {
    const totalValue = agreements.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const activeAgreements = agreements.filter(a => a.status === 'active').length;
    const totalInstallments = agreements.reduce((sum, a) => sum + (a.number_of_installments || 0), 0);
    const overdueAgreements = agreements.filter(a => a.status === 'defaulted').length;

    return [
      {
        label: "Valor Total em Acordos",
        value: formatCurrency(totalValue),
        icon: DollarSign,
        color: "text-blue-600",
        bg: "from-blue-50 to-blue-100",
        trend: "+5.2%",
        gradient: "from-blue-500 to-indigo-600"
      },
      {
        label: "Acordos Ativos",
        value: String(activeAgreements),
        icon: TrendingUp,
        color: "text-green-600",
        bg: "from-green-50 to-green-100",
        trend: `${activeAgreements} de ${agreements.length}`,
        gradient: "from-emerald-500 to-teal-600"
      },
      {
        label: "Total de Parcelas",
        value: String(totalInstallments),
        icon: Calculator,
        color: "text-purple-600",
        bg: "from-purple-50 to-purple-100",
        trend: `${agreements.length} acordos`,
        gradient: "from-purple-500 to-pink-600"
      },
      {
        label: "Parcelas em Atraso",
        value: String(overdueAgreements),
        icon: AlertCircle,
        color: "text-red-600",
        bg: "from-red-50 to-red-100",
        trend: overdueAgreements > 0 ? "Atenção!" : "Em dia",
        gradient: "from-red-500 to-rose-600"
      },
    ];
  }, [agreements]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon as any;
        return (
          <Card key={index} className="group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                    {stat.label}
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  </p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    {stat.trend.includes('+') ? (
                      <ArrowUp className="w-4 h-4 text-green-500" />
                    ) : stat.trend.includes('-') ? (
                      <ArrowDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <Target className="w-4 h-4 text-blue-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stat.trend.includes('+') ? 'text-green-600' :
                        stat.trend.includes('Atenção') ? 'text-red-600' : 'text-blue-600'
                      }`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <StatIcon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ===================== TAB "RECEBIDOS DO MÊS" (NOVA) =====================
function ReceivedPaymentsTab() {
  const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [isPending, startTransition] = useTransition();

  const { data: payments = [], isLoading, isError, error } = useQuery<ReceivedPayment[]>({
    queryKey: ['receivedPayments', selectedDate.year, selectedDate.month],
    queryFn: () => apiClient.getReceivedByMonth(selectedDate.year, selectedDate.month),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const totalReceived = useMemo(() => {
    return (payments || []).reduce((acc, payment) => acc + (Number(payment.amount_paid) || 0), 0);
  }, [payments]);

  const handleDateChange = (type: 'month' | 'year', value: string) => {
    startTransition(() => setSelectedDate(prev => ({ ...prev, [type]: parseInt(value) })));
  };

  const getPaymentMethodBadge = (method: string | null | undefined) => {
    const methodStr = (method || 'outros').toLowerCase();
    const config = {
      pix: { label: 'PIX', className: 'bg-emerald-100 text-emerald-800' },
      boleto: { label: 'Boleto', className: 'bg-orange-100 text-orange-800' },
      transferencia: { label: 'Transf.', className: 'bg-blue-100 text-blue-800' },
      cartao_credito: { label: 'Crédito', className: 'bg-purple-100 text-purple-800' },
      dinheiro: { label: 'Dinheiro', className: 'bg-green-100 text-green-800' },
      default: { label: methodStr, className: 'bg-slate-100 text-slate-800' }
    };
    const { label, className } = (config as any)[methodStr] || config.default;
    return <Badge className={`${className} border-0`}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-slate-700 font-semibold">Mês:</Label>
              <Select value={String(selectedDate.month)} onValueChange={(v) => handleDateChange('month', v)}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-slate-700 font-semibold">Ano:</Label>
              <Select value={String(selectedDate.year)} onValueChange={(v) => handleDateChange('year', v)}>
                <SelectTrigger className="w-[120px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                      {new Date().getFullYear() - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center justify-end">
                <div className="text-right">
                    <p className="text-sm text-slate-600 font-medium">Total Recebido no Mês</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                <TableHead className="text-slate-700 font-bold">Data Pag.</TableHead>
                <TableHead className="text-slate-700 font-bold">Cliente</TableHead>
                <TableHead className="text-slate-700 font-bold">Processo</TableHead>
                <TableHead className="text-slate-700 font-bold">Parcela</TableHead>
                <TableHead className="text-slate-700 font-bold">Método</TableHead>
                <TableHead className="text-right text-slate-700 font-bold">Valor Recebido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <Loader2 className="h-6 w-6 animate-spin" /> Carregando recebimentos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-red-600">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" /> Erro ao carregar dados: {String(error?.message || 'desconhecido')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhum pagamento recebido no período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id} className="group hover:bg-gradient-to-r hover:from-green-50/50 hover:to-transparent transition-all duration-200">
                    <TableCell className="font-mono">{formatDate(payment.payment_date)}</TableCell>
                    <TableCell className="font-medium text-slate-900 group-hover:text-green-700 transition-colors">{payment.client_name}</TableCell>
                    <TableCell>{payment.case_number || 'N/A'}</TableCell>
                    <TableCell className="text-center">{payment.installment_number}</TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.payment_method)}</TableCell>
                    <TableCell className="text-right font-semibold text-green-700">{formatCurrency(payment.amount_paid)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


// ===================== MONTHLY INSTALLMENTS COM DESIGN APERFEIÇOADO =====================
function MonthlyInstallmentsTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [isPending, startTransition] = useTransition();

  const { data: installments = [], isLoading, isError, error } = useQuery<MonthlyInstallment[]>({
    queryKey: ['monthlyInstallments', selectedDate.year, selectedDate.month],
    queryFn: () => apiClient.getInstallmentsByMonth(selectedDate.year, selectedDate.month),
    retry: 3,
    retryDelay: 1000,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const getPartiesInfo = (installment: MonthlyInstallment) => {
    const caseParties = installment.agreement?.cases?.case_parties;
    let clientName = installment.agreement?.debtor?.name || 'Cliente N/A';
    let executedName = 'Executado N/A';

    if (Array.isArray(caseParties) && caseParties.length > 0) {
      const clientParty = caseParties.find((p: any) =>
        p.role && ['Cliente', 'CLIENTE'].includes(p.role)
      );
      if (clientParty?.entities?.name) {
        clientName = clientParty.entities.name;
      }

      const executedParty = caseParties.find((p: any) =>
        p.role && ['Executado', 'EXECUTADO', 'Executada', 'EXECUTADA'].includes(p.role)
      );
      if (executedParty?.entities?.name) {
        executedName = executedParty.entities.name;
      }
    }
    return { clientName, executedName };
  };

  const { totalToReceive, totalReceived } = useMemo(() => {
    return (installments || []).reduce(
      (acc, installment) => {
        const amount = Number(installment.amount) || 0;
        if (normalizeStatus(installment.status) === 'PAGA') {
          acc.totalReceived += amount;
        } else {
          acc.totalToReceive += amount;
        }
        return acc;
      },
      { totalToReceive: 0, totalReceived: 0 }
    );
  }, [installments]);

  const payInstallmentMutation = useMutation({
    mutationFn: (installmentId: number) => {
      const value = (installments || []).find(i => i.id === installmentId)?.amount ?? 0;
      return apiClient.recordInstallmentPayment(String(installmentId), {
        amount_paid: value,
        payment_date: new Date().toISOString(),
        payment_method: 'pix',
      });
    },
    onMutate: async (installmentId) => {
      await queryClient.cancelQueries({ queryKey: ['monthlyInstallments', selectedDate.year, selectedDate.month] });
      const previousInstallments = queryClient.getQueryData(['monthlyInstallments', selectedDate.year, selectedDate.month]);
      queryClient.setQueryData(['monthlyInstallments', selectedDate.year, selectedDate.month], (oldData: any) =>
        (oldData || []).map((i: any) => (i.id === installmentId ? { ...i, status: 'PAGA' } : i))
      );
      return { previousInstallments };
    },
    onError: (err, _vars, context) => {
      if (context?.previousInstallments) {
        queryClient.setQueryData(['monthlyInstallments', selectedDate.year, selectedDate.month], context.previousInstallments);
      }
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Parcela marcada como paga." });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['monthlyInstallments', selectedDate.year, selectedDate.month] });
    }
  });

  const handleDateChange = (type: 'month' | 'year', value: string) => {
    startTransition(() => setSelectedDate(prev => ({ ...prev, [type]: parseInt(value) })));
  };

  const getStatusBadge = (status: MonthlyInstallment['status']) => {
    const variants = {
      'PAGA': { label: 'Paga', className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg', icon: CheckCircle },
      'PENDENTE': { label: 'Pendente', className: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg', icon: Clock },
      'ATRASADA': { label: 'Atrasada', className: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg', icon: AlertCircle },
    };
    const key = normalizeStatus(status);
    const { label, className, icon: Icon } = variants[key];
    return (
      <Badge className={`${className} flex items-center gap-1 font-semibold border-0 px-3 py-1`}>
        <Icon className="h-3 w-3" />{label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total a Receber no Mês</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalToReceive)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total Recebido no Mês</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Balanço do Mês</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceived - totalToReceive)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-slate-700 font-semibold">Mês:</Label>
              <Select value={String(selectedDate.month)} onValueChange={(v) => handleDateChange('month', v)}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Mês" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-slate-700 font-semibold">Ano:</Label>
              <Select value={String(selectedDate.year)} onValueChange={(v) => handleDateChange('year', v)}>
                <SelectTrigger className="w-[120px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Ano" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => (
                    <SelectItem key={i} value={String(new Date().getFullYear() - i)}>
                      {new Date().getFullYear() - i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                <TableHead className="text-slate-700 font-bold">Vencimento</TableHead>
                <TableHead className="text-slate-700 font-bold">Partes</TableHead>
                <TableHead className="text-slate-700 font-bold">Processo</TableHead>
                <TableHead className="text-slate-700 font-bold">Valor</TableHead>
                <TableHead className="text-slate-700 font-bold">Status</TableHead>
                <TableHead className="text-right text-slate-700 font-bold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || isPending ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-slate-600">
                      <Loader2 className="h-6 w-6 animate-spin" /> Carregando parcelas...
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-red-600">
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="h-6 w-6" /> Erro ao carregar parcelas: {String(error?.message || 'desconhecido')}
                    </div>
                  </TableCell>
                </TableRow>
              ) : installments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Nenhuma parcela encontrada para o período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                installments.map((inst) => {
                  const { clientName, executedName } = getPartiesInfo(inst);
                  const caseNumber = inst.agreement?.cases?.case_number || 'N/A';

                  return (
                    <TableRow key={inst.id} className="group hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-transparent transition-all duration-200">
                      <TableCell className="font-mono">{formatDate(inst.due_date)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-900 group-hover:text-purple-700 transition-colors" title={`Cliente: ${clientName}`}>{clientName}</span>
                          <span className="text-xs text-slate-500" title={`Executado: ${executedName}`}>vs {executedName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{caseNumber}</TableCell>
                      <TableCell className="font-semibold text-green-700">{formatCurrency(inst.amount)}</TableCell>
                      <TableCell>{getStatusBadge(inst.status)}</TableCell>
                      <TableCell className="text-right">
                        {normalizeStatus(inst.status) !== 'PAGA' && (
                          <Button
                            size="sm"
                            onClick={() => payInstallmentMutation.mutate(inst.id)}
                            disabled={payInstallmentMutation.isPending}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg rounded-xl"
                          >
                            {payInstallmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4 mr-2" />}
                            Dar Baixa
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ===================== AGREEMENTS TAB COM DESIGN APERFEIÇOADO =====================
function renderAgreementTypeIcon(type: string | null | undefined) {
  const typeStr = type || 'N/A';
  const iconMap = {
    'Judicial': { icon: Scale, color: 'text-blue-600', label: 'Judicial' },
    'Extrajudicial': { icon: FileSignature, color: 'text-green-600', label: 'Extrajudicial' },
    'Em Audiência': { icon: Handshake, color: 'text-purple-600', label: 'Em Audiência' },
    'Pela Loja': { icon: Store, color: 'text-orange-600', label: 'Pela Loja' }
  } as const;
  const config = (iconMap as any)[typeStr] || { icon: FileText, color: 'text-gray-600', label: typeStr };
  const Icon = config.icon as any;
  return (
    <div className="flex items-center space-x-2">
      <Icon className={`h-4 w-4 ${config.color}`} />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

function AgreementDetailsCard({ agreement, isExpanded, onToggle, onSendMessage }: {
  agreement: FinancialAgreement & { has_alvara?: boolean };
  isExpanded: boolean; onToggle: () => void;
  onSendMessage: (agreement: FinancialAgreement) => void;
}) {
  const { installmentValue, nextDueDate, daysUntilDue } = calculateInstallmentInfo(agreement);

  const getStatusBadge = (status: string) => {
    const variants = {
      'active': { label: 'Ativo', className: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' },
      'completed': { label: 'Concluído', className: 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' },
      'defaulted': { label: 'Em Atraso', className: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg' },
      'cancelled': { label: 'Cancelado', className: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg' }
    } as const;
    const cfg = (variants as any)[status] || { label: status, className: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg' };
    return <Badge className={`${cfg.className} border-0 px-3 py-1 font-semibold`}>{cfg.label}</Badge>;
  };

  return (
    <Card className={`mb-4 border-l-4 border-l-blue-500 hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group cursor-pointer ${isExpanded ? 'bg-gradient-to-br from-white to-slate-50' : 'bg-white'}`}>
      <CardContent className="p-0">
        <div className="p-6 hover:bg-slate-50/50 transition-colors" onClick={onToggle}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isExpanded ? <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-purple-600 transition-colors" /> : <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-purple-600 transition-colors" />}
              <div>
                <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">{agreement.entities?.name || 'Cliente não informado'}</h4>
                <p className="text-sm text-slate-500">{agreement.cases?.case_number || 'Sem número'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="font-bold text-lg text-green-600">{formatCurrency(agreement.total_amount)}</p>
                <p className="text-sm text-slate-500">{agreement.number_of_installments || 0}x de {formatCurrency(installmentValue)}</p>
              </div>
              {getStatusBadge(agreement.status)}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 border-t bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><FileText className="h-4 w-4 mr-2" />Informações do Acordo</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Tipo:</span><div>{renderAgreementTypeIcon(agreement.agreement_type)}</div></div>
                  <div className="flex justify-between"><span className="text-slate-600">Valor de Entrada:</span><span className="font-medium">{formatCurrency(agreement.down_payment || 0)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Valor Restante:</span><span className="font-medium">{formatCurrency((agreement.total_amount || 0) - (agreement.down_payment || 0))}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Nº de Parcelas:</span><span className="font-medium">{agreement.number_of_installments || 'N/A'}</span></div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><Calendar className="h-4 w-4 mr-2" />Cronograma</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">Valor da Parcela:</span><span className="font-bold text-green-600">{formatCurrency(installmentValue)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Próximo Vencimento:</span><span className="font-medium">{formatDate(nextDueDate)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-600">Dias até Vencimento:</span><Badge variant={daysUntilDue <= 7 ? "destructive" : daysUntilDue <= 15 ? "outline" : "secondary"}>{daysUntilDue} dias</Badge></div>
                  <div className="flex justify-between"><span className="text-slate-600">Possui Alvará:</span><Badge variant={agreement.has_alvara ? "default" : "outline"}>{agreement.has_alvara ? "Sim" : "Não"}</Badge></div>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-semibold text-slate-700 flex items-center"><Users className="h-4 w-4 mr-2" />Partes Envolvidas</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-600">Cliente:</span>
                    <p className="font-medium">{agreement.entities?.name || 'N/A'}</p>
                    {agreement.entities?.document && <p className="text-xs text-slate-500">{agreement.entities.document}</p>}
                  </div>
                  <div>
                    <span className="text-slate-600">Executado:</span>
                    <p className="font-medium text-slate-700">{(agreement as any)?.executed_entities?.name || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>
            {agreement.notes && (
              <div className="border-t pt-3 mt-3">
                <h6 className="font-semibold text-slate-700 mb-2">Observações:</h6>
                <p className="text-sm text-slate-600 bg-white p-3 rounded-lg border">{agreement.notes}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2 border-t pt-3 mt-3">
              <Button size="sm" variant="outline" className="border-2 border-slate-200 rounded-xl"><Eye className="h-4 w-4 mr-1" />Visualizar</Button>
              <Button size="sm" variant="outline" className="border-2 border-slate-200 rounded-xl"><Edit className="h-4 w-4 mr-1" />Editar</Button>
              <Button size="sm" onClick={() => onSendMessage(agreement)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg rounded-xl">
                <Send className="h-4 w-4 mr-1" />Enviar Cobrança
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgreementsTab({ agreements, onSendMessage, onNewAgreement }: {
  agreements: FinancialAgreement[];
  onSendMessage: (agreement: FinancialAgreement) => void;
  onNewAgreement: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedAgreements, setExpandedAgreements] = useState<Set<number>>(new Set());

  const toggleExpanded = useCallback((id: number) => {
    setExpandedAgreements(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  }, []);

  const filteredAgreements = useMemo(() => {
    // A propriedade 'has_alvara' agora virá da API, então não precisamos mais do mock
    return agreements.filter((agreement) => {
      const hay = `${agreement.entities?.name ?? ''} ${agreement.cases?.case_number ?? ''} ${(agreement as any)?.executed_entities?.name ?? ''}`.toLowerCase();
      const searchMatch = hay.includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "all" || agreement.status === statusFilter;
      const typeMatch = typeFilter === "all" || agreement.agreement_type === typeFilter;
      return searchMatch && statusMatch && typeMatch;
    });
  }, [agreements, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input placeholder="Buscar por cliente, processo ou executado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="defaulted">Em Atraso</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  <SelectItem value="Judicial">Judicial</SelectItem>
                  <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                  <SelectItem value="Em Audiência">Em Audiência</SelectItem>
                  <SelectItem value="Pela Loja">Pela Loja</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setExpandedAgreements(new Set())} className="border-2 border-slate-200 rounded-xl">Recolher Todos</Button>
              <Button variant="outline" onClick={() => setExpandedAgreements(new Set(filteredAgreements.map(a => a.id)))} className="border-2 border-slate-200 rounded-xl">Expandir Todos</Button>
              <Button onClick={onNewAgreement} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-lg rounded-xl"><Plus className="mr-2 h-4 w-4" /> Novo Acordo</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Mostrando {filteredAgreements.length} de {agreements.length} acordos</span>
            <span className="text-sm font-semibold text-slate-900">Valor Total: {formatCurrency(filteredAgreements.reduce((sum, a) => sum + (a.total_amount || 0), 0))}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-0">
        {filteredAgreements.length === 0 ? (
          <Card className="border-0 shadow-xl">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum acordo encontrado</h3>
              <p className="text-slate-500">Tente ajustar os filtros de busca.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredAgreements.map((agreement) => (
              <AgreementDetailsCard key={agreement.id} agreement={agreement} isExpanded={expandedAgreements.has(agreement.id)} onToggle={() => toggleExpanded(agreement.id)} onSendMessage={onSendMessage} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== ALVARÁS COM DESIGN APERFEIÇOADO (AGORA COM DADOS REAIS) =====================
function AlvarasTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // ✅ SUBSTITUIÇÃO DOS DADOS MOCADOS PELA CHAMADA DA API
  const { data: alvaras = [], isLoading, isError, error } = useQuery<Alvara[]>({
    queryKey: ['alvaras'],
    // ❗ NOTA: apiClient.getAlvaras() é um novo método que precisa ser criado no seu `api-client.ts`
    // e uma rota correspondente, ex: `app/api/alvaras/route.ts`
    queryFn: () => apiClient.getAlvaras(), 
    staleTime: 60_000, // Cache por 1 minuto
  });

  // Mutação para marcar o alvará como recebido
  const markAsReceivedMutation = useMutation({
    mutationFn: (alvaraId: number) => apiClient.updateAlvaraStatus(alvaraId, true),
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Alvará marcado como recebido!" });
      queryClient.invalidateQueries({ queryKey: ['alvaras'] });
    },
    onError: (err) => {
      toast({ title: "Erro", description: (err as Error).message, variant: "destructive" });
    }
  });

  const filteredAlvaras = useMemo(() => {
    return alvaras.filter(alvara => {
      const searchMatch =
        alvara.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.creditor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alvara.court?.toLowerCase().includes(searchTerm.toLowerCase());

      const statusMatch = statusFilter === "all" ||
        (statusFilter === "received" && alvara.received) ||
        (statusFilter === "pending" && !alvara.received);

      return searchMatch && statusMatch;
    });
  }, [alvaras, searchTerm, statusFilter]);

  const totalValue = useMemo(() => filteredAlvaras.reduce((sum, a) => sum + (a.value || 0), 0), [filteredAlvaras]);
  const pendingValue = useMemo(() => filteredAlvaras.filter(a => !a.received).reduce((sum, a) => sum + (a.value || 0), 0), [filteredAlvaras]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total em Alvarás</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValue)}</p>
              </div>
              <Receipt className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Pendentes de Recebimento</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingValue)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Taxa de Recebimento</p>
                <p className="text-2xl font-bold text-green-600">{alvaras.length > 0 ? ((alvaras.filter(a => a.received).length / alvaras.length) * 100).toFixed(1) : 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input placeholder="Buscar por processo, credor ou vara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="received">Recebidos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-slate-500" /></div>
        ) : isError ? (
          <div className="text-center py-8 text-red-600">Erro ao carregar alvarás: {String(error?.message)}</div>
        ) : filteredAlvaras.length === 0 ? (
          <Card className="border-0 shadow-xl">
             <CardContent className="text-center py-12">
               <Receipt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
               <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum alvará encontrado</h3>
               <p className="text-slate-500">Nenhum alvará corresponde aos filtros atuais.</p>
             </CardContent>
           </Card>
        ) : (
          filteredAlvaras.map((alvara) => (
            <Card key={alvara.id} className={`border-l-4 ${alvara.received ? 'border-l-green-500' : 'border-l-orange-500'} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">Processo {alvara.case_number}</h4>
                      <Badge variant={alvara.received ? "default" : "secondary"} className={alvara.received ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gradient-to-r from-orange-500 to-amber-600 text-white"}>
                        {alvara.received ? "Recebido" : "Pendente"}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600"><strong>Credor:</strong> {alvara.creditor_name || 'Não informado'}</p>
                    <p className="text-sm text-slate-600"><strong>Vara:</strong> {alvara.court || 'Não informado'}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600">
                      <span><strong>Expedição:</strong> {formatDate(alvara.issue_date)}</span>
                      {alvara.received_date && (<span><strong>Recebimento:</strong> {formatDate(alvara.received_date)}</span>)}
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(alvara.value)}</p>
                    {!alvara.received && (
                      <Button
                        size="sm"
                        onClick={() => markAsReceivedMutation.mutate(alvara.id)}
                        disabled={markAsReceivedMutation.isPending}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg rounded-xl"
                      >
                        {markAsReceivedMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                        Marcar como Recebido
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
// ===================== OVERDUE COM DESIGN APERFEIÇOADO =====================
function OverdueTab({ overdueInstallments, onSendMessage }: { overdueInstallments: OverdueInstallment[], onSendMessage: (i: OverdueInstallment) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const filtered = useMemo(() => {
    return overdueInstallments.filter(i => {
      const searchMatch = `${i.client_name} ${i.case_number}`.toLowerCase().includes(searchTerm.toLowerCase());
      const p = i.days_overdue;
      const priorityMatch = priorityFilter === "all" || (priorityFilter === "urgent" && p > 30) || (priorityFilter === "moderate" && p <= 30 && p > 15) || (priorityFilter === "recent" && p <= 15);
      return searchMatch && priorityMatch;
    });
  }, [overdueInstallments, searchTerm, priorityFilter]);

  const totalOverdueValue = useMemo(() => filtered.reduce((s, i) => s + i.value, 0), [filtered]);

  const getPriorityBadge = (days: number) => {
    if (days > 30) return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg border-0">Urgente ({days} dias)</Badge>;
    if (days > 15) return <Badge variant="outline" className="border-orange-500 text-orange-600">Moderado ({days} dias)</Badge>;
    return <Badge variant="secondary" className="bg-slate-200 text-slate-700">Recente ({days} dias)</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Valor Total em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdueValue)}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Parcelas em Atraso</p>
                <p className="text-2xl font-bold text-orange-600">{filtered.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Atraso Médio</p>
                <p className="text-2xl font-bold text-purple-600">{filtered.length > 0 ? Math.round(filtered.reduce((s, i) => s + i.days_overdue, 0) / filtered.length) : 0} dias</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input placeholder="Buscar por cliente ou processo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl" />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[180px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente (+30 dias)</SelectItem>
                <SelectItem value="moderate">Moderado (15-30 dias)</SelectItem>
                <SelectItem value="recent">Recente (-15 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filtered.map((installment) => (
          <Card key={installment.id} className="border-l-4 border-l-red-500 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">{installment.client_name}</h4>
                    {getPriorityBadge(installment.days_overdue)}
                  </div>
                  <p className="text-sm text-slate-600"><strong>Processo:</strong> {installment.case_number} | <strong> Parcela:</strong> {installment.installment_number}</p>
                  <p className="text-sm text-slate-600"><strong>Vencimento:</strong> {formatDate(installment.due_date)}</p>
                  {installment.client_contact && (
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {installment.client_contact.phone && (<div className="flex items-center gap-1"><Phone className="h-4 w-4" /><span>{installment.client_contact.phone}</span></div>)}
                      {installment.client_contact.email && (<div className="flex items-center gap-1"><Mail className="h-4 w-4" /><span>{installment.client_contact.email}</span></div>)}
                    </div>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(installment.value)}</p>
                  <p className="text-sm text-slate-600">de {formatCurrency(installment.total_agreement_value)}</p>
                  <Button size="sm" onClick={() => onSendMessage(installment)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg rounded-xl">
                    <Send className="h-4 w-4 mr-1" />Enviar Cobrança
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===================== EXPENSES COM DESIGN APERFEIÇOADO =====================
function ExpensesTab({ expenses, onAddExpense, onToggleExpenseStatus }: { expenses: Expense[], onAddExpense: () => void, onToggleExpenseStatus: (id: number) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const searchMatch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === "all" || expense.category === categoryFilter;
      const statusMatch = statusFilter === "all" || expense.status === statusFilter;
      return searchMatch && categoryMatch && statusMatch;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.value, 0), [filteredExpenses]);
  const paidExpenses = useMemo(() => filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.value, 0), [filteredExpenses]);
  const pendingExpenses = useMemo(() => filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.value, 0), [filteredExpenses]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total de Despesas</p>
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalExpenses)}</p>
              </div>
              <CreditCard className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Despesas Pagas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidExpenses)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Despesas Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(pendingExpenses)}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl group hover:shadow-2xl transition-all duration-500 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-10 group-hover:opacity-20 transition-opacity"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Total de Itens</p>
                <p className="text-2xl font-bold text-blue-600">{filteredExpenses.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input placeholder="Buscar despesas..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-12 h-12 bg-white border-2 border-slate-200 focus:border-purple-400 rounded-xl" />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Fixo">Fixo</SelectItem>
                  <SelectItem value="Variável">Variável</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-12 bg-white border-2 border-slate-200 rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onAddExpense} className="bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 shadow-lg rounded-xl h-12">
              <Plus className="mr-2 h-4 w-4" /> Nova Despesa
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredExpenses.map((expense) => (
          <Card key={expense.id} className={`border-l-4 ${expense.status === 'paid' ? 'border-l-green-500' : 'border-l-orange-500'} border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white group`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">{expense.description}</h4>
                    <Badge variant={expense.status === 'paid' ? "default" : "secondary"} className={expense.status === 'paid' ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gradient-to-r from-orange-500 to-amber-600 text-white"}>
                      {expense.status === 'paid' ? "Pago" : "Pendente"}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-700">{expense.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span><strong>Data:</strong> {formatDate(expense.date)}</span>
                    {expense.due_date && (<span><strong>Vencimento:</strong> {formatDate(expense.due_date)}</span>)}
                    {expense.payment_method && (<span><strong>Forma de Pagamento:</strong> {expense.payment_method}</span>)}
                  </div>
                  {expense.notes && (<p className="text-sm text-slate-600"><strong>Observações:</strong> {expense.notes}</p>)}
                </div>
                <div className="text-right space-y-2">
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(expense.value)}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onToggleExpenseStatus(expense.id)} className="border-2 border-slate-200 rounded-xl">
                      {expense.status === 'paid' ? 'Marcar Pendente' : 'Marcar Pago'}
                    </Button>
                    <Button size="sm" variant="outline" className="border-2 border-slate-200 rounded-xl"><Edit className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ===================== ROOT COM DESIGN APERFEIÇOADO =====================
export function FinancialModule() {
  const { toast } = useToast();

  const { data: agreements, isLoading, error, refetch } = useQuery<FinancialAgreement[], Error>({
    queryKey: ['financialAgreements'],
    queryFn: () => apiClient.getFinancialAgreements(),
    refetchOnWindowFocus: true,
    retry: 2,
    staleTime: 10_000,
  });
  
  // ✅ REMOVIDO o useState para alvaras, agora os dados vêm do useQuery na AlvarasTab
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [overdueInstallments] = useState<OverdueInstallment[]>(mockOverdueInstallments);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<{ name: string; type: string } | null>(null);
  const [isAgreementModalOpen, setAgreementModalOpen] = useState(false);
  const [selectedCaseForAgreement, setSelectedCaseForAgreement] = useState<any | null>(null);

  const safeAgreements: FinancialAgreement[] = Array.isArray(agreements) ? agreements : [];

  const handleSendMessage = useCallback((agreement: FinancialAgreement) => {
    if (!agreement.entities) {
      toast({ title: "Erro", description: "Não é possível enviar mensagem para um acordo sem cliente." });
      return;
    }
    setSelectedRecipient({ name: agreement.entities.name, type: 'acordo' });
    setMessageText(`Prezado(a) ${agreement.entities.name},\n\nLembramos que a parcela do seu acordo referente ao processo ${agreement.cases?.case_number || 'sem número'} está em atraso.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  }, [toast]);

  const handleSendOverdueMessage = useCallback((installment: OverdueInstallment) => {
    setSelectedRecipient({ name: installment.client_name, type: 'parcela' });
    setMessageText(`Prezado(a) ${installment.client_name},\n\nSua parcela nº ${installment.installment_number} do processo ${installment.case_number} está em atraso.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  }, []);
  
  // Esta função agora está dentro da AlvarasTab e usa useMutation
  // const handleMarkAsReceived = useCallback((alvaraId: number) => { ... });

  const handleAddExpense = useCallback(() => {
    toast({ title: "Em desenvolvimento", description: "Funcionalidade de adicionar despesa será implementada em breve." });
  }, [toast]);

  const handleToggleExpenseStatus = useCallback((expenseId: number) => {
    setExpenses(prev => prev.map(e => e.id === expenseId ? { ...e, status: e.status === 'paid' ? 'pending' : 'paid' } : e));
    toast({ title: "Sucesso!", description: "Status da despesa atualizado!" });
  }, [toast]);

  const handleSendMessageAction = useCallback(() => {
    toast({ title: "Mensagem Enviada!", description: `Lembrete enviado para ${selectedRecipient?.name}` });
    setMessageModalOpen(false);
  }, [selectedRecipient, toast]);

  if (error) {
    return (
      <Card className="border-0 shadow-xl border-red-200 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-700 mb-2">Erro ao carregar dados financeiros</h3>
          <p className="text-red-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg rounded-xl">
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
          <p className="text-slate-600 font-medium">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Premium */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-4xl font-bold mb-3">Módulo Financeiro</h2>
              <p className="text-emerald-100 text-xl">Controle total sobre acordos, alvarás, e despesas</p>
            </div>
            <Button onClick={() => refetch()} className="bg-white text-emerald-900 hover:bg-slate-100 shadow-lg rounded-xl">
              <RefreshCw className="mr-2 h-4 w-4" /> Atualizar Dados
            </Button>
          </div>
        </div>
      </div>

      <FinancialStats agreements={safeAgreements} />

      <Tabs defaultValue="monthly_installments" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full bg-slate-100/50 p-1 rounded-2xl border-0">
            <TabsTrigger value="monthly_installments" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><Calendar className="h-4 w-4" /><span>Parcelas do Mês</span></TabsTrigger>
            <TabsTrigger value="received_payments" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><Banknote className="h-4 w-4" /><span>Recebidos do Mês</span></TabsTrigger>
            <TabsTrigger value="acordos" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><FileText className="h-4 w-4" /><span>Acordos</span><Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">{safeAgreements.length}</Badge></TabsTrigger>
            <TabsTrigger value="alvaras" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><Receipt className="h-4 w-4" /><span>Alvarás</span></TabsTrigger>
            <TabsTrigger value="atraso" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><AlertCircle className="h-4 w-4" /><span>Atrasados</span><Badge variant="destructive" className="ml-2 bg-gradient-to-r from-red-500 to-rose-600 text-white">{overdueInstallments.length}</Badge></TabsTrigger>
            <TabsTrigger value="despesas" className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-700 py-3"><CreditCard className="h-4 w-4" /><span>Despesas</span><Badge variant="secondary" className="ml-2 bg-slate-200 text-slate-700">{expenses.length}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="monthly_installments"><MonthlyInstallmentsTab /></TabsContent>
        <TabsContent value="received_payments"><ReceivedPaymentsTab /></TabsContent>
        <TabsContent value="acordos">
          <AgreementsTab
            agreements={safeAgreements}
            onSendMessage={handleSendMessage}
            onNewAgreement={() => {
              setSelectedCaseForAgreement(null);
              setAgreementModalOpen(true);
            }}
          />
        </TabsContent>
        <TabsContent value="alvaras"><AlvarasTab /></TabsContent>
        <TabsContent value="atraso"><OverdueTab overdueInstallments={overdueInstallments} onSendMessage={(i) => {
          setSelectedRecipient({ name: i.client_name, type: 'parcela' });
          setMessageText(`Prezado(a) ${i.client_name},\n\nSua parcela nº ${i.installment_number} do processo ${i.case_number} está em atraso.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
          setMessageModalOpen(true);
        }} /></TabsContent>
        <TabsContent value="despesas"><ExpensesTab expenses={expenses} onAddExpense={() => toast({ title: "Em desenvolvimento", description: "Funcionalidade de adicionar despesa será implementada em breve." })} onToggleExpenseStatus={(id) => setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'paid' ? 'pending' : 'paid' } : e))} /></TabsContent>
      </Tabs>

      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold"><Send className="mr-2 h-5 w-5" /> Enviar Lembrete para {selectedRecipient?.name}</DialogTitle>
            <DialogDescription className="text-slate-600">
              {selectedRecipient?.type === 'acordo' ? 'Lembrete de parcela em atraso' : 'Lembrete de parcela em atraso'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="message" className="text-slate-700 font-semibold">Conteúdo da Mensagem</Label>
            <Textarea id="message" value={messageText} onChange={e => setMessageText(e.target.value)} className="min-h-[150px] mt-2 bg-white border-2 border-slate-200 rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageModalOpen(false)} className="border-2 border-slate-200 rounded-xl">Cancelar</Button>
            <Button onClick={() => { toast({ title: "Mensagem Enviada!", description: `Lembrete enviado para ${selectedRecipient?.name}` }); setMessageModalOpen(false); }} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg rounded-xl">
              <Send className="mr-2 h-4 w-4" /> Enviar Mensagem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FinancialAgreementModal isOpen={isAgreementModalOpen} onClose={() => setAgreementModalOpen(false)} caseData={selectedCaseForAgreement} />
    </div>
  );
}