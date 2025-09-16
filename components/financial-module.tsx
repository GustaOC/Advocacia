"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  Plus, Search, Download, Eye, Edit, DollarSign, Calendar, AlertTriangle, Calculator, 
  Trash2, TrendingUp, ArrowUpRight, ArrowDownRight, FileText, PieChart, BarChart3 
} from "lucide-react"
import { DatabaseService, type Client } from "@/lib/supabase"

// Tipos para melhor organização
interface FinancialStat {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ElementType
  bgColor: string
  description: string
}

interface Agreement {
  id: number
  client: string
  cpfCnpj: string
  processNumber: string
  agreementType: string
  totalValue: number
  entryValue: number
  entryDate: string
  installments: number
  installmentValue: number
  paidInstallments: number
  nextDueDate: string
  status: string
  overdueDays: number
  installmentSchedule: {
    number: number
    value: number
    dueDate: string
    paid: boolean
    paidDate?: string
  }[]
}

// Componente de estatística moderna
function ModernFinancialStatCard({ stat }: { stat: FinancialStat }) {
  const ChangeIcon = stat.changeType === 'increase' ? ArrowUpRight : ArrowDownRight
  
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{stat.title}</p>
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <div className="flex items-center space-x-1">
              <ChangeIcon className={`h-4 w-4 ${stat.changeType === 'increase' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${stat.changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.change}
              </span>
              <span className="text-sm text-slate-500">vs mês anterior</span>
            </div>
            <p className="text-xs text-slate-500">{stat.description}</p>
          </div>
          <div className={`p-4 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de atividade recente modernizado
function ModernActivityItem({ activity }: { activity: any }) {
  const getIcon = () => {
    switch (activity.type) {
      case "payment": return <DollarSign className="h-4 w-4" />
      case "agreement": return <FileText className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "installment": return <Calendar className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (activity.type) {
      case "payment": return "text-emerald-600 bg-emerald-100"
      case "agreement": return "text-blue-600 bg-blue-100"
      case "overdue": return "text-red-600 bg-red-100"
      case "installment": return "text-orange-600 bg-orange-100"
      default: return "text-slate-600 bg-slate-100"
    }
  }

  const priorityColor =
    activity.priority === 'high' ? 'border-l-red-500' 
    activity.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-slate-300'

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-xl bg-slate-50 hover:bg-white border-l-4 ${priorityColor} transition-all duration-200 hover:shadow-md`}>
      <div className={`p-2 rounded-lg ${getColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{activity.message}</p>
        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
      </div>
      {activity.value ? (
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">R$ {activity.value.toLocaleString('pt-BR')}</p>
        </div>
      ) : null}
    </div>
  )
}

export function FinancialModule() {
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [agreements, setAgreements] = useState<any[]>([])
  const [isLoadingAgreements, setIsLoadingAgreements] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const [newAgreement, setNewAgreement] = useState({
    totalValue: "",
    entryValue: "",
    entryDate: "",
    installments: "",
    firstDueDate: "",
    agreementType: "Judicial",
    notes: "",
  })
  const [calculatedSchedule, setCalculatedSchedule] = useState<
    { number: number; value: number; dueDate: string }[]
  >([])

  // Estados para funcionalidades específicas
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; agreement: Agreement | null }>({
    show: false,
    agreement: null,
  })
  const [selectedMonth, setSelectedMonth] = useState("")
  const [monthlyData, setMonthlyData] = useState({
    paid: [] as any[],
    pending: [] as any[],
    overdue: [] as any[],
  })

  // Dados mockados para estatísticas (você pode integrar com dados reais)
  const financialStats: FinancialStat[] = [
    {
      title: "Receita Mensal",
      value: "R$ 124K",
      change: "+18%",
      changeType: 'increase',
      icon: DollarSign,
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      description: "Pagamentos recebidos este mês",
    },
    {
      title: "Acordos Ativos",
      value: "156",
      change: "+8%",
      changeType: 'increase',
      icon: FileText,
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600",
      description: "Contratos em andamento",
    },
    {
      title: "A Receber",
      value: "R$ 89K",
      change: "+12%",
      changeType: 'increase',
      icon: Calendar,
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600",
      description: "Parcelas pendentes este mês",
    },
    {
      title: "Inadimplentes",
      value: "8",
      change: "-25%",
      changeType: 'decrease',
      icon: AlertTriangle,
      bgColor: "bg-gradient-to-br from-red-500 to-red-600",
      description: "Clientes com parcelas em atraso",
    },
  ]

  // Atividades recentes mockadas
  const recentFinancialActivities = [
    { id: "1", type: "payment", message: "Pagamento recebido de Maria Santos - 2ª parcela", time: "há 15 min", value: 2500, priority: 'high' },
    { id: "2", type: "agreement", message: "Novo acordo cadastrado - João Silva vs. Empresa ABC", time: "há 1h", value: 15000, priority: 'medium' },
    { id: "3", type: "overdue", message: "Parcela vencida - Pedro Oliveira (5 dias de atraso)", time: "há 2h", value: 1800, priority: 'high' },
    { id: "4", type: "installment", message: "Lembrete enviado - Ana Costa vence amanhã", time: "há 3h", value: 950, priority: 'low' },
  ]

  // Carregar dados iniciais
  useEffect(() => {
    loadClientsForFinancial()
    loadAgreements()
  }, [])

  useEffect(() => {
    if (clientSearchTerm.trim().length >= 2) {
      searchClients(clientSearchTerm)
    } else {
      setSearchResults([])
    }
  }, [clientSearchTerm])

  useEffect(() => {
    if (newAgreement.totalValue && newAgreement.entryValue && newAgreement.installments && newAgreement.firstDueDate) {
      calculateInstallmentSchedule()
    }
  }, [newAgreement.totalValue, newAgreement.entryValue, newAgreement.installments, newAgreement.firstDueDate])

  // Funções auxiliares
  const loadClientsForFinancial = async () => {
    try {
      const data = await DatabaseService.getClientsForFinancial()
      setClients(data)
    } catch (error) {
      console.error("Error loading clients for financial:", error)
    }
  }

  const searchClients = async (term: string) => {
    try {
      const results = await DatabaseService.searchClientsForAgreements(term)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching clients:", error)
      setSearchResults([])
    }
  }

  const calculateInstallmentSchedule = () => {
    const total = parseFloat(newAgreement.totalValue) || 0
    const entry = parseFloat(newAgreement.entryValue) || 0
    const installmentCount = parseInt(newAgreement.installments) || 0
    const firstDue = new Date(newAgreement.firstDueDate)

    if (total <= 0 || installmentCount <= 0 || !newAgreement.firstDueDate) {
      setCalculatedSchedule([])
      return
    }

    const remainingValue = total - entry
    const installmentValue = remainingValue / installmentCount

    const schedule: { number: number; value: number; dueDate: string }[] = []
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(firstDue)
      dueDate.setMonth(dueDate.getMonth() + i)
      schedule.push({
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split("T")[0],
      })
    }

    setCalculatedSchedule(schedule)
  }

  const loadAgreements = async () => {
    try {
      setIsLoadingAgreements(true)
      const data = await DatabaseService.getFinancialAgreements({ includeIPCA: true })
      setAgreements(data)
    } catch (error) {
      console.error("Error loading agreements:", error)
      setAgreements([])
    } finally {
      setIsLoadingAgreements(false)
    }
  }

  const handleCreateAgreement = async () => {
    if (!selectedClient || !newAgreement.totalValue || !newAgreement.installments || !newAgreement.firstDueDate) {
      alert("Por favor, preencha todos os campos obrigatórios")
      return
    }

    try {
      const totalValue = parseFloat(newAgreement.totalValue) || 0
      const entryValue = newAgreement.entryValue ? parseFloat(newAgreement.entryValue) : 0
      const installmentCount = parseInt(newAgreement.installments) || 0

      const agreementData = {
        client_id: selectedClient.id,
        "EXECUTADO(A)": selectedClient["EXECUTADO(A)"],
        PROCESSO: selectedClient.PROCESSO || "",
        agreement_type: newAgreement.agreementType,
        "Valor ação": totalValue,
        entry_value: entryValue > 0 ? entryValue : null,
        entry_date: newAgreement.entryDate || null,
        "Números de parcelas": installmentCount,
        first_due_date: newAgreement.firstDueDate,
        status: "Em dia",
        notes: newAgreement.notes || "",
      }

      await DatabaseService.createFinancialAgreement(agreementData)

      // Reset form
      setSelectedClient(null)
      setNewAgreement({
        totalValue: "",
        entryValue: "",
        entryDate: "",
        installments: "",
        firstDueDate: "",
        agreementType: "Judicial",
        notes: "",
      })
      setCalculatedSchedule([])
      setShowCreateForm(false)
      await loadAgreements()
    } catch (error) {
      console.error("Error creating agreement:", error)
      alert("Erro ao criar acordo. Verifique os dados e tente novamente.")
    }
  }

  const filteredRecords = (agreements || []).filter((record) => {
    const matchesSearch =
      record["EXECUTADO(A)"]?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      record.PROCESSO?.includes(searchTerm)

    const matchesType = filterType === "all" || record.agreement_type === filterType
    const matchesStatus = filterStatus === "all" || record.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Módulo Financeiro
              </h1>
              <p className="text-slate-500 text-lg mt-2">Gerencie acordos, parcelas e cobranças de forma inteligente</p>
            </div>
            <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Acordo
                </Button>
              </DialogTrigger>
             <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Acordo</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Client Selection */}
                  {selectedClient ? (
                    <div className="border rounded-lg p-4 bg-emerald-50 border-emerald-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <Label className="text-sm font-medium text-emerald-800 mb-2 block">Cliente Selecionado:</Label>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Nome:</strong> {selectedClient["EXECUTADO(A)"]}</div>
                            <div><strong>CPF:</strong> {selectedClient.CPF || "Não informado"}</div>
                            <div><strong>Telefone:</strong> {selectedClient.TELEFONE || "Não informado"}</div>
                            <div><strong>Cidade:</strong> {selectedClient.CIDADE || "Não informado"}</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
                          Alterar Cliente
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Label>Buscar Cliente</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Digite nome, CPF ou número do processo..."
                          value={clientSearchTerm}
                          onChange={(e) => setClientSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {/* Resto da busca de clientes... */}
                    </div>
                  )}
                  {/* Resto do formulário mantido igual */}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
  { value: "overview", label: "Dashboard", icon: BarChart3 },
  { value: "agreements", label: "Acordos", icon: FileText },
  { value: "installments", label: "Parcelas", icon: Calendar },
  { value: "overdue", label: "Inadimplentes", icon: AlertTriangle },
  { value: "monthly", label: "Mensal", icon: PieChart },
  { value: "reports", label: "Relatórios", icon: PieChart },
].map((tab) => (
  <TabsTrigger
    key={tab.value}
    value={tab.value}
    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 px-4 font-medium transition-all duration-200 flex items-center space-x-2"
  >
    <tab.icon className="h-4 w-4" />
    <span>{tab.label}</span>
  </TabsTrigger>
))}

          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Dashboard Financeiro</h2>
                  <p className="text-slate-300 text-lg">Visão completa da situação financeira dos acordos</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">Período atual</p>
                  <p className="text-white font-semibold">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {financialStats.map((stat, index) => (
                <ModernFinancialStatCard key={index} stat={stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Financial Activities */}
              <Card className="xl:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 flex items-center space-x-2">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span>Atividades Financeiras Recentes</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentFinancialActivities.map((activity) => (
                    <ModernActivityItem key={activity.id} activity={activity} />
                  ))}
                </CardContent>
              </Card>

              {/* Quick Stats Summary */}
              <div className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-slate-900 flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calculator className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>Resumo Rápido</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-emerald-800 text-sm">Taxa de Adimplência</h4>
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">94.8%</Badge>
                      </div>
                      <div className="bg-emerald-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94.8%' }} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-white border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-blue-800 text-sm">Próximos 7 dias</h4>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">R$ 24K</Badge>
                      </div>
                      <p className="text-sm text-blue-600">18 parcelas a vencer</p>
                    </div>

                    <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-800 text-sm">Ticket Médio</h4>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">R$ 1.850</Badge>
                      </div>
                      <p className="text-sm text-purple-600">Por acordo fechado</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buscar por cliente, CPF/CNPJ ou processo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-48 h-11">
                      <SelectValue placeholder="Tipo de acordo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="Judicial">Judicial</SelectItem>
                      <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                      <SelectItem value="Em audiência">Em audiência</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 h-11">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="Em dia">Em dia</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="h-11">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Lista de Acordos ({filteredRecords.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>CPF/CNPJ</TableHead>
                      <TableHead>Processo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAgreements ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                            <span>Carregando acordos...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <div className="text-slate-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">Nenhum acordo encontrado</p>
                            <p className="text-sm">Tente ajustar os filtros ou criar um novo acordo</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {filteredRecords.map((record) => (
                          <TableRow key={record.id} className="hover:bg-slate-50">
                            <TableCell className="font-medium">{record["EXECUTADO(A)"]}</TableCell>
                            <TableCell>{record.CPF || "N/A"}</TableCell>
                            <TableCell className="font-mono text-sm">{record.PROCESSO}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {record.agreement_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-semibold">
                              R$ {record["Valor ação"]?.toLocaleString("pt-BR")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div className="w-full bg-slate-200 rounded-full h-2 max-w-[100px]">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${((record.paid_installments || 0) / (record["Números de parcelas"] || 1)) * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-slate-600 font-medium min-w-[50px]">
                                  {record.paid_installments || 0}/{record["Números de parcelas"] || 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={record.status === "Em dia" ? "default" : "destructive"}
                                className={
                                  record.status === "Em dia"
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                    : "bg-red-100 text-red-800 border-red-200"
                                }
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                 <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
                                    <DialogHeader>
                                      <DialogTitle>Detalhes do Acordo - {record["EXECUTADO(A)"]}</DialogTitle>
                                    </DialogHeader>

                                    <div className="space-y-4">
                                      <div className="grid grid-cols-3 gap-4">
                                        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                          <Label className="text-sm font-medium text-emerald-800">Valor Total</Label>
                                          <p className="text-2xl font-bold text-emerald-900">
                                            R$ {record["Valor ação"]?.toLocaleString("pt-BR")}
                                          </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                          <Label className="text-sm font-medium text-blue-800">Entrada Paga</Label>
                                          <p className="text-2xl font-bold text-blue-900">
                                            R$ {record.entry_value?.toLocaleString("pt-BR") || "0"}
                                          </p>
                                          {record.entry_date && (
                                            <p className="text-xs text-blue-600 mt-1">
                                              {new Date(record.entry_date).toLocaleDateString("pt-BR")}
                                            </p>
                                          )}
                                        </div>
                                        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                          <Label className="text-sm font-medium text-purple-800">Valor por Parcela</Label>
                                          <p className="text-2xl font-bold text-purple-900">
                                            R$ {record["Valor da parcelas"]?.toLocaleString("pt-BR") || "0"}
                                          </p>
                                          <p className="text-xs text-purple-600 mt-1">
                                            {record["Números de parcelas"]}x parcelas
                                          </p>
                                        </div>
                                      </div>

                                      <Separator />

                                      <div>
                                        <Label className="text-lg font-semibold mb-4 block flex items-center">
                                          <Calendar className="h-5 w-5 mr-2" />
                                          Cronograma de Parcelas
                                        </Label>
                                        <div className="max-h-96 overflow-y-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>Parcela</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead>Vencimento</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Ações</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {(record.installmentSchedule || []).map((installment: any) => (
                                                <TableRow key={installment.number}>
                                                  <TableCell className="font-medium">
                                                    {installment.number === 0 ? "Entrada" : `${installment.number}ª`}
                                                  </TableCell>
                                                  <TableCell>R$ {installment.value.toLocaleString("pt-BR")}</TableCell>
                                                  <TableCell>
                                                    {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                                                  </TableCell>
                                                  <TableCell>
                                                    <Badge
                                                      className={
                                                        installment.paid
                                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                                          : "bg-orange-100 text-orange-800 border-orange-200"
                                                      }
                                                    >
                                                      {installment.paid ? "Pago" : "Pendente"}
                                                    </Badge>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Button
                                                      size="sm"
                                                      variant={installment.paid ? "outline" : "default"}
                                                      className={installment.paid ? "" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                                                    >
                                                      {installment.paid ? "Marcar Pendente" : "Marcar Pago"}
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
