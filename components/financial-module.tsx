"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "./ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Badge } from "./ui/badge"
import { AlertTriangle, CheckCircle, Send, Repeat, Banknote, Landmark, PlusCircle, Trash2 } from "lucide-react"

// =================================
// Sub-componentes para cada aba
// =================================

// Aba 1: Alvarás
const AlvarasTab = () => {
  // Dados mocados. Substituir por chamada de API.
  const alvaras = [
    { id: 1, case: "Correção benefício INSS", value: 5430.50, is_received: false },
    { id: 2, case: "Seguro Bradesco", value: 12500.00, is_received: true },
  ]
  return (
    <div>
        <div className="flex justify-end mb-4">
            <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Registrar Novo Alvará</Button>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Valor (R$)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {alvaras.map(alvara => (
                    <TableRow key={alvara.id}>
                        <TableCell>{alvara.case}</TableCell>
                        <TableCell>{alvara.value.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={alvara.is_received ? "success" : "default"}>
                                {alvara.is_received ? "Recebido" : "Aguardando Pagamento"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            {!alvara.is_received && <Button size="sm" variant="outline"><CheckCircle className="mr-2 h-4 w-4" />Marcar como Recebido</Button>}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  )
}

// Aba 2: Parcelas em Atraso
const AtrasosTab = () => {
  // Dados mocados
  const atrasos = [
    { id: 1, client: "Amábillin", case: "GOL - Sushi São Paulo", due_date: "2025-08-10", overdue_days: 39, months_overdue: 2 },
    { id: 2, client: "Fábio", case: "Multa RFB", due_date: "2025-09-05", overdue_days: 13, months_overdue: 1 },
  ]
  return (
    <div>
        <div className="flex justify-end mb-4 space-x-2">
            <Button variant="outline" disabled><Send className="mr-2 h-4 w-4" /> Enviar Lembrete em Massa</Button>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Processo</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Ações</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {atrasos.map(atraso => (
                    <TableRow key={atraso.id} className="bg-red-50 dark:bg-red-900/20">
                        <TableCell>{atraso.client}</TableCell>
                        <TableCell>{atraso.case}</TableCell>
                        <TableCell>{atraso.due_date} ({atraso.overdue_days} dias em atraso)</TableCell>
                        <TableCell className="space-x-2">
                            <Button size="sm" variant="destructive"><Send className="mr-2 h-4 w-4" />Lembrar Cliente</Button>
                            {atraso.months_overdue >= 2 && <Button size="sm" variant="destructive" className="bg-red-800"><Repeat className="mr-2 h-4 w-4"/>Cumprimento de Sentença</Button>}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    </div>
  )
}

// Aba 3: Controle de Pagamentos
const PagamentosTab = () => {
    return <div className="text-center p-8 text-muted-foreground">Funcionalidade em desenvolvimento.</div>
}

// Aba 4: Controle de Gastos
const GastosTab = () => {
     const expenses = [
        { id: 1, description: "Conta de Luz - Escritório", value: 350.75, date: "2025-09-15" },
        { id: 2, description: "Compra de Papel A4", value: 120.00, date: "2025-09-10" },
     ]
    return (
        <div>
             <div className="flex justify-end mb-4">
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Despesa</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor (R$)</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {expenses.map(expense => (
                        <TableRow key={expense.id}>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.value.toFixed(2)}</TableCell>
                            <TableCell>{expense.date}</TableCell>
                            <TableCell><Button size="sm" variant="ghost" disabled><Trash2 className="h-4 w-4"/></Button></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}


// Componente Principal
export function FinancialModule() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulo Financeiro</CardTitle>
        <CardDescription>
          Controle total sobre as finanças do escritório.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alvaras">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="alvaras"><Landmark className="mr-2 h-4 w-4" />Alvarás</TabsTrigger>
            <TabsTrigger value="atrasos"><AlertTriangle className="mr-2 h-4 w-4" />Parcelas em Atraso</TabsTrigger>
            <TabsTrigger value="pagamentos"><CheckCircle className="mr-2 h-4 w-4" />Controle de Pagamentos</TabsTrigger>
            <TabsTrigger value="gastos"><Banknote className="mr-2 h-4 w-4" />Controle de Gastos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="alvaras" className="pt-4">
            <AlvarasTab />
          </TabsContent>
          <TabsContent value="atrasos" className="pt-4">
            <AtrasosTab />
          </TabsContent>
           <TabsContent value="pagamentos" className="pt-4">
            <PagamentosTab />
          </TabsContent>
           <TabsContent value="gastos" className="pt-4">
            <GastosTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}