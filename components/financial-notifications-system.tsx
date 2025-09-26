// components/financial-notifications-system.tsx
"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Bell, Calendar, Send, Settings, Clock, Users, MessageSquare, 
  Phone, Mail, Smartphone, AlertTriangle, CheckCircle, Plus,
  Eye, Edit, Trash2, Play, Pause, RefreshCw, Filter,
  Target, Zap, Activity, TrendingUp, BarChart3, Loader2,
  WhatsApp, Sms, AtSign, BellRing, CalendarDays, Timer
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type PaymentReminder } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  message: string;
  variables: string[];
}

interface ReminderRule {
  id: string;
  name: string;
  days_before_due: number[];
  reminder_types: ('email' | 'sms' | 'whatsapp')[];
  template_id: string;
  active: boolean;
  apply_to: 'all' | 'high_risk' | 'specific_clients';
  client_ids?: number[];
}

interface FinancialNotificationsSystemProps {
  onNavigateToAgreement?: (agreementId: number) => void;
}

export function FinancialNotificationsSystem({ onNavigateToAgreement }: FinancialNotificationsSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('reminders');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedRule, setSelectedRule] = useState<ReminderRule | null>(null);

  // Queries para buscar dados
  const { data: reminders, isLoading: isLoadingReminders } = useQuery({
    queryKey: ['paymentReminders'],
    queryFn: () => apiClient.getPaymentReminders(),
    refetchInterval: 30000,
  });

  const { data: upcomingDues } = useQuery({
    queryKey: ['upcomingDueDates'],
    queryFn: () => apiClient.getUpcomingDueDates(30),
  });

  // Templates padrão de notificação
  const defaultTemplates: NotificationTemplate[] = [
    {
      id: 'reminder_3_days',
      name: 'Lembrete 3 Dias Antes',
      type: 'email',
      subject: 'Lembrete: Parcela vence em 3 dias - {CASE_NUMBER}',
      message: `Prezado(a) {CLIENT_NAME},\n\nEste é um lembrete de que a parcela do acordo referente ao processo {CASE_NUMBER} vence em 3 dias ({DUE_DATE}).\n\nValor: {AMOUNT}\n\nPara evitar juros e multas, realize o pagamento até a data de vencimento.\n\nAtenciosamente,\nCássio Miguel Advocacia`,
      variables: ['CLIENT_NAME', 'CASE_NUMBER', 'DUE_DATE', 'AMOUNT']
    },
    {
      id: 'overdue_notice',
      name: 'Aviso de Atraso',
      type: 'email',
      subject: 'URGENTE: Parcela em atraso - {CASE_NUMBER}',
      message: `Prezado(a) {CLIENT_NAME},\n\nInformamos que a parcela do acordo referente ao processo {CASE_NUMBER} está em atraso há {DAYS_OVERDUE} dias.\n\nValor original: {AMOUNT}\nMulta e juros: {LATE_FEES}\nTotal a pagar: {TOTAL_AMOUNT}\n\nPara regularizar sua situação, entre em contato conosco.\n\nAtenciosamente,\nCássio Miguel Advocacia`,
      variables: ['CLIENT_NAME', 'CASE_NUMBER', 'DAYS_OVERDUE', 'AMOUNT', 'LATE_FEES', 'TOTAL_AMOUNT']
    },
    {
      id: 'whatsapp_reminder',
      name: 'Lembrete WhatsApp',
      type: 'whatsapp',
      message: `🔔 *Lembrete de Pagamento*\n\nOlá {CLIENT_NAME}!\n\nSua parcela do processo {CASE_NUMBER} vence em {DAYS_UNTIL_DUE} dias.\n\n💰 Valor: {AMOUNT}\n📅 Vencimento: {DUE_DATE}\n\nCássio Miguel Advocacia`,
      variables: ['CLIENT_NAME', 'CASE_NUMBER', 'DAYS_UNTIL_DUE', 'AMOUNT', 'DUE_DATE']
    }
  ];

  // Regras padrão de lembretes
  const defaultRules: ReminderRule[] = [
    {
      id: 'standard_reminders',
      name: 'Lembretes Padrão',
      days_before_due: [7, 3, 1],
      reminder_types: ['email', 'sms'],
      template_id: 'reminder_3_days',
      active: true,
      apply_to: 'all'
    },
    {
      id: 'high_risk_intensive',
      name: 'Alto Risco - Intensivo',
      days_before_due: [15, 10, 7, 3, 1],
      reminder_types: ['email', 'sms', 'whatsapp'],
      template_id: 'reminder_3_days',
      active: true,
      apply_to: 'high_risk'
    }
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'sent': { label: 'Enviado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      'failed': { label: 'Falhou', className: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'cancelled': { label: 'Cancelado', className: 'bg-gray-100 text-gray-800', icon: Trash2 },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.className} font-medium border px-2 py-1 flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getReminderTypeIcon = (type: string) => {
    switch(type) {
      case 'email': return <AtSign className="h-4 w-4 text-blue-600" />;
      case 'sms': return <Smartphone className="h-4 w-4 text-green-600" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleSendReminder = async (reminderId: number) => {
    try {
      // Implementar lógica para enviar lembrete
      toast({ title: "Lembrete enviado!", description: "Lembrete enviado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao enviar lembrete.", variant: "destructive" });
    }
  };

  const handleCreateBulkReminders = async () => {
    try {
      if (!upcomingDues || upcomingDues.length === 0) return;
      
      const agreementIds = upcomingDues
        .filter(due => due.days_until_due <= 7)
        .map(due => due.agreement_id);
      
      await apiClient.sendOverdueReminders(agreementIds, undefined, 'email');
      
      toast({ 
        title: "Lembretes criados!", 
        description: `${agreementIds.length} lembretes foram programados.` 
      });
      
      queryClient.invalidateQueries({ queryKey: ['paymentReminders'] });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao criar lembretes.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <BellRing className="h-8 w-8 text-blue-600" />
            Sistema de Notificações
          </h1>
          <p className="text-slate-600 mt-1">Gerenciamento de lembretes automáticos e comunicação com clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreateBulkReminders}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Lembretes
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Lembretes Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {reminders?.filter(r => r.status === 'pending').length || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Enviados Hoje</p>
                <p className="text-2xl font-bold text-green-600">
                  {reminders?.filter(r => 
                    r.status === 'sent' && 
                    r.sent_date && 
                    new Date(r.sent_date).toDateString() === new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Send className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Vencimentos 7 dias</p>
                <p className="text-2xl font-bold text-blue-600">
                  {upcomingDues?.filter(due => due.days_until_due <= 7).length || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-purple-600">
                  {reminders?.length ? 
                    Math.round((reminders.filter(r => r.status === 'sent').length / reminders.length) * 100) : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reminders">Lembretes Agendados</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rules">Regras Automáticas</TabsTrigger>
          <TabsTrigger value="analytics">Estatísticas</TabsTrigger>
        </TabsList>

        {/* Aba Lembretes */}
        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Lembretes Programados
                </div>
                <Badge variant="outline" className="font-semibold">
                  {reminders?.length || 0} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-slate-700">Cliente</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Tipo</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Agendado</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                      <th className="text-left p-4 font-semibold text-slate-700">Processo</th>
                      <th className="text-right p-4 font-semibold text-slate-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders?.map((reminder, index) => (
                      <tr key={reminder.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{reminder.client_name}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getReminderTypeIcon(reminder.reminder_type)}
                            <span className="capitalize font-medium">{reminder.reminder_type}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-900">
                            {formatDate(reminder.scheduled_date)}
                          </div>
                          <div className="text-sm text-slate-500">
                            {new Date(reminder.scheduled_date).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          {getStatusBadge(reminder.status)}
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-sm text-slate-600">
                            Acordo #{reminder.agreement_id}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {reminder.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleSendReminder(reminder.id)}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {(!reminders || reminders.length === 0) && (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">Nenhum lembrete programado</p>
                  <Button onClick={handleCreateBulkReminders} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiros Lembretes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">Templates de Mensagem</h3>
            <Button onClick={() => setIsTemplateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {defaultTemplates.map((template, index) => (
              <Card key={template.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getReminderTypeIcon(template.type)}
                      <span>{template.name}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {template.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.subject && (
                    <div>
                      <Label className="text-xs text-slate-600">Assunto</Label>
                      <p className="text-sm font-medium text-slate-900">{template.subject}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-xs text-slate-600">Mensagem</Label>
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 max-h-32 overflow-y-auto">
                      {template.message}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-600">Variáveis Disponíveis</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{${variable}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedTemplate(template)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Prévia
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Regras */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-slate-900">Regras de Automação</h3>
            <Button onClick={() => setIsRuleModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {defaultRules.map((rule, index) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Switch checked={rule.active} />
                        <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                        <Badge variant={rule.active ? 'default' : 'secondary'}>
                          {rule.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-4">
                          <div>
                            <Label className="text-xs text-slate-600">Dias antes</Label>
                            <div className="flex gap-1">
                              {rule.days_before_due.map(days => (
                                <Badge key={days} variant="outline" className="text-xs">
                                  {days}d
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-slate-600">Canais</Label>
                            <div className="flex gap-1">
                              {rule.reminder_types.map(type => (
                                <div key={type} className="flex items-center gap-1">
                                  {getReminderTypeIcon(type)}
                                  <span className="text-xs capitalize">{type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-slate-600">Aplicar a</Label>
                            <Badge variant="outline" className="text-xs capitalize">
                              {rule.apply_to === 'all' ? 'Todos' : 
                               rule.apply_to === 'high_risk' ? 'Alto Risco' : 'Específicos'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba Estatísticas */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Taxa de Entrega por Canal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-blue-600" />
                      <span>Email</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">94%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-green-600" />
                      <span>SMS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">98%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" />
                      <span>WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-200 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full" style={{ width: '89%' }}></div>
                      </div>
                      <span className="text-sm font-semibold">89%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Efetividade dos Lembretes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">76%</div>
                    <p className="text-sm text-slate-600">dos lembretes resultam em pagamento</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">3.2</div>
                      <p className="text-xs text-blue-700">dias antes pagam</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">2.1</div>
                      <p className="text-xs text-purple-700">lembretes por acordo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-600" />
                Resumo Mensal de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-slate-900">1,248</div>
                  <p className="text-sm text-slate-600">Enviadas</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-green-600">1,176</div>
                  <p className="text-sm text-slate-600">Entregues</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-blue-600">894</div>
                  <p className="text-sm text-slate-600">Lidas</p>
                </div>
                <div className="text-center p-4">
                  <div className="text-2xl font-bold text-purple-600">678</div>
                  <p className="text-sm text-slate-600">Respondidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Template */}
      <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Template' : 'Novo Template de Notificação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Formulário do template seria implementado aqui */}
            <p className="text-slate-600">Formulário de criação/edição de template em desenvolvimento...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateModalOpen(false)}>
              Cancelar
            </Button>
            <Button>
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Regra */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra de Automação'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Formulário da regra seria implementado aqui */}
            <p className="text-slate-600">Formulário de criação/edição de regra em desenvolvimento...</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleModalOpen(false)}>
              Cancelar
            </Button>
            <Button>
              Salvar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, ...props }: any) {
  return (
    <label className="block text-sm font-medium text-slate-700" {...props}>
      {children}
    </label>
  );
}