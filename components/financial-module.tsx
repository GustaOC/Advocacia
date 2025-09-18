// components/financial-module.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
// ✅ CORREÇÃO: Adicionado o ícone Loader2 que estava faltando
import { Plus, Search, DollarSign, FileText, Briefcase, Users, Bell, AlertCircle, TrendingUp, Landmark, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

// --- Tipos de Dados ---
interface Entity { id: number; name: string; }
interface Case { id: number; case_number: string | null; title: string; case_parties: any[]; }
interface FinancialAgreement {
  id: number;
  total_value: number;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  agreement_type: string;
  installments: number;
  due_date: string;
  cases: { title: string; case_number: string | null; };
  entities: { name: string; };
}
interface Alvara { id: number; case_id: number; case_number: string; value: number; received: boolean; }
interface Expense { id: number; description: string; category: string; value: number; date: string; }

// --- Mocks para simulação ---
const mockAgreements: FinancialAgreement[] = [
    { id: 1, total_value: 5000, status: 'active', agreement_type: 'Parcelamento', installments: 10, due_date: '2025-09-10', cases: { title: 'Ação de Cobrança', case_number: '001/2024' }, entities: { name: 'João da Silva' } },
    { id: 2, total_value: 12000, status: 'completed', agreement_type: 'Acordo Judicial', installments: 1, due_date: '2025-07-15', cases: { title: 'Divórcio Consensual', case_number: '002/2024' }, entities: { name: 'Maria Souza' } },
    { id: 3, total_value: 3500, status: 'defaulted', agreement_type: 'Parcelamento', installments: 6, due_date: '2025-07-05', cases: { title: 'Dívida Cartão de Crédito', case_number: '003/2024' }, entities: { name: 'Pedro Costa' } },
];
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
  const [agreements, setAgreements] = useState<FinancialAgreement[]>(mockAgreements);
  const [alvaras, setAlvaras] = useState<Alvara[]>(mockAlvaras);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedAgreement, setSelectedAgreement] = useState<FinancialAgreement | null>(null);

  const loadData = useCallback(async () => {
    // Apenas para simulação, removemos a chamada real à API por enquanto
    setIsLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const overdueAgreements = useMemo(() => agreements.filter(a => a.status === 'defaulted'), [agreements]);

  const handleSendMessage = (agreement: FinancialAgreement) => {
    setSelectedAgreement(agreement);
    setMessageText(`Prezado(a) ${agreement.entities.name},\n\nLembramos que a parcela do seu acordo referente ao processo ${agreement.cases.case_number} está em atraso. Para evitar a retomada do processo, por favor, regularize o pagamento.\n\nAtenciosamente,\nCássio Miguel Advocacia`);
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
    const confirm = window.confirm(`Tem certeza que deseja enviar o processo ${agreement.cases.case_number} para cumprimento de sentença? O status do processo será alterado para "Em andamento".`);
    if(confirm) {
        toast({title: "Processo Enviado!", description: `O processo ${agreement.cases.case_number} foi enviado para cumprimento de sentença.`});
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Módulo Financeiro</h2>
        <p className="text-slate-300 text-lg">Controle total sobre acordos, alvarás, despesas e pagamentos.</p>
      </div>

      <Tabs defaultValue="agreements">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agreements">Acordos</TabsTrigger>
          <TabsTrigger value="alvaras">Alvarás</TabsTrigger>
          <TabsTrigger value="overdue">Parcelas em Atraso <Badge className="ml-2 bg-red-500">{overdueAgreements.length}</Badge></TabsTrigger>
          <TabsTrigger value="expenses">Controle de Gastos</TabsTrigger>
        </TabsList>

        <TabsContent value="agreements">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>Todos os Acordos</CardTitle></CardHeader>
            <CardContent>
              {/* Tabela de Acordos aqui */}
            </CardContent>
          </Card>
        </TabsContent>

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
                  {alvaras.map(alvara => (
                    <TableRow key={alvara.id}>
                      <TableCell>{alvara.case_number}</TableCell>
                      <TableCell>R$ {alvara.value.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={alvara.received ? 'default' : 'secondary'} className={alvara.received ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {alvara.received ? 'Recebido' : 'Aguardando'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {!alvara.received && <Button size="sm" onClick={() => alert('Marcando como recebido...')}>Marcar como Recebido</Button>}
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
                    <Button variant="destructive" onClick={sendBulkMessages}><Send className="mr-2 h-4 w-4"/> Envio em Massa</Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Processo</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overdueAgreements.map(agreement => (
                    <TableRow key={agreement.id}>
                      <TableCell>{agreement.entities.name}</TableCell>
                      <TableCell>{agreement.cases.case_number}</TableCell>
                      <TableCell>{new Date(agreement.due_date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleSendMessage(agreement)}>Lembrar</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleFulfillment(agreement)}>Cumprimento de Sentença</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {expenses.map(expense => (
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
      
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Enviar Lembrete para {selectedAgreement?.entities.name}</DialogTitle></DialogHeader>
            <div className="py-4">
                <Label htmlFor="message">Conteúdo da Mensagem</Label>
                <Textarea id="message" value={messageText} onChange={e => setMessageText(e.target.value)} className="min-h-[150px]"/>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setMessageModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => { alert('Mensagem enviada!'); setMessageModalOpen(false); }}>Enviar Mensagem</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}