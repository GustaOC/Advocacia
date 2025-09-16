// petitions-module.txt
"use client"

import { useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreatePetition } from "./create-petition"
import { PetitionList } from "./petition-list"
import { ReviewPetition } from "./review-petition"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  Users,
  Calendar
} from "lucide-react"

// Componente de estatísticas moderno
function ModernStatsCard({ title, value, change, changeType, icon: Icon, bgColor }: {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ElementType
  bgColor: string
}) {
  const ChangeIcon = ArrowUpRight

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

// Componente de card de petição no dashboard
function PetitionCard({ petition, onClick }: { petition: any; onClick: () => void }) {
  const getStatusColor = () => {
    switch (petition.status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "under_review": return "bg-blue-100 text-blue-800 border-blue-200"
      case "approved": return "bg-green-100 text-green-800 border-green-200"
      case "corrections_needed": return "bg-orange-100 text-orange-800 border-orange-200"
      case "rejected": return "bg-red-100 text-red-800 border-red-200"
      default: return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusLabel = () => {
    switch (petition.status) {
      case "pending": return "Pendente"
      case "under_review": return "Em Revisão"
      case "approved": return "Aprovado"
      case "corrections_needed": return "Correções"
      case "rejected": return "Rejeitado"
      default: return "Desconhecido"
    }
  }

  const getDaysUntilDeadline = () => {
    const today = new Date()
    const deadlineDate = new Date(petition.deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const days = getDaysUntilDeadline()

  return (
    <Card 
      className="border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                {petition.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <Users className="h-4 w-4" />
                <span>{petition.created_by_employee.name}</span>
              </div>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Description */}
          {petition.description && (
            <p className="text-sm text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-lg">
              {petition.description}
            </p>
          )}

          {/* Deadline */}
          <div className={`flex items-center space-x-2 p-3 rounded-lg ${
            days < 0
              ? 'bg-red-50 border border-red-200'
              : days <= 2
                ? 'bg-orange-50 border border-orange-200'
                : days <= 5
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-green-50 border border-green-200'
          }`}>
            <Calendar className={`h-4 w-4 ${
              days < 0
                ? 'text-red-600'
                : days <= 2
                  ? 'text-orange-600'
                  : days <= 5
                    ? 'text-yellow-600'
                    : 'text-green-600'
            }`} />
            <span className={`text-sm font-medium ${
              days < 0
                ? 'text-red-800'
                : days <= 2
                  ? 'text-orange-800'
                  : days <= 5
                    ? 'text-yellow-800'
                    : 'text-green-800'
            }`}>
              {days < 0 ? `${Math.abs(days)} dias em atraso` : `${days} dias restantes`}
            </span>
          </div>

          {/* Meta info */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Criado em {new Date(petition.created_at).toLocaleDateString("pt-BR")}
            </span>
            <span>
              {petition.file_name}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PetitionsModule() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedPetition, setSelectedPetition] = useState<any>(null)
  
  // Mock data - em produção viria de uma API
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
    },
  ]

  // Estatísticas calculadas
  const stats = useMemo(() => {
    const total = mockPetitions.length
    const pending = mockPetitions.filter(p => p.status === "pending").length
    const inReview = mockPetitions.filter(p => p.status === "under_review").length
    const approved = mockPetitions.filter(p => p.status === "approved").length
    const needsCorrection = mockPetitions.filter(p => p.status === "corrections_needed").length

    return [
      {
        title: "Total de Petições",
        value: total.toString(),
        change: "+15%",
        changeType: 'increase' as const,
        icon: FileText,
        bgColor: "from-blue-500 to-blue-600"
      },
      {
        title: "Pendentes",
        value: pending.toString(),
        change: "+8%",
        changeType: 'increase' as const,
        icon: Clock,
        bgColor: "from-yellow-500 to-yellow-600"
      },
      {
        title: "Em Revisão",
        value: inReview.toString(),
        change: "-12%",
        changeType: 'decrease' as const,
        icon: TrendingUp,
        bgColor: "from-blue-500 to-blue-600"
      },
      {
        title: "Necessitam Correção",
        value: needsCorrection.toString(),
        change: needsCorrection > 0 ? `+${needsCorrection}` : "0",
        changeType: needsCorrection > 0 ? 'increase' as const : 'decrease' as const,
        icon: AlertTriangle,
        bgColor: "from-orange-500 to-orange-600"
      },
    ]
  }, [mockPetitions])

  const handleReviewPetition = (petition: any) => {
    setSelectedPetition(petition)
    setActiveTab("review")
  }

  const handleBackToOverview = () => {
    setSelectedPetition(null)
    setActiveTab("overview")
  }

  const handleBackToList = () => {
    setSelectedPetition(null)
    setActiveTab("list")
  }

  const urgentPetitions = mockPetitions.filter(petition => {
    const deadlineTime = new Date(petition.deadline).getTime()
    const currentTime = new Date().getTime()
    const diffTime = deadlineTime - currentTime
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return days <= 3
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="space-y-8">
        {/* Header moderno */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Sistema de Petições</h2>
              <p className="text-slate-300 text-lg">Gerencie criação, revisão e aprovação de petições jurídicas</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Data atual</p>
              <p className="text-white font-semibold">{new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
              { value: "overview", label: "Visão Geral" },
              { value: "list", label: "Lista de Petições" },
              { value: "create", label: "Nova Petição" },
              { value: "review", label: "Revisar Petição", disabled: !selectedPetition },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <ModernStatsCard key={index} {...stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Petições Recentes */}
              <Card className="xl:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>Petições Recentes</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-600 hover:text-slate-900"
                      onClick={() => setActiveTab("list")}
                    >
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockPetitions.slice(0, 3).map((petition) => (
                    <PetitionCard 
                      key={petition.id} 
                      petition={petition} 
                      onClick={() => handleReviewPetition(petition)}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* Alertas Urgentes */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-900 flex items-center space-x-2">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <span>Prazos Urgentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {urgentPetitions.length > 0 ? urgentPetitions.map((petition) => {
                      const deadlineTime = new Date(petition.deadline).getTime()
                      const currentTime = new Date().getTime()
                      const diffTime = deadlineTime - currentTime
                      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      return (
                        <div 
                          key={petition.id} 
                          className="p-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => handleReviewPetition(petition)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-slate-900 text-sm truncate">{petition.title}</h4>
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              {days < 0 ? `${Math.abs(days)}d atrasado` : `${days}d restantes`}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{petition.created_by_employee.name}</p>
                          <p className="text-xs text-slate-500">
                            Prazo: {new Date(petition.deadline).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      )
                    }) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">Tudo em Ordem!</h3>
                        <p className="text-sm text-slate-600">
                          Não há prazos urgentes no momento.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-slate-900 flex items-center space-x-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <span>Ações Rápidas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setActiveTab("create")}
                    className="h-24 bg-white hover:bg-blue-50 text-slate-900 border-2 border-blue-200 hover:border-blue-300 flex flex-col space-y-2"
                    variant="outline"
                  >
                    <Plus className="h-6 w-6 text-blue-600" />
                    <span className="font-medium">Nova Petição</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("list")}
                    className="h-24 bg-white hover:bg-green-50 text-slate-900 border-2 border-green-200 hover:border-green-300 flex flex-col space-y-2"
                    variant="outline"
                  >
                    <FileText className="h-6 w-6 text-green-600" />
                    <span className="font-medium">Ver Todas</span>
                  </Button>
                  
                  <Button 
                    className="h-24 bg-white hover:bg-purple-50 text-slate-900 border-2 border-purple-200 hover:border-purple-300 flex flex-col space-y-2"
                    variant="outline"
                  >
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    <span className="font-medium">Relatórios</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            <PetitionList onReviewPetition={handleReviewPetition} />
          </TabsContent>

          <TabsContent value="create" className="space-y-6">
            <CreatePetition onSuccess={handleBackToOverview} />
          </TabsContent>

          <TabsContent value="review" className="space-y-6">
            {selectedPetition && (
              <ReviewPetition 
                petition={selectedPetition} 
                onBack={handleBackToList} 
                onSuccess={handleBackToOverview} 
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
