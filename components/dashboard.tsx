"use client"

import { useState, useCallback, useMemo, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, DollarSign, Calendar, AlertTriangle, Clock, Scale, LogOut, TrendingUp, Settings, MoreVertical, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Lazy loading dos módulos pesados
import dynamic from 'next/dynamic'

const CasesModule = dynamic(() => import("./cases-module").then(mod => ({ default: mod.CasesModule })), {
  loading: () => <ModuleLoader />
})
const ClientsModule = dynamic(() => import("./clients-module").then(mod => ({ default: mod.ClientsModule })), {
  loading: () => <ModuleLoader />
})
const FinancialModule = dynamic(() => import("./financial-module").then(mod => ({ default: mod.FinancialModule })), {
  loading: () => <ModuleLoader />
})
const ProcessControl = dynamic(() => import("./process-control").then(mod => ({ default: mod.ProcessControl })), {
  loading: () => <ModuleLoader />
})
const PublicationsModule = dynamic(() => import("./publications-module").then(mod => ({ default: mod.PublicationsModule })), {
  loading: () => <ModuleLoader />
})
const MonthlyPublications = dynamic(() => import("./monthly-publications").then(mod => ({ default: mod.MonthlyPublications })), {
  loading: () => <ModuleLoader />
})
const EmployeeManagement = dynamic(() => import("./employee-management").then(mod => ({ default: mod.EmployeeManagement })), {
  loading: () => <ModuleLoader />
})
const PetitionsModule = dynamic(() => import("./petitions-module").then(mod => ({ default: mod.PetitionsModule })), {
  loading: () => <ModuleLoader />
})

// Componentes sempre carregados
import { SettingsDropdown } from "./settings-dropdown"
import { NotificationsDropdown } from "./notifications-dropdown"
import { NotificationScheduler } from "./notification-scheduler"
import { UserSettingsModal } from "./user-settings-modal"
import { SystemSettingsModal } from "./system-settings-modal"

// Loading component moderno
function ModuleLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando módulo...</p>
      </div>
    </div>
  )
}

// Tipos para melhor organização
interface Stat {
  title: string
  value: string
  change: string
  changeType: 'increase' | 'decrease'
  icon: React.ElementType
  color: string
  bgColor: string
}

interface Activity {
  id: string
  type: 'case' | 'client' | 'payment' | 'deadline'
  message: string
  time: string
  timestamp: number
  priority: 'low' | 'medium' | 'high'
}

interface Deadline {
  id: string
  case: string
  client: string
  deadline: string
  days: number
  priority: 'Alta' | 'Média' | 'Baixa'
  urgencyScore: number
}

// Componente de estatísticas moderno
function ModernStatsCard({ stat }: { stat: Stat }) {
  const ChangeIcon = stat.changeType === 'increase' ? ArrowUpRight : ArrowDownRight
  
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
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
          </div>
          <div className={`p-4 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <stat.icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente de atividade moderno
function ModernActivityItem({ activity }: { activity: Activity }) {
  const getIcon = () => {
    switch (activity.type) {
      case "case": return <FileText className="h-4 w-4" />
      case "client": return <Users className="h-4 w-4" />
      case "payment": return <DollarSign className="h-4 w-4" />
      case "deadline": return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getColor = () => {
    switch (activity.type) {
      case "case": return "text-blue-600 bg-blue-100"
      case "client": return "text-emerald-600 bg-emerald-100"
      case "payment": return "text-purple-600 bg-purple-100"
      case "deadline": return "text-orange-600 bg-orange-100"
      default: return "text-slate-600 bg-slate-100"
    }
  }

  const priorityColor = activity.priority === 'high' 
    ? 'border-l-red-500' 
    : activity.priority === 'medium' 
      ? 'border-l-yellow-500' 
      : 'border-l-slate-300'

  return (
    <div className={`flex items-start space-x-3 p-4 rounded-xl bg-slate-50 hover:bg-white border-l-4 ${priorityColor} transition-all duration-200 hover:shadow-md`}>
      <div className={`p-2 rounded-lg ${getColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{activity.message}</p>
        <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
      </div>
    </div>
  )
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)

  // Dados mockados com melhor estrutura
  const stats: Stat[] = useMemo(() => [
    {
      title: "Total de Clientes",
      value: "1,234",
      change: "+12%",
      changeType: 'increase',
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-500 to-blue-600"
    },
    {
      title: "Casos Ativos",
      value: "89",
      change: "+5%",
      changeType: 'increase',
      icon: FileText,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-500 to-emerald-600"
    },
    {
      title: "Receita Mensal",
      value: "R$ 245K",
      change: "+18%",
      changeType: 'increase',
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-500 to-purple-600"
    },
    {
      title: "Prazos Próximos",
      value: "12",
      change: "-3%",
      changeType: 'decrease',
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-500 to-orange-600"
    },
  ], [])

  const recentActivities: Activity[] = useMemo(() => [
    { 
      id: "1", 
      type: "case", 
      message: "Novo caso cadastrado: Ação de Cobrança vs. João Silva", 
      time: "há 2 min",
      timestamp: Date.now() - 120000,
      priority: 'high'
    },
    { 
      id: "2", 
      type: "client", 
      message: "Cliente Maria Santos atualizou dados de contato", 
      time: "há 15 min",
      timestamp: Date.now() - 900000,
      priority: 'low'
    },
    { 
      id: "3", 
      type: "payment", 
      message: "Pagamento de R$ 2.500 recebido - Acordo #1234", 
      time: "há 1h",
      timestamp: Date.now() - 3600000,
      priority: 'medium'
    },
    { 
      id: "4", 
      type: "deadline", 
      message: "Prazo para contestação em 3 dias - Processo 123456", 
      time: "há 2h",
      timestamp: Date.now() - 7200000,
      priority: 'high'
    },
  ], [])

  const upcomingDeadlines: Deadline[] = useMemo(() => [
    { 
      id: "1",
      case: "Ação de Cobrança", 
      client: "João Silva", 
      deadline: "2024-01-30", 
      days: 3, 
      priority: "Alta",
      urgencyScore: 9
    },
    { 
      id: "2",
      case: "Divórcio Consensual", 
      client: "Maria Santos", 
      deadline: "2024-02-05", 
      days: 9, 
      priority: "Média",
      urgencyScore: 6
    },
    { 
      id: "3",
      case: "Rescisão Trabalhista", 
      client: "Pedro Oliveira", 
      deadline: "2024-02-10", 
      days: 14, 
      priority: "Baixa",
      urgencyScore: 3
    },
  ], [])

  const handleLogout = useCallback(() => {
    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/login"
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <NotificationScheduler />

      {/* Header moderno */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Cássio Miguel Advocacia
                </h1>
                <p className="text-sm text-slate-500">Sistema de Gestão Jurídica</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <NotificationsDropdown />
              <SettingsDropdown
                onUserSettings={() => setShowUserSettings(true)}
                onSystemSettings={() => setShowSystemSettings(true)}
                onEmployeeManagement={() => setActiveTab("employees")}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowUserSettings(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-9 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
              { value: "overview", label: "Dashboard" },
              { value: "cases", label: "Casos" },
              { value: "clients", label: "Clientes" },
              { value: "financial", label: "Financeiro" },
              { value: "processes", label: "Processos" },
              { value: "publications", label: "Publicações" },
              { value: "petitions", label: "Petições" },
              { value: "employees", label: "Equipe" },
              { value: "reports", label: "Relatórios" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-medium transition-all duration-200"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h2>
                  <p className="text-slate-300 text-lg">Aqui está um resumo do seu escritório hoje</p>
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <ModernStatsCard key={index} stat={stat} />
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Recent Activities */}
              <Card className="xl:col-span-2 border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 flex items-center space-x-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <span>Atividades Recentes</span>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      Ver todas
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivities.map((activity) => (
                    <ModernActivityItem key={activity.id} activity={activity} />
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-slate-900 flex items-center space-x-2">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <span>Prazos Urgentes</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline) => (
                      <div key={deadline.id} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900 text-sm">{deadline.case}</h4>
                          <Badge
                            className={
                              deadline.priority === "Alta"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : deadline.priority === "Média"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }
                          >
                            {deadline.days} dias
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{deadline.client}</p>
                        <p className="text-xs text-slate-500">
                          Vencimento: {new Date(deadline.deadline).toLocaleDateString("pt-BR")}
                        </p>
                        <div className="mt-3 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              deadline.urgencyScore >= 8
                                ? 'bg-red-500'
                                : deadline.urgencyScore >= 5
                                  ? 'bg-yellow-500'
                                  : 'bg-emerald-500'
                            }`}
                            style={{ width: `${deadline.urgencyScore * 10}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lazy loaded tabs */}
          <TabsContent value="cases" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <CasesModule />
            </Suspense>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <ClientsModule />
            </Suspense>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <FinancialModule />
            </Suspense>
          </TabsContent>

          <TabsContent value="processes" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <ProcessControl />
            </Suspense>
          </TabsContent>

          <TabsContent value="publications" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <PublicationsModule />
            </Suspense>
          </TabsContent>

          <TabsContent value="petitions" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <PetitionsModule />
            </Suspense>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <EmployeeManagement />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Suspense fallback={<ModuleLoader />}>
              <MonthlyPublications />
            </Suspense>
          </TabsContent>
        </Tabs>

        <UserSettingsModal isOpen={showUserSettings} onClose={() => setShowUserSettings(false)} />
        <SystemSettingsModal isOpen={showSystemSettings} onClose={() => setShowSystemSettings(false)} />
      </main>
    </div>
  )
}
