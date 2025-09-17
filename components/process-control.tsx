"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Importar Tabs
import { 
  Trash2, Plus, Search, Download, Eye, Edit, Clock, AlertCircle, CheckCircle, XCircle, 
  Users, Save, Database, Wifi, WifiOff, ArrowUpRight, TrendingUp, Filter, MoreVertical,
  FileText, Scale, AlertTriangle, FolderOpen // Novo ícone
} from "lucide-react"
import { DatabaseService, type Process, type ProcessTimeline, type Client } from "@/lib/supabase"
import { DocumentsModule } from "./documents-module"; // Importar o novo módulo

// ... (Componentes ModernLoader, ProcessStatsCard, ConnectionStatus permanecem os mesmos) ...

// Componente de loading moderno
function ModernLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando processos do banco...</p>
      </div>
    </div>
  )
}

// Componente de estatísticas moderno
function ProcessStatsCard({ title, value, change, icon: Icon, color }: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">{change}</span>
              <span className="text-sm text-slate-500">este mês</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de status da conexão
function ConnectionStatus({ isOnline, lastSaved, isSaving }: {
  isOnline: boolean
  lastSaved: Date | null
  isSaving: boolean
}) {
  return (
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <div className="flex items-center space-x-1 text-emerald-600">
            <Wifi className="h-4 w-4" />
            <span className="font-medium">Online</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">Offline</span>
          </div>
        )}
      </div>
      
      {lastSaved && (
        <div className="flex items-center space-x-1 text-emerald-600">
          <Database className="h-4 w-4" />
          <span>Sincronizado: {lastSaved.toLocaleTimeString()}</span>
        </div>
      )}
      
      {isSaving && (
        <div className="flex items-center space-x-1 text-orange-600">
          <Save className="h-4 w-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      )}
    </div>
  )
}


export function ProcessControl() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterSource, setFilterSource] = useState("all")
  const [selectedProcess, setSelectedProcess] = useState<(Process & { timeline?: ProcessTimeline[] }) | null>(null)
  const [processes, setProcesses] = useState<Process[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  const [newProcessForm, setNewProcessForm] = useState({
    number: "",
    clientId: "",
    type: "",
    court: "",
    value: "",
    status: "Em andamento",
    observations: "",
  })

  const [editingProcess, setEditingProcess] = useState<Process | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; process: Process | null }>({
    show: false,
    process: null,
  })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load data from Supabase on component mount
  useEffect(() => {
    loadProcessesFromDatabase()
    loadClientsFromDatabase()
  }, [])

  // Set up real-time subscriptions
  useEffect(() => {
    const processSubscription = DatabaseService.subscribeToProcesses((payload) => {
      console.log("Real-time process update:", payload)
      loadProcessesFromDatabase()
    })

    const clientSubscription = DatabaseService.subscribeToClients((payload) => {
      console.log("Real-time client update:", payload)
      loadClientsFromDatabase()
    })

    return () => {
      processSubscription.unsubscribe()
      clientSubscription()
    }
  }, [])

  // Load processes from Supabase
  const loadProcessesFromDatabase = async () => {
    try {
      setIsLoading(true)
      const data = await DatabaseService.getProcesses()

      const enrichedProcesses = await Promise.all(
        data.map(async (process) => {
          if (process.client_id) {
            const client =
              clients.find((c) => c.id === process.client_id) ||
              (await DatabaseService.getClientById(process.client_id))
            return {
              ...process,
              client_name: client ? client["EXECUTADO(A)"] : "Cliente não encontrado",
            }
          }
          return { ...process, client_name: "Sem cliente" }
        })
      )

      setProcesses(enrichedProcesses)
      setLastSaved(new Date())
      console.log(`✅ Loaded ${enrichedProcesses.length} processes from Supabase`)
    } catch (error) {
      console.error("❌ Error loading processes from database:", error)
      loadProcessesFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }

  // Load clients from Supabase
  const loadClientsFromDatabase = async () => {
    try {
      const data = await DatabaseService.getClients()
      setClients(data)
      console.log(`✅ Loaded ${data.length} clients from Supabase`)
    } catch (error) {
      console.error("❌ Error loading clients from database:", error)
    }
  }

  // Fallback: Load from localStorage
  const loadProcessesFromLocalStorage = () => {
    try {
      const savedProcesses = localStorage.getItem("law_firm_processes")
      if (savedProcesses) {
        const parsedProcesses = JSON.parse(savedProcesses)
        const transformedProcesses = parsedProcesses.map((process: any) => ({
          ...process,
          client_name: process.client,
          client_id: process.clientId,
          created_date: process.createdDate,
          last_update: process.lastUpdate,
          next_deadline: process.nextDeadline,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
        setProcesses(transformedProcesses)
        console.log(`⚠️ Loaded ${transformedProcesses.length} processes from localStorage (fallback)`)
      }
    } catch (error) {
      console.error("❌ Error loading processes from localStorage:", error)
    }
  }

  const filteredProcesses = processes.filter((process) => {
    const searchString = process.number + process.client_name + process.type;
    const matchesSearch = searchString.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || process.status === filterStatus;
    const matchesSource =
      filterSource === "all" ||
      (filterSource === "client" && process.source === "client") ||
      (filterSource === "manual" && process.source === "manual") ||
      (filterSource === "no-client" && !process.client_id);

    return matchesSearch && matchesStatus && matchesSource;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Em andamento": { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Clock },
      "Finalizado": { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: CheckCircle },
      "Suspenso": { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
      "Arquivado": { color: "bg-slate-100 text-slate-800 border-slate-200", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["Em andamento"]
    const Icon = config.icon

    return (
      <Badge className={`${config.color} border flex items-center space-x-1 px-3 py-1`}>
        <Icon className="h-3 w-3" />
        <span>{status}</span>
      </Badge>
    )
  }

  const getSourceBadge = (source: string, clientId: number | undefined) => {
    if (source === "client" && clientId) {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 flex items-center space-x-1 px-3 py-1">
          <Users className="h-3 w-3" />
          <span>Cliente</span>
        </Badge>
      )
    } else {
      return <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1">Manual</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const loadProcessTimeline = async (processId: number) => {
    try {
      const timeline = await DatabaseService.getProcessTimeline(processId)
      return timeline
    } catch (error) {
      console.error("❌ Error loading process timeline:", error)
      return []
    }
  }

  const handleProcessClick = async (process: Process) => {
    try {
      const timeline = await loadProcessTimeline(process.id)
      setSelectedProcess({ ...process, timeline })
    } catch (error) {
      console.error("❌ Error loading process details:", error)
      setSelectedProcess(process)
    }
  }

  const handleClientSelection = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id.toString() === clientId)
    if (selectedClient) {
      setNewProcessForm((prev) => ({
        ...prev,
        clientId: clientId,
        number: selectedClient.PROCESSO || prev.number,
      }))
    }
  }

  const handleEditProcess = (process: Process) => {
    setEditingProcess(process)
  }

  const handleDeleteProcess = (process: Process) => {
    setDeleteConfirmation({ show: true, process })
  }

  const confirmDeleteProcess = async () => {
    if (deleteConfirmation.process) {
      try {
        await DatabaseService.deleteProcess(deleteConfirmation.process.id)
        await loadProcessesFromDatabase()
        setDeleteConfirmation({ show: false, process: null })
        alert("Processo excluído com sucesso!")
      } catch (error) {
        console.error("Error deleting process:", error)
        alert("Erro ao excluir processo")
      }
    }
  }

  const handleCreateProcess = async () => {
    if (!newProcessForm.number || !newProcessForm.clientId || !newProcessForm.type) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    try {
      await DatabaseService.createProcess({
        number: newProcessForm.number,
        client_id: Number.parseInt(newProcessForm.clientId),
        type: newProcessForm.type,
        court: newProcessForm.court,
        value: Number.parseFloat(newProcessForm.value),
        status: newProcessForm.status,
      })
      await loadProcessesFromDatabase()
      setNewProcessForm({
        number: "",
        clientId: "",
        type: "",
        court: "",
        value: "",
        status: "Em andamento",
        observations: "",
      })
      alert("Processo cadastrado com sucesso!")
    } catch (error) {
      console.error("Error creating process:", error)
      alert("Erro ao cadastrar processo")
    }
  }

  const handleStatusChange = async (processId: number, newStatus: string) => {
    try {
      await DatabaseService.updateProcess(processId, { status: newStatus })
      await loadProcessesFromDatabase()
    } catch (error) {
      console.error("Error updating process status:", error)
      alert("Erro ao atualizar status do processo")
    }
  }

  // Statistics
  const stats = {
    total: processes.length,
    fromClients: processes.filter((p) => p.source === "client").length,
    manual: processes.filter((p) => p.source === "manual").length,
    active: processes.filter((p) => p.status === "Em andamento").length,
  }

  if (isLoading) {
    return <ModernLoader />
  }

  const statsCards = [
    {
      title: "Total de Processos",
      value: stats.total.toString(),
      change: "+12",
      icon: Scale,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "De Clientes",
      value: stats.fromClients.toString(),
      change: "+8",
      icon: Users,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Processos Ativos",
      value: stats.active.toString(),
      change: "+5",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      title: "Manuais",
      value: stats.manual.toString(),
      change: "+4",
      icon: FileText,
      color: "bg-gradient-to-br from-orange-500 to-orange-600"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header moderno */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Controle de Processos</h2>
            <p className="text-slate-300 text-lg">Gerencie todos os processos judiciais</p>
            <div className="mt-4">
              <ConnectionStatus isOnline={isOnline} lastSaved={lastSaved} isSaving={isSaving} />
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-white border border-gray-200 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Processo</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número do Processo *</Label>
                  <Input
                    placeholder="0000000-00.0000.0.00.0000"
                    value={newProcessForm.number}
                    onChange={(e) => setNewProcessForm((prev) => ({ ...prev, number: e.target.value }))}
                    className="h-11 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cliente *</Label>
                  <Select onValueChange={handleClientSelection} value={newProcessForm.clientId}>
                    <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client["EXECUTADO(A)"]} - {client.CPF} ({client.CIDADE || "Sem cidade"})
                        </SelectItem>
                      ))}
                      <SelectItem value="new">+ Cadastrar novo cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newProcessForm.clientId && newProcessForm.clientId !== "new" && (
                  <div className="col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-xl">
                    <Label className="font-semibold text-blue-800 flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Dados do Cliente Selecionado</span>
                    </Label>
                    {(() => {
                      const selectedClient = clients.find((c) => c.id.toString() === newProcessForm.clientId)
                      return selectedClient ? (
                        <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                          <div className="bg-white/60 p-2 rounded">
                            <strong>Nome:</strong> {selectedClient["EXECUTADO(A)"]}
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                            <strong>CPF:</strong> {selectedClient.CPF}
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                            <strong>Telefone:</strong> {selectedClient.TELEFONE || "Não informado"}
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                            <strong>Endereço:</strong> {selectedClient.ENDERECO || "Não informado"}
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                            <strong>Cidade:</strong> {selectedClient.CIDADE || "Não informado"}
                          </div>
                          <div className="bg-white/60 p-2 rounded">
                            <strong>Loja:</strong> {selectedClient.LOJA || "Não informado"}
                          </div>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Ação *</Label>
                  <Select onValueChange={(value) => setNewProcessForm((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="execucao-titulo-extrajudicial">Execução de Título Extrajudicial</SelectItem>
                      <SelectItem value="cobranca">Ação de Cobrança</SelectItem>
                      <SelectItem value="monitoria">Ação Monitória</SelectItem>
                      <SelectItem value="busca-apreensao">Busca e Apreensão</SelectItem>
                      <SelectItem value="reintegracao-posse">Reintegração de Posse</SelectItem>
                      <SelectItem value="despejo">Ação de Despejo</SelectItem>
                      <SelectItem value="consignacao-pagamento">Consignação em Pagamento</SelectItem>
                      <SelectItem value="revisional-contrato">Ação Revisional de Contrato</SelectItem>
                      <SelectItem value="indenizacao">Ação de Indenização</SelectItem>
                      <SelectItem value="danos-morais">Ação de Danos Morais</SelectItem>
                      <SelectItem value="divorcio">Divórcio</SelectItem>
                      <SelectItem value="inventario">Inventário</SelectItem>
                      <SelectItem value="trabalhista">Ação Trabalhista</SelectItem>
                      <SelectItem value="previdenciaria">Ação Previdenciária</SelectItem>
                      <SelectItem value="criminal">Ação Criminal</SelectItem>
                      <SelectItem value="habeas-corpus">Habeas Corpus</SelectItem>
                      <SelectItem value="mandado-seguranca">Mandado de Segurança</SelectItem>
                      <SelectItem value="cautelar">Medida Cautelar</SelectItem>
                      <SelectItem value="embargos-terceiro">Embargos de Terceiro</SelectItem>
                      <SelectItem value="usucapiao">Ação de Usucapião</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vara/Tribunal</Label>
                  <Input
                    placeholder="Ex: 1ª Vara Cível"
                    value={newProcessForm.court}
                    onChange={(e) => setNewProcessForm((prev) => ({ ...prev, court: e.target.value }))}
                    className="h-11 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Valor da Causa</Label>
                  <Input
                    placeholder="R$ 0,00"
                    value={newProcessForm.value}
                    onChange={(e) => setNewProcessForm((prev) => ({ ...prev, value: e.target.value }))}
                    className="h-11 bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status Inicial</Label>
                  <Select onValueChange={(value) => setNewProcessForm((prev) => ({ ...prev, status: value }))}>
                    <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Em andamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-sm font-medium">Observações</Label>
                  <Textarea
                    placeholder="Observações sobre o processo..."
                    value={newProcessForm.observations}
                    onChange={(e) => setNewProcessForm((prev) => ({ ...prev, observations: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button
                  variant="outline"
                  className="px-6"
                  onClick={() =>
                    setNewProcessForm({
                      number: "",
                      clientId: "",
                      type: "",
                      court: "",
                      value: "",
                      status: "Em andamento",
                      observations: "",
                    })
                  }
                >
                  Cancelar
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800 px-6" onClick={handleCreateProcess}>
                  Cadastrar Processo
                </Button>
          </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <ProcessStatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Filtros modernos */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por número, cliente ou tipo de processo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="Em andamento">Em andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-48 h-11">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  <SelectItem value="client">De clientes</SelectItem>
                  <SelectItem value="manual">Manuais</SelectItem>
                  <SelectItem value="no-client">Sem cliente</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-11 bg-white border-gray-300 text-gray-900">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela modernizada */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Scale className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-slate-900">Lista de Processos</span>
            <Badge className="ml-auto bg-slate-100 text-slate-700">
              {filteredProcesses.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProcesses.length > 0 ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Número do Processo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Vara/Tribunal</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Origem</TableHead>
                    <TableHead className="font-semibold text-slate-700">Loja</TableHead>
                    <TableHead className="font-semibold text-slate-700">Última Atualização</TableHead>
                    <TableHead className="font-semibold text-slate-700">Próximo Prazo</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProcesses.map((process, index) => (
                    <TableRow key={process.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50 hover:bg-slate-100/50"}>
                      <TableCell className="font-mono text-sm text-slate-700 font-medium">
                        {process.number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{process.client_name}</span>
                          {process.client_id && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {process.client_id}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">{process.type}</TableCell>
                      <TableCell className="text-slate-700">{process.court}</TableCell>
                      <TableCell>{getStatusBadge(process.status)}</TableCell>
                      <TableCell>{getSourceBadge(process.source, process.client_id)}</TableCell>
                      <TableCell className="text-slate-600">{process.store || "-"}</TableCell>
                      <TableCell className="text-slate-600">{formatDate(process.last_update)}</TableCell>
                      <TableCell>
                        {process.next_deadline ? (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600 font-medium">{formatDate(process.next_deadline)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600" onClick={() => handleProcessClick(process)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl bg-white border border-gray-200 shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center space-x-2">
                                    <Scale className="h-5 w-5" />
                                    <span>Detalhes do Processo</span>
                                    </DialogTitle>
                                </DialogHeader>
                                {selectedProcess && (
                                    <Tabs defaultValue="details" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="details">Detalhes</TabsTrigger>
                                            <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                            <TabsTrigger value="documents">Documentos</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="details" className="pt-4">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Número do Processo</Label>
                                                    <p className="font-mono text-lg font-medium text-slate-900">{selectedProcess.number}</p>
                                                </div>
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Tipo de Ação</Label>
                                                    <p className="text-slate-900">{selectedProcess.type}</p>
                                                </div>
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Vara/Tribunal</Label>
                                                    <p className="text-slate-900">{selectedProcess.court}</p>
                                                </div>
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Valor da Causa</Label>
                                                    <p className="text-slate-900">
                                                    {selectedProcess.value > 0
                                                        ? `R$ ${selectedProcess.value.toLocaleString()}`
                                                        : "Não informado"}
                                                    </p>
                                                </div>
                                                </div>

                                                <div className="space-y-3">
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Cliente</Label>
                                                    <div className="flex items-center gap-2">
                                                    <p className="text-slate-900">{selectedProcess.client_name}</p>
                                                    {selectedProcess.client_id && (
                                                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                        {selectedProcess.client_id}
                                                        </Badge>
                                                    )}
                                                    </div>
                                                </div>
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Status</Label>
                                                    <div className="mt-2">{getStatusBadge(selectedProcess.status)}</div>
                                                </div>
                                                <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Origem</Label>
                                                    <div className="mt-2">
                                                    {getSourceBadge(selectedProcess.source, selectedProcess.client_id)}
                                                    </div>
                                                </div>
                                                {selectedProcess.store && (
                                                    <div className="bg-gray-100 p-4 rounded-xl">
                                                    <Label className="font-semibold text-slate-700">Loja</Label>
                                                    <p className="text-slate-900">{selectedProcess.store}</p>
                                                    </div>
                                                )}
                                                </div>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="timeline" className="pt-4">
                                            <div className="mt-6 space-y-4">
                                            {selectedProcess.timeline && selectedProcess.timeline.length > 0 ? (
                                                selectedProcess.timeline.map((event, index) => (
                                                <div key={index} className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                                                    <div className="flex-shrink-0">
                                                    <div className="w-4 h-4 bg-slate-600 rounded-full mt-2"></div>
                                                    </div>
                                                    <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <span className="font-semibold text-slate-900">{event.event}</span>
                                                        <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700">
                                                        {formatDate(event.date)}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-600">{event.description}</p>
                                                    </div>
                                                </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12 text-slate-500">
                                                <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                                    <Clock className="h-8 w-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold mb-2 text-slate-700">Nenhum evento registrado</h3>
                                                <p className="text-slate-500">A timeline será atualizada conforme o processo avança.</p>
                                                </div>
                                            )}
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="documents" className="pt-4">
                                            <DocumentsModule caseId={selectedProcess.id} />
                                        </TabsContent>
                                    </Tabs>
                                )}
                            </DialogContent>
                          </Dialog>
                          
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600" onClick={() => handleEditProcess(process)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProcess(process)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          
                          <Select onValueChange={(value) => handleStatusChange(process.id, value)}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder={process.status} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Em andamento">Em andamento</SelectItem>
                              <SelectItem value="Suspenso">Suspenso</SelectItem>
                              <SelectItem value="Finalizado">Finalizado</SelectItem>
                              <SelectItem value="Arquivado">Arquivado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Scale className="h-10 w-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-700">Nenhum processo encontrado</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-6">
                Ajuste os filtros de busca ou adicione um novo processo para começar.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-slate-900 hover:bg-slate-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Processo
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmation.show}
        onOpenChange={(open) => setDeleteConfirmation({ show: open, process: null })}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>Confirmar Exclusão</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-700 mb-4">
              Tem certeza que deseja excluir o processo <span className="font-mono font-semibold">{deleteConfirmation.process?.number}</span>?
            </p>
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-sm text-red-700">Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.</p>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setDeleteConfirmation({ show: false, process: null })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProcess}>
              Excluir Processo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Process Dialog */}
      <Dialog open={!!editingProcess} onOpenChange={(open) => !open && setEditingProcess(null)}>
        <DialogContent className="max-w-4xl bg-white border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Editar Processo - {editingProcess?.number}</span>
            </DialogTitle>
          </DialogHeader>
          {editingProcess && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Número do Processo</Label>
                  <Input defaultValue={editingProcess.number} className="h-11 bg-white border-gray-300 text-gray-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Ação</Label>
                  <Select defaultValue={editingProcess.type}>
                    <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="execucao-titulo-extrajudicial">Execução de Título Extrajudicial</SelectItem>
                      <SelectItem value="cobranca">Ação de Cobrança</SelectItem>
                      <SelectItem value="monitoria">Ação Monitória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vara/Tribunal</Label>
                  <Input defaultValue={editingProcess.court} className="h-11 bg-white border-gray-300 text-gray-900" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select defaultValue={editingProcess.status}>
                    <SelectTrigger className="h-11 bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setEditingProcess(null)}>
                  Cancelar
                </Button>
                <Button
                  className="bg-slate-900 hover:bg-slate-800"
                  onClick={() => {
                    alert("Processo atualizado com sucesso!")
                    setEditingProcess(null)
                  }}
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}