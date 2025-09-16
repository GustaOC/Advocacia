"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar, Clock, AlertTriangle, CheckCircle, Upload, Eye, Edit, Bell, Trash2, Search, Download, Filter, TrendingUp, ArrowUpRight } from "lucide-react"

interface Publication {
  id: number
  date: string
  process: string
  client: string
  type: string
  deadline: string | null
  status: "Pendente" | "Em andamento" | "Concluído" | "Atrasado"
  responsible: string
  description: string
  priority: "Alta" | "Média" | "Baixa"
  daysUntilDeadline: number | null
}

// Componente de estatísticas moderno
function ModernStatsCard({ title, value, change, changeType, icon: Icon, bgColor }: {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ElementType
  bgColor: string
}) {
  const ChangeIcon = changeType === 'increase' ? ArrowUpRight : ArrowUpRight

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <div className="flex items-center space-x-1">
              <ChangeIcon className={`h-4 w-4 ${changeType === 'increase' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-sm font-medium ${changeType === 'increase' ? 'text-emerald-600' : 'text-red-600'}`}>
                {change}
              </span>
              <span className="text-sm text-slate-500">vs semana anterior</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
             <Icon className="h-6 w-6 text-white" />
          </div>

        </div>
      </CardContent>
    </Card>
  )
}

// Componente de card de publicação modernizado
function ModernPublicationCard({ publication, onEdit, onDelete, onView }: {
  publication: Publication
  onEdit: (pub: Publication) => void
  onDelete: (pub: Publication) => void
  onView: (pub: Publication) => void
}) {
  const getBorderColor = () => {
    switch (publication.status) {
      case "Pendente": return "border-l-yellow-500"
      case "Em andamento": return "border-l-blue-500"
      case "Concluído": return "border-l-green-500"
      case "Atrasado": return "border-l-red-500"
      default: return "border-l-slate-500"
    }
  }

  const getPriorityColor = () => {
    switch (publication.priority) {
      case "Alta": return "bg-red-100 text-red-800 border-red-200"
      case "Média": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "Baixa": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusColor = () => {
    switch (publication.status) {
      case "Pendente": return "bg-yellow-100 text-yellow-800"
      case "Em andamento": return "bg-blue-100 text-blue-800"
      case "Concluído": return "bg-green-100 text-green-800"
      case "Atrasado": return "bg-red-100 text-red-800"
      default: return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <Card className={`relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 ${getBorderColor()} border-l-4 group`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 text-lg">{publication.type}</h3>
              <p className="text-slate-600 font-medium">{publication.client}</p>
              <p className="text-sm font-mono text-slate-500 bg-slate-50 px-2 py-1 rounded">{publication.process}</p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <Badge className={getPriorityColor()}>{publication.priority}</Badge>
              <Badge className={getStatusColor()}>{publication.status}</Badge>
            </div>
          </div>

          {/* Description */}
          {publication.description && (
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{publication.description}</p>
          )}

          {/* Deadline */}
          {publication.deadline && publication.daysUntilDeadline !== null && (
            <div
              className={`flex items-center space-x-2 p-3 rounded-lg ${
                publication.daysUntilDeadline <= 3
                  ? 'bg-red-50 border border-red-200'
                  : publication.daysUntilDeadline <= 7
                  ? 'bg-orange-50 border border-orange-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <Calendar
                className={`h-4 w-4 ${
                  publication.daysUntilDeadline <= 3
                    ? 'text-red-600'
                    : publication.daysUntilDeadline <= 7
                    ? 'text-orange-600'
                    : 'text-blue-600'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  publication.daysUntilDeadline <= 3
                    ? 'text-red-800'
                    : publication.daysUntilDeadline <= 7
                    ? 'text-orange-800'
                    : 'text-blue-800'
                }`}
              >
                Prazo: {new Date(publication.deadline).toLocaleDateString("pt-BR")} 
                ({Math.abs(publication.daysUntilDeadline)} {publication.daysUntilDeadline === 1 ? 'dia' : 'dias'} 
                {publication.daysUntilDeadline < 0 ? 'em atraso' : 'restantes'})
              </span>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Publicado em {new Date(publication.date).toLocaleDateString("pt-BR")}
            </span>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onView(publication)}
                className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(publication)}
                className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onDelete(publication)}
                className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PublicationsModule() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  
  const [publications, setPublications] = useState<Publication[]>([
    {
      id: 1,
      date: "2024-01-27",
      process: "1234567-89.2023.8.12.0001",
      client: "João Silva",
      type: "Intimação",
      deadline: "2024-02-15",
      status: "Pendente",
      responsible: "Dr. Cássio Miguel",
      description: "Intimação para apresentar contestação no prazo legal de 15 dias",
      priority: "Alta",
      daysUntilDeadline: 19,
    },
    {
      id: 2,
      date: "2024-01-27",
      process: "9876543-21.2023.8.12.0002",
      client: "Maria Santos",
      type: "Citação",
      deadline: "2024-02-10",
      status: "Em andamento",
      responsible: "Dr. Cássio Miguel",
      description: "Citação para audiência de conciliação",
      priority: "Média",
      daysUntilDeadline: 14,
    },
    {
      id: 3,
      date: "2024-01-26",
      process: "4567891-23.2023.8.12.0003",
      client: "Pedro Costa",
      type: "Sentença",
      deadline: null,
      status: "Concluído",
      responsible: "Dr. Cássio Miguel",
      description: "Sentença favorável publicada, processo finalizado com êxito",
      priority: "Baixa",
      daysUntilDeadline: null,
    },
    {
      id: 4,
      date: "2024-01-25",
      process: "1111111-11.2023.8.12.0004",
      client: "Ana Oliveira",
      type: "Despacho",
      deadline: "2024-01-20",
      status: "Atrasado",
      responsible: "Dr. Cássio Miguel",
      description: "Despacho determinando emenda à inicial",
      priority: "Alta",
      daysUntilDeadline: -7,
    },
  ])

  const [draggedItem, setDraggedItem] = useState<Publication | null>(null)
  const [newPublicationForm, setNewPublicationForm] = useState({
    date: "",
    process: "",
    client: "",
    type: "",
    deadline: "",
    priority: "Média" as "Alta" | "Média" | "Baixa",
    description: "",
  })

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = publications.length
    const pending = publications.filter(p => p.status === "Pendente").length
    const inProgress = publications.filter(p => p.status === "Em andamento").length
    const completed = publications.filter(p => p.status === "Concluído").length
    const overdue = publications.filter(p => p.status === "Atrasado" || (p.daysUntilDeadline !== null && p.daysUntilDeadline < 0)).length

    return [
      {
        title: "Total de Publicações",
        value: total.toString(),
        change: "+8%",
        changeType: 'increase' as const,
        icon: Bell,
        bgColor: "from-blue-500 to-blue-600"
      },
      {
        title: "Pendentes",
        value: pending.toString(),
        change: "+12%",
        changeType: 'increase' as const,
        icon: Clock,
        bgColor: "from-yellow-500 to-yellow-600"
      },
      {
        title: "Em Andamento",
        value: inProgress.toString(),
        change: "-5%",
        changeType: 'decrease' as const,
        icon: TrendingUp,
        bgColor: "from-blue-500 to-blue-600"
      },
      {
        title: "Alertas de Prazo",
        value: overdue.toString(),
        change: overdue > 0 ? `+${overdue}` : "0",
        changeType: overdue > 0 ? 'increase' as const : 'decrease' as const,
        icon: AlertTriangle,
        bgColor: "from-red-500 to-red-600"
      },
    ]
  }, [publications])

  // Publicações filtradas
  const filteredPublications = useMemo(() => {
    return publications.filter((pub) => {
      const matchesSearch = pub.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           pub.type.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === "all" || pub.status === filterStatus
      const matchesPriority = filterPriority === "all" || pub.priority === filterPriority

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [publications, searchTerm, filterStatus, filterPriority])

  // Handlers
  const handleDragStart = (e: React.DragEvent, publication: Publication) => {
    setDraggedItem(publication)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, newStatus: Publication["status"]) => {
    e.preventDefault()
    if (draggedItem && draggedItem.status !== newStatus) {
      const updatedPublications = publications.map((pub) =>
        pub.id === draggedItem.id ? { ...pub, status: newStatus } : pub
      )
      setPublications(updatedPublications)
    }
    setDraggedItem(null)
  }

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPublicationForm.date || !newPublicationForm.process || !newPublicationForm.client || !newPublicationForm.type) {
      alert("Preencha todos os campos obrigatórios")
      return
    }

    const newPublication: Publication = {
      id: Date.now(),
      ...newPublicationForm,
      status: "Pendente",
      responsible: "Dr. Cássio Miguel",
      daysUntilDeadline: newPublicationForm.deadline
        ? Math.ceil((new Date(newPublicationForm.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }

    setPublications(prev => [...prev, newPublication])
    setNewPublicationForm({
      date: "",
      process: "",
      client: "",
      type: "",
      deadline: "",
      priority: "Média",
      description: "",
    })
    alert("Publicação cadastrada com sucesso!")
  }

  const handleEditPublication = (publication: Publication) => {
    alert(`Editar publicação: ${publication.type} - ${publication.client}`)
  }

  const handleViewPublication = (publication: Publication) => {
    alert(`Visualizar publicação: ${publication.type} - ${publication.client}`)
  }

  const handleDeletePublication = (publication: Publication) => {
    if (confirm(`Tem certeza que deseja excluir a publicação: ${publication.type} - ${publication.client}?`)) {
      setPublications(prev => prev.filter(pub => pub.id !== publication.id))
      alert("Publicação excluída com sucesso!")
    }
  }

  const getPublicationsByStatus = (status: string) => {
    return filteredPublications.filter(pub => pub.status === status)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="space-y-8">
        {/* Header moderno */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Publicações Diárias</h2>
              <p className="text-slate-300 text-lg">Gerencie publicações e prazos processuais com eficiência</p>
            </div>
            <div className="flex space-x-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
                  <DialogHeader>
                    <DialogTitle>Importar Publicações</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Arquivo CSV/Excel</Label>
                      <Input type="file" accept=".csv,.xlsx,.xls" className="mt-2" />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">Formato esperado:</h4>
                      <p className="text-sm text-blue-800">Data, Processo, Cliente, Tipo, Prazo, Descrição</p>
                      <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-800">
                        Baixar modelo de exemplo
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline">Cancelar</Button>
                    <Button className="bg-[#2C3E50] hover:bg-[#3D566E]">Importar Publicações</Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-white text-slate-900 hover:bg-slate-100">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Publicação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white text-slate-900 rounded-lg shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Cadastrar Nova Publicação</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitForm}>
                    <div className="grid grid-cols-2 gap-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Data da Publicação *</Label>
                        <Input
                          type="date"
                          value={newPublicationForm.date}
                          onChange={(e) => setNewPublicationForm(prev => ({ ...prev, date: e.target.value }))}
                          required
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Número do Processo *</Label>
                        <Input
                          placeholder="0000000-00.0000.0.00.0000"
                          value={newPublicationForm.process}
                          onChange={(e) => setNewPublicationForm(prev => ({ ...prev, process: e.target.value }))}
                          required
                          className="w-full font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Cliente *</Label>
                        <Input
                          placeholder="Nome do cliente"
                          value={newPublicationForm.client}
                          onChange={(e) => setNewPublicationForm(prev => ({ ...prev, client: e.target.value }))}
                          required
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tipo de Publicação *</Label>
                        <Select
                          value={newPublicationForm.type}
                          onValueChange={(value) => setNewPublicationForm(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Intimação">Intimação</SelectItem>
                            <SelectItem value="Citação">Citação</SelectItem>
                            <SelectItem value="Sentença">Sentença</SelectItem>
                            <SelectItem value="Despacho">Despacho</SelectItem>
                            <SelectItem value="Acórdão">Acórdão</SelectItem>
                            <SelectItem value="Decisão">Decisão</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Prazo</Label>
                        <Input
                          type="date"
                          value={newPublicationForm.deadline}
                          onChange={(e) => setNewPublicationForm(prev => ({ ...prev, deadline: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Prioridade</Label>
                        <Select
                          value={newPublicationForm.priority}
                          onValueChange={(value: "Alta" | "Média" | "Baixa") =>
                            setNewPublicationForm(prev => ({ ...prev, priority: value }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alta">Alta</SelectItem>
                            <SelectItem value="Média">Média</SelectItem>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-sm font-medium">Descrição</Label>
                        <Textarea
                          placeholder="Descrição detalhada da publicação..."
                          value={newPublicationForm.description}
                          onChange={(e) => setNewPublicationForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full min-h-[100px]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                      <Button type="button" variant="outline">Cancelar</Button>
                      <Button type="submit" className="bg-[#2C3E50] hover:bg-[#3D566E] text-white">
                        Cadastrar Publicação
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <ModernStatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Buscar por cliente, processo ou tipo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="px-6">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board - Modernizado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pendente Column */}
          <div 
            onDragOver={handleDragOver} 
            onDrop={(e) => handleDrop(e, "Pendente")}
            className="space-y-4"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-500 rounded-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-yellow-800">Pendente</span>
                  </span>
                  <Badge className="bg-yellow-200 text-yellow-800 border-yellow-300">
                    {getPublicationsByStatus("Pendente").length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {getPublicationsByStatus("Pendente").map((publication) => (
                <div
                  key={publication.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, publication)}
                  className="cursor-move"
                >
                  <ModernPublicationCard
                    publication={publication}
                    onEdit={handleEditPublication}
                    onDelete={handleDeletePublication}
                    onView={handleViewPublication}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Em Andamento Column */}
          <div 
            onDragOver={handleDragOver} 
            onDrop={(e) => handleDrop(e, "Em andamento")}
            className="space-y-4"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-blue-800">Em Andamento</span>
                  </span>
                  <Badge className="bg-blue-200 text-blue-800 border-blue-300">
                    {getPublicationsByStatus("Em andamento").length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {getPublicationsByStatus("Em andamento").map((publication) => (
                <div
                  key={publication.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, publication)}
                  className="cursor-move"
                >
                  <ModernPublicationCard
                    publication={publication}
                    onEdit={handleEditPublication}
                    onDelete={handleDeletePublication}
                    onView={handleViewPublication}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Concluído Column */}
          <div 
            onDragOver={handleDragOver} 
            onDrop={(e) => handleDrop(e, "Concluído")}
            className="space-y-4"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-green-800">Concluído</span>
                  </span>
                  <Badge className="bg-green-200 text-green-800 border-green-300">
                    {getPublicationsByStatus("Concluído").length}
                  </Badge>
                </CardTitle>
              </CardHeader>
            </Card>

            <div className="space-y-4">
              {getPublicationsByStatus("Concluído").map((publication) => (
                <div
                  key={publication.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, publication)}
                  className="cursor-move"
                >
                  <ModernPublicationCard
                    publication={publication}
                    onEdit={handleEditPublication}
                    onDelete={handleDeletePublication}
                    onView={handleViewPublication}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertas de Prazo - Seção Modernizada */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Alertas de Prazo Urgente</h3>
                  <p className="text-sm text-slate-600">Publicações que requerem atenção imediata</p>
                </div>
              </span>
              <Badge className="bg-red-100 text-red-800 text-lg px-3 py-1">
                {publications.filter(pub => pub.deadline && pub.daysUntilDeadline !== null && pub.daysUntilDeadline <= 7).length} alertas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {publications
                .filter(pub => pub.deadline && pub.daysUntilDeadline !== null && pub.daysUntilDeadline <= 7)
                .sort((a, b) => (a.daysUntilDeadline || 0) - (b.daysUntilDeadline || 0))
                .map((publication) => (
                  <Card key={publication.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div
                            className={`p-3 rounded-xl ${
                              publication.daysUntilDeadline! <= 1
                                ? 'bg-red-100 text-red-600'
                                : publication.daysUntilDeadline! <= 3
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-yellow-100 text-yellow-600'
                            }`}
                          >
                            <AlertTriangle className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-lg">
                              {publication.type} - {publication.client}
                            </h4>
                            <p className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded">
                              {publication.process}
                            </p>
                            <p className="text-sm text-slate-600">{publication.description}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge
                            className={`text-lg px-4 py-2 ${
                              publication.daysUntilDeadline! <= 1
                                ? 'bg-red-100 text-red-800 border-red-200'
                                : publication.daysUntilDeadline! <= 3
                                ? 'bg-orange-100 text-orange-800 border-orange-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            {Math.abs(publication.daysUntilDeadline!)} {Math.abs(publication.daysUntilDeadline!) === 1 ? 'dia' : 'dias'}
                            {publication.daysUntilDeadline! < 0 ? ' em atraso' : ' restantes'}
                          </Badge>
                          <p className="text-sm text-slate-600">
                            Prazo: {publication.deadline && new Date(publication.deadline).toLocaleDateString("pt-BR")}
                          </p>
                          <div className="flex space-x-2 justify-end">
                            <Button 
                              size="sm" 
                              onClick={() => handleViewPublication(publication)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleEditPublication(publication)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              
              {publications.filter(pub => pub.deadline && pub.daysUntilDeadline !== null && pub.daysUntilDeadline <= 7).length === 0 && (
                <div className="text-center py-12">
                  <div className="space-y-4">
                    <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Tudo em Ordem!</h3>
                      <p className="text-slate-600 max-w-md mx-auto">
                        Não há prazos próximos do vencimento. Continue o excelente trabalho!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Publicações em Atraso - Se houver */}
        {publications.filter(pub => pub.status === "Atrasado" || (pub.daysUntilDeadline !== null && pub.daysUntilDeadline < 0)).length > 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-red-800">
                <div className="p-3 bg-red-500 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Publicações em Atraso</h3>
                  <p className="text-sm text-red-600">Requer ação imediata</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {publications
                  .filter(pub => pub.status === "Atrasado" || (pub.daysUntilDeadline !== null && pub.daysUntilDeadline < 0))
                  .map((publication) => (
                    <ModernPublicationCard
                      key={publication.id}
                      publication={publication}
                      onEdit={handleEditPublication}
                      onDelete={handleDeletePublication}
                      onView={handleViewPublication}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
