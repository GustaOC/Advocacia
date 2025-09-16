"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Download, Eye, Edit, FileText, Folder, FolderOpen, TrendingUp, ArrowUpRight, MoreVertical, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DatabaseService, type Case, type Process } from "@/lib/supabase"

// Componente de loading moderno similar ao dashboard
function ModernLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando tipos de caso...</p>
      </div>
    </div>
  )
}

// Componente de estatísticas moderno para casos
function CaseStatsCard({ title, value, change, icon: Icon, color }: {
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

// Card moderno para tipos de caso
function ModernCaseTypeCard({ caseItem, isSelected, onClick }: {
  caseItem: Case
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isSelected
          ? "border-slate-600 bg-gradient-to-r from-slate-50 to-white shadow-md scale-[1.02]"
          : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50"
      }`}
    >
      <div className="flex items-center space-x-4">
        <div 
          className="w-6 h-6 rounded-xl flex-shrink-0 shadow-sm" 
          style={{ backgroundColor: caseItem.color }} 
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">{caseItem.name}</h3>
          {caseItem.description && (
            <p className="text-sm text-slate-500 truncate mt-1">{caseItem.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isSelected && <FolderOpen className="h-5 w-5 text-slate-600" />}
          <MoreVertical className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  )
}

export function CasesModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [selectedCase, setSelectedCase] = useState<Case | null>(null)
  const [selectedCaseProcesses, setSelectedCaseProcesses] = useState<Process[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCaseForm, setNewCaseForm] = useState({
    name: "",
    description: "",
    color: "#2C3E50",
  })

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      setIsLoading(true)
      const data = await DatabaseService.getCases()
      setCases(data)
    } catch (error) {
      console.error("Error loading cases:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCase = async () => {
    try {
      await DatabaseService.createCase(newCaseForm)
      await loadCases()
      setNewCaseForm({ name: "", description: "", color: "#2C3E50" })
    } catch (error) {
      console.error("Error creating case:", error)
    }
  }

  const handleCaseClick = async (caseItem: Case) => {
    try {
      setSelectedCase(caseItem)
      const processes = await DatabaseService.getCaseProcesses(caseItem.id)
      setSelectedCaseProcesses(processes)
    } catch (error) {
      console.error("Error loading case processes:", error)
      setSelectedCaseProcesses([])
    }
  }

  const filteredCases = cases.filter((caseItem) => {
    const matchesSearch = caseItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "Em andamento": "bg-blue-100 text-blue-800 border-blue-200",
      "Finalizado": "bg-emerald-100 text-emerald-800 border-emerald-200",
      "Aguardando": "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Cancelado": "bg-red-100 text-red-800 border-red-200",
    }

    return (
      <Badge className={`${statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800 border-gray-200"} border`}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (isLoading) {
    return <ModernLoader />
  }

  const stats = [
    {
      title: "Total de Tipos",
      value: cases.length.toString(),
      change: "+3",
      icon: Folder,
      color: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Casos Ativos",
      value: selectedCaseProcesses.length.toString(),
      change: "+12",
      icon: FileText,
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      title: "Concluídos",
      value: selectedCaseProcesses.filter(p => p.status === "Finalizado").length.toString(),
      change: "+8",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-500 to-purple-600"
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header moderno */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Gestão de Casos por Tipo</h2>
            <p className="text-slate-300 text-lg">Organize processos por tipo de ação jurídica</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-white text-slate-900 hover:bg-slate-100 shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo de Caso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Tipo de Caso</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Tipo de Caso *</Label>
                  <Input
                    placeholder="Ex: Execução de Títulos Extrajudiciais"
                    value={newCaseForm.name}
                    onChange={(e) => setNewCaseForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <Textarea
                    placeholder="Descreva este tipo de caso..."
                    value={newCaseForm.description}
                    onChange={(e) => setNewCaseForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cor de Identificação</Label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Input
                        type="color"
                        value={newCaseForm.color}
                        onChange={(e) => setNewCaseForm((prev) => ({ ...prev, color: e.target.value }))}
                        className="w-16 h-11 p-1 border-2"
                      />
                    </div>
                    <Input
                      value={newCaseForm.color}
                      onChange={(e) => setNewCaseForm((prev) => ({ ...prev, color: e.target.value }))}
                      placeholder="#2C3E50"
                      className="flex-1 h-11"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <Button variant="outline" className="px-6">Cancelar</Button>
                <Button onClick={handleCreateCase} className="bg-slate-900 hover:bg-slate-800 px-6">
                  Cadastrar Tipo
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <CaseStatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Filtros e busca modernos */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <Input
                  placeholder="Buscar por tipo de caso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Todos</DropdownMenuItem>
                  <DropdownMenuItem>Ativos</DropdownMenuItem>
                  <DropdownMenuItem>Inativos</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="h-11">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Lista de tipos de caso moderna */}
        <div className="xl:col-span-1">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-slate-900">Tipos de Caso</span>
                <Badge className="ml-auto bg-slate-100 text-slate-700">
                  {filteredCases.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredCases.map((caseItem) => (
                <ModernCaseTypeCard
                  key={caseItem.id}
                  caseItem={caseItem}
                  isSelected={selectedCase?.id === caseItem.id}
                  onClick={() => handleCaseClick(caseItem)}
                />
              ))}
              {filteredCases.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Folder className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-medium mb-2">Nenhum tipo encontrado</h3>
                  <p className="text-sm">Ajuste os filtros ou adicione um novo tipo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Processos do caso selecionado */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-slate-900">
                      {selectedCase
                        ? `Processos: ${selectedCase.name}`
                        : "Selecione um tipo de caso"}
                    </span>
                    {selectedCase && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        {selectedCaseProcesses.length}
                      </Badge>
                    )}
                  </CardTitle>
                  {selectedCase && selectedCase.description && (
                    <div
                      className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium"
                      style={{
                        backgroundColor: `${selectedCase.color}15`,
                        color: selectedCase.color,
                        border: `1px solid ${selectedCase.color}30`
                      }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedCase.color }} />
                      <span>{selectedCase.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedCase ? (
                selectedCaseProcesses.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Número do Processo</TableHead>
                          <TableHead className="font-semibold text-slate-700">Cliente</TableHead>
                          <TableHead className="font-semibold text-slate-700">Status</TableHead>
                          <TableHead className="font-semibold text-slate-700">Última Atualização</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCaseProcesses.map((process, index) => (
                          <TableRow key={process.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                            <TableCell className="font-mono text-sm text-slate-700 font-medium">
                              {process.number}
                            </TableCell>
                            <TableCell className="font-medium text-slate-900">
                              {process.client_name}
                            </TableCell>
                            <TableCell>{getStatusBadge(process.status)}</TableCell>
                            <TableCell className="text-slate-600">
                              {formatDate(process.last_update)}
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600">
                                  <Edit className="h-4 w-4" />
                                </Button>
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
                      <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-700">Nenhum processo encontrado</h3>
                    <p className="text-slate-500 max-w-sm mx-auto">
                      Não há processos vinculados a este tipo de caso ainda. Comece adicionando um novo processo.
                    </p>
                    <Button className="mt-6 bg-slate-900 hover:bg-slate-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Processo
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-16 text-slate-500">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                    <Folder className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-slate-700">Selecione um tipo de caso</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">
                    Clique em um tipo de caso à esquerda para visualizar os processos relacionados e começar a trabalhar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
