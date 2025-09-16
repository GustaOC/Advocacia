"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Search, Filter, Calendar, User, FileText, Loader2, Download, Clock, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PetitionListProps {
  onReviewPetition: (petition: any) => void
}

export function PetitionList({ onReviewPetition }: PetitionListProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [petitions, setPetitions] = useState<any[]>([])
  const [filteredPetitions, setFilteredPetitions] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    loadPetitions()
  }, [])

  useEffect(() => {
    filterPetitions()
  }, [petitions, searchTerm, statusFilter, priorityFilter])

  const loadPetitions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/petitions")
      if (response.ok) {
        const { petitions } = await response.json()
        setPetitions(petitions || [])
      } else {
        // Mock data for development
        const mockPetitions = [
          {
            id: 1,
            title: "Petição Inicial - Ação de Cobrança",
            description: "Revisar cálculos e fundamentação jurídica",
            deadline: "2024-02-15",
            status: "pending",
            created_by_employee: { name: "João Silva", email: "joao@advocacia.com" },
            assigned_to_employee: { name: "Dr. Cássio Miguel", email: "cassio@advocacia.com" },
            created_at: "2024-01-20T10:00:00Z",
            file_name: "peticao_inicial_cobranca.docx",
            priority: "high"
          },
          {
            id: 2,
            title: "Contestação - Processo 123456",
            description: "Urgente - prazo próximo",
            deadline: "2024-02-10",
            status: "under_review",
            lawyer_notes: "Revisando argumentos de defesa",
            created_by_employee: { name: "Maria Santos", email: "maria@advocacia.com" },
            assigned_to_employee: { name: "Dr. Cássio Miguel", email: "cassio@advocacia.com" },
            created_at: "2024-01-18T14:30:00Z",
            file_name: "contestacao_123456.docx",
            priority: "high"
          },
          {
            id: 3,
            title: "Recurso de Apelação",
            description: "Revisar fundamentação e jurisprudência",
            deadline: "2024-02-20",
            status: "approved",
            final_verdict: "approved",
            lawyer_notes: "Excelente trabalho! Aprovado sem alterações.",
            created_by_employee: { name: "Pedro Oliveira", email: "pedro@advocacia.com" },
            assigned_to_employee: { name: "Dr. Cássio Miguel", email: "cassio@advocacia.com" },
            created_at: "2024-01-15T09:15:00Z",
            file_name: "recurso_apelacao.docx",
            priority: "medium"
          },
          {
            id: 4,
            title: "Petição de Execução",
            description: "Verificar valores e documentos",
            deadline: "2024-02-12",
            status: "corrections_needed",
            final_verdict: "corrections_needed",
            lawyer_notes: "Necessário ajustar os cálculos de juros e incluir mais jurisprudência.",
            created_by_employee: { name: "Ana Costa", email: "ana@advocacia.com" },
            assigned_to_employee: { name: "Dr. Cássio Miguel", email: "cassio@advocacia.com" },
            created_at: "2024-01-16T16:45:00Z",
            file_name: "peticao_execucao.docx",
            priority: "medium"
          },
          {
            id: 5,
            title: "Agravo de Instrumento",
            description: "Revisão urgente necessária",
            deadline: "2024-02-08",
            status: "rejected",
            final_verdict: "rejected",
            lawyer_notes: "Argumentação insuficiente. Necessário refazer completamente.",
            created_by_employee: { name: "Carlos Silva", email: "carlos@advocacia.com" },
            assigned_to_employee: { name: "Dr. Cássio Miguel", email: "cassio@advocacia.com" },
            created_at: "2024-01-12T11:20:00Z",
            file_name: "agravo_instrumento.docx",
            priority: "low"
          },
        ]
        setPetitions(mockPetitions)
      }
    } catch (error) {
      console.error("Error loading petitions:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as petições",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPetitions = () => {
    let filtered = petitions

    if (searchTerm) {
      filtered = filtered.filter(
        (petition) =>
          petition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          petition.created_by_employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          petition.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((petition) => petition.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((petition) => petition.priority === priorityFilter)
    }

    setFilteredPetitions(filtered)
  }

  const getStatusBadge = (status: string, finalVerdict?: string) => {
    const statusConfig = {
      pending: { 
        label: "Pendente", 
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Clock
      },
      under_review: { 
        label: "Em Revisão", 
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Eye
      },
      approved: { 
        label: "Aprovado", 
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle
      },
      corrections_needed: { 
        label: "Correções", 
        className: "bg-orange-100 text-orange-800 border-orange-200",
        icon: AlertTriangle
      },
      rejected: { 
        label: "Rejeitado", 
        className: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <Badge className={`${config.className} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    }

    const labels = {
      high: "Alta",
      medium: "Média", 
      low: "Baixa"
    }

    return (
      <Badge className={priorityConfig[priority as keyof typeof priorityConfig]}>
        {labels[priority as keyof typeof labels]}
      </Badge>
    )
  }

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDeadlineBadge = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline)
    if (days < 0) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Vencido ({Math.abs(days)}d)</Badge>
    } else if (days <= 2) {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{days} dias</Badge>
    } else if (days <= 5) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{days} dias</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800 border-green-200">{days} dias</Badge>
    }
  }

  // Estatísticas calculadas
  const stats = useMemo(() => {
    return {
      total: filteredPetitions.length,
      pending: filteredPetitions.filter(p => p.status === "pending").length,
      inReview: filteredPetitions.filter(p => p.status === "under_review").length,
      approved: filteredPetitions.filter(p => p.status === "approved").length,
      needsCorrection: filteredPetitions.filter(p => p.status === "corrections_needed").length,
      rejected: filteredPetitions.filter(p => p.status === "rejected").length,
      urgent: filteredPetitions.filter(p => getDaysUntilDeadline(p.deadline) <= 2).length
    }
  }, [filteredPetitions])

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-slate-600">Carregando petições...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            <p className="text-xs text-blue-700">Total</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            <p className="text-xs text-yellow-700">Pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <Eye className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{stats.inReview}</p>
            <p className="text-xs text-blue-700">Em Revisão</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
            <p className="text-xs text-green-700">Aprovadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-900">{stats.needsCorrection}</p>
            <p className="text-xs text-orange-700">Correções</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4 text-center">
            <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            <p className="text-xs text-red-700">Rejeitadas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{stats.urgent}</p>
            <p className="text-xs text-purple-700">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">Lista de Petições</span>
                <p className="text-sm text-slate-600 font-normal">
                  Gerencie e acompanhe todas as petições em revisão
                </p>
              </div>
            </div>
            <Button variant="outline" className="px-6">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Buscar por título, funcionário ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-11">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="under_review">Em Revisão</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="corrections_needed">Correções Necessárias</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-48 h-11">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Petição</TableHead>
                  <TableHead className="font-semibold">Funcionário</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Prioridade</TableHead>
                  <TableHead className="font-semibold">Prazo</TableHead>
                  <TableHead className="font-semibold">Criado</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPetitions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="space-y-4">
                        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-2">Nenhuma petição encontrada</h3>
                          <p className="text-slate-600">
                            {searchTerm || statusFilter !== "all" || priorityFilter !== "all" 
                              ? "Tente ajustar os filtros de busca"
                              : "Não há petições cadastradas ainda"
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPetitions.map((petition) => (
                    <TableRow key={petition.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900 leading-tight">{petition.title}</p>
                          {petition.description && (
                            <p className="text-sm text-slate-600 line-clamp-2">{petition.description}</p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-slate-500">
                            <FileText className="h-3 w-3" />
                            <span>{petition.file_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 text-sm">{petition.created_by_employee.name}</p>
                            <p className="text-xs text-slate-500">{petition.created_by_employee.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(petition.status, petition.final_verdict)}
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(petition.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-mono">
                              {new Date(petition.deadline).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          {getDeadlineBadge(petition.deadline)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 font-mono">
                          {new Date(petition.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <p className="text-xs text-slate-500">
                          {new Date(petition.created_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReviewPetition(petition)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Footer */}
          {filteredPetitions.length > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
              <span className="font-medium">
                Mostrando {filteredPetitions.length} de {petitions.length} petições
              </span>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Pendentes: {stats.pending}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Em Revisão: {stats.inReview}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Aprovadas: {stats.approved}</span>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
