// components/financial-module.tsx - VERSÃO COM TIPAGEM CORRETA
"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Plus, DollarSign, Send, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient, type FinancialAgreement } from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// ✅ CORREÇÃO: Importar tipo do api-client em vez de redefinir
// interface FinancialAgreement já vem do api-client.ts

// Tipos para outros dados (manter temporariamente)
interface Alvara { 
  id: number; 
  case_id: number; 
  case_number: string; 
  value: number; 
  received: boolean; 
}

interface Expense { 
  id: number; 
  description: string; 
  category: string; 
  value: number; 
  date: string; 
}

// Mocks temporários para alvarás e despesas
const mockAlvaras: Alvara[] = [
    { id: 1, case_id: 2, case_number: '002/2024', value: 8500, received: true },
    { id: 2, case_id: 4, case_number: '004/2024', value: 12300, received: false },
];

const mockExpenses: Expense[] = [
    { id: 1, description: 'Aluguel Escritório', category: 'Fixo', value: 2500, date: '2025-09-05' },
    { id: 2, description: 'Software Jurídico', category: 'Software', value: 250, date: '2025-09-10' },
    { id: 3, description: 'Material de Escritório', category: 'Variável', value: 150, date: '2025-09-12' },
];

export function FinancialModule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // ✅ CORREÇÃO: Tipagem explícita para useQuery
  const { 
    data: agreements, 
    isLoading, 
    error,
    refetch 
  } = useQuery<FinancialAgreement[], Error>({
    queryKey: ['financialAgreements'],
    queryFn: async (): Promise<FinancialAgreement[]> => {
      console.log('🔄 Buscando acordos financeiros...');
      const result = await apiClient.getFinancialAgreements();
      console.log('✅ Acordos recebidos:', result);
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 3,
    // ✅ CORREÇÃO: Garantir que sempre temos um array
    initialData: [],
  });
  
  // Estados para modais e outros dados
  const [alvaras] = useState<Alvara[]>(mockAlvaras);
  const [expenses] = useState<Expense[]>(mockExpenses);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<FinancialAgreement | null>(null);

  // ✅ CORREÇÃO: Garantir que agreements é sempre um array e tipado corretamente
  const safeAgreements: FinancialAgreement[] = Array.isArray(agreements) ? agreements : [];

  // ✅ CORREÇÃO: Usar safeAgreements com tipagem explícita
  const overdueAgreements = useMemo(() => {
    return safeAgreements.filter((agreement: FinancialAgreement) => agreement.status === 'defaulted');
  }, [safeAgreements]);

  const handleSendMessage = (agreement: FinancialAgreement) => {
    setSelectedAgreement(agreement);
    setMessageText(`Prezado(a) ${agreement.entities.name},\n\nLembramos que a parcela do seu acordo referente ao processo ${agreement.cases.case_number || 'sem número'} está em atraso. Para evitar a retomada do processo, por favor, regularize o pagamento.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
    setMessageModalOpen(true);
  };
  
  const sendBulkMessages = () => {
    if(overdueAgreements.length === 0) {
      toast({title: "Nenhuma Ação Necessária", description: "Não há clientes com parcelas em atraso."});
      return;
    }
    const confirm = window.confirm(`Deseja enviar uma mensagem de cobrança para ${overdueAgreements.length} cliente(s) em atraso?`);
    if(confirm) {
      toast({title: "Sucesso!", description: "Mensagens em massa enviadas para os clientes em atraso."});
    }
  };
  
  const handleFulfillment = (agreement: FinancialAgreement) => {
    const confirm = window.confirm(`Tem certeza que deseja enviar o processo ${agreement.cases.case_number || 'sem número'} para cumprimento de sentença? O status do processo será alterado para "Em andamento".`);
    if(confirm) {
        toast({title: "Processo Enviado!", description: `O processo ${agreement.cases.case_number || 'sem número'} foi enviado para cumprimento de sentença.`});
    }
  };

  // ✅ CORREÇÃO: Tratamento de erro melhorado
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
          <p className="text-slate-300 text-lg">Controle total sobre acordos, alvarás, despesas e pagamentos.</p>
        </div>
        
        <Card className="border-red-200">
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
              <h3 className="text-lg font-semibold text-red-700 mb-2">
                Erro ao carregar acordos financeiros
              </h3>
              <p className="text-red-600 mb-4">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <div className="space-x-2">
                <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700">
                  <RefreshCw className="mr-2 h-4 w-4"/>
                  Tentar Novamente
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.refetchQueries({ queryKey: ['financialAgreements'] })}
                >
                  Recarregar Cache
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
          <p className="text-slate-300 text-lg">Carregando dados financeiros...</p>
        </div>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2"/>
            <p className="text-gray-500">Carregando acordos financeiros...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ CORREÇÃO: Estatísticas com tipagem correta
  const activeAgreements = safeAgreements.filter((a: FinancialAgreement) => a.status === 'active').length;
  const completedAgreements = safeAgreements.filter((a: FinancialAgreement) => a.status === 'completed').length;
  const totalValue = safeAgreements.reduce((sum: number, a: FinancialAgreement) => sum + a.total_value, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
        <p className="text-slate-300 text-lg">Controle total sobre acordos, alvarás, despesas e pagamentos.</p>
        
        {/* ✅ Estatísticas rápidas */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold">{safeAgreements.length}</div>
            <div className="text-sm text-slate-300">Total de Acordos</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{activeAgreements}</div>
            <div className="text-sm text-slate-300">Ativos</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{completedAgreements}</div>
            <div className="text-sm text-slate-300">Concluídos</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{overdueAgreements.length}</div>
            <div className="text-sm text-slate-300">Em Atraso</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="agreements">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agreements">
            Acordos 
            <Badge className="ml-2 bg-blue-500">{safeAgreements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="alvaras">
            Alvarás
            <Badge className="ml-2">{alvaras.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Parcelas em Atraso 
            <Badge className="ml-2 bg-red-500">{overdueAgreements.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Controle de Gastos
          </TabsTrigger>
        </TabsList>

        {/* ✅ CORREÇÃO: Tabela completa de acordos implementada */}
        <TabsContent value="agreements">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-green-600"/>
                  Todos os Acordos Financeiros
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4"/> 
                    Atualizar
                  </Button>
                  <Button>
                    <Plus className="mr-2 h-4 w-4"/> 
                    Novo Acordo
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {safeAgreements.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4"/>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Nenhum acordo financeiro encontrado
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Comece criando um novo acordo financeiro para seus clientes
                  </p>
                  <Button>
                    <Plus className="mr-2 h-4 w-4"/> 
                    Criar Primeiro Acordo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* ✅ Resumo financeiro */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {totalValue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                        <div className="text-sm text-gray-500">Valor Total em Acordos</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          R$ {Math.round(totalValue / (safeAgreements.length || 1)).toLocaleString('pt-BR')}
                        </div>
                        <div className="text-sm text-gray-500">Valor Médio por Acordo</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {safeAgreements.reduce((sum: number, a: FinancialAgreement) => sum + a.installments, 0)}
                        </div>
                        <div className="text-sm text-gray-500">Total de Parcelas</div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Tabela de acordos */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Processo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor Total</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Parcelas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {safeAgreements.map((agreement: FinancialAgreement) => (
                        <TableRow key={agreement.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold">{agreement.entities.name}</div>
                              {agreement.entities.document && (
                                <div className="text-sm text-gray-500">
                                  Doc: {agreement.entities.document}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {agreement.cases.case_number || 'Sem número'}
                              </div>
                              <div className="text-sm text-gray-500 max-w-40 truncate">
                                {agreement.cases.title}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {agreement.agreement_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            R$ {agreement.total_value.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell className="font-mono">
                            R$ {agreement.entry_value.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {agreement.installments}x
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                agreement.status === 'active' ? 'default' :
                                agreement.status === 'completed' ? 'secondary' :
                                agreement.status === 'defaulted' ? 'destructive' :
                                'outline'
                              }
                              className={
                                agreement.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                agreement.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                                agreement.status === 'defaulted' ? 'bg-red-100 text-red-800 border-red-200' :
                                'bg-gray-100 text-gray-800 border-gray-200'
                              }
                            >
                              {agreement.status === 'active' ? 'Ativo' :
                               agreement.status === 'completed' ? 'Concluído' :
                               agreement.status === 'defaulted' ? 'Em Atraso' :
                               'Cancelado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(agreement.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(agreement.created_at).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button size="sm" variant="outline">
                                Ver Detalhes
                              </Button>
                              {agreement.status === 'active' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleSendMessage(agreement)}
                                >
                                  <Send className="h-4 w-4"/>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resto das abas */}
        <TabsContent value="alvaras">
          <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Controle de Alvarás</span>
                    <Button><Plus className="mr-2 h-4 w-4"/> Adicionar Alvará</Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Processo</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {alvaras.map((alvara: Alvara) => (
                    <TableRow key={alvara.id}>
                      <TableCell>{alvara.case_number}</TableCell>
                      <TableCell>R$ {alvara.value.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={alvara.received ? 'default' : 'secondary'} className={alvara.received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {alvara.received ? 'Recebido' : 'Aguardando'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!alvara.received && <Button size="sm" onClick={() => toast({title: "Sucesso!", description: "Alvará marcado como recebido!"})}>Marcar como Recebido</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Acordos com Parcelas em Atraso</span>
                    <Button 
                      variant="destructive" 
                      onClick={sendBulkMessages}
                      disabled={overdueAgreements.length === 0}
                    >
                      <Send className="mr-2 h-4 w-4"/> 
                      Envio em Massa ({overdueAgreements.length})
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueAgreements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">✅</div>
                  <p className="text-green-600 font-semibold">Parabéns! Nenhum acordo em atraso</p>
                  <p className="text-gray-500 text-sm">Todos os acordos estão em dia</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueAgreements.map((agreement: FinancialAgreement) => (
                      <TableRow key={agreement.id}>
                        <TableCell>{agreement.entities.name}</TableCell>
                        <TableCell>{agreement.cases.case_number || 'Sem número'}</TableCell>
                        <TableCell>R$ {agreement.total_value.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{new Date(agreement.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleSendMessage(agreement)}>
                              Lembrar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleFulfillment(agreement)}>
                              Cumprimento de Sentença
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Controle de Despesas do Escritório</span>
                    <Button><Plus className="mr-2 h-4 w-4"/> Nova Despesa</Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
                <TableBody>
                  {expenses.map((expense: Expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                      <TableCell>R$ {expense.value.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modal de mensagem */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>Enviar Lembrete para {selectedAgreement?.entities.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="message">Conteúdo da Mensagem</Label>
                <Textarea 
                  id="message" 
                  value={messageText} 
                  onChange={e => setMessageText(e.target.value)} 
                  className="min-h-[150px] mt-2"
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => { 
                  toast({title: "Mensagem Enviada!", description: `Lembrete enviado para ${selectedAgreement?.entities.name}`}); 
                  setMessageModalOpen(false); 
                }}>
                  <Send className="mr-2 h-4 w-4"/>
                  Enviar Mensagem
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}