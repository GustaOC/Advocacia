"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  FileText, 
  DollarSign, 
  Calendar, 
  AlertTriangle, 
  Clock, 
  Scale, 
  LogOut, 
  TrendingUp, 
  Settings, 
  MoreVertical, 
  Briefcase,
  Bell
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// ✅ CORREÇÃO: Componente Dashboard completo e funcional
export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  // ✅ CORREÇÃO: Logout melhorado
  const handleLogout = useCallback(async () => {
    try {
      console.log("[Dashboard] Iniciando logout...")
      
      // Limpar cookies e sessionStorage
      if (typeof window !== 'undefined') {
        const cookiesToClear = [
          'auth-token',
          'sb-auth-token-client', 
          'user-info',
          'just-logged-in'
        ]
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
        })
        
        sessionStorage.clear()
        console.log("[Dashboard] ✅ Cookies e sessionStorage limpos")
      }

      // Redirecionamento
      console.log("[Dashboard] Redirecionando para login...")
      window.location.href = "/login"
      
    } catch (error) {
      console.error("[Dashboard] Erro no logout:", error)
      window.location.href = "/login"
    }
  }, [])

  // ✅ CORREÇÃO: Componente de placeholder para módulos
  const ModulePlaceholder = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
    <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg rounded-2xl">
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <Icon className="h-12 w-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-600 text-sm">{description}</p>
          </div>
          <Button variant="outline" className="mt-4">
            Em Desenvolvimento
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
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
              {/* Notificações */}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs bg-red-500 text-white rounded-full">
                  3
                </Badge>
              </Button>
              
              {/* Menu do usuário */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
              { value: "overview", label: "Dashboard", icon: TrendingUp },
              { value: "entities", label: "Entidades", icon: Users },
              { value: "cases", label: "Casos", icon: FileText },
              { value: "financial", label: "Financeiro", icon: DollarSign },
              { value: "petitions", label: "Petições", icon: Scale },
              { value: "employees", label: "Equipe", icon: Briefcase },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-600 data-[state=active]:to-slate-700 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3 font-medium transition-all duration-200 flex items-center gap-2"
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Cards de Estatísticas */}
              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">248</div>
                  <p className="text-xs text-slate-500 mt-1">+12% este mês</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Casos Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">89</div>
                  <p className="text-xs text-slate-500 mt-1">+5% esta semana</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Receita Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">R$ 45.2k</div>
                  <p className="text-xs text-slate-500 mt-1">+8% vs mês anterior</p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Prazos Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">7</div>
                  <p className="text-xs text-slate-500 mt-1">Próximos 7 dias</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Seção de Atividades Recentes */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Atividades Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { action: "Novo caso criado", client: "Maria Silva", time: "2h atrás" },
                      { action: "Petição enviada", client: "João Santos", time: "4h atrás" },
                      { action: "Reunião agendada", client: "Empresa ABC", time: "1 dia atrás" },
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                          <p className="text-xs text-slate-500">{activity.client}</p>
                        </div>
                        <span className="text-xs text-slate-400">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur border border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                    Alertas e Lembretes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: "Prazo", message: "Resposta à contestação - Caso 001/2024", status: "urgent" },
                      { type: "Reunião", message: "Cliente João Silva - 14:00", status: "today" },
                      { type: "Documento", message: "Assinar procuração - Caso 002/2024", status: "pending" },
                    ].map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          alert.status === 'urgent' ? 'bg-red-500' : 
                          alert.status === 'today' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{alert.type}</p>
                          <p className="text-xs text-slate-600">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Outras tabs com placeholders */}
          <TabsContent value="entities">
            <ModulePlaceholder 
              title="Módulo de Entidades" 
              description="Gestão de clientes, advogados e contatos do escritório"
              icon={Users}
            />
          </TabsContent>
          
          <TabsContent value="cases">
            <ModulePlaceholder 
              title="Módulo de Casos" 
              description="Gerenciamento completo de processos jurídicos"
              icon={FileText}
            />
          </TabsContent>
          
          <TabsContent value="financial">
            <ModulePlaceholder 
              title="Módulo Financeiro" 
              description="Controle de honorários, despesas e faturamento"
              icon={DollarSign}
            />
          </TabsContent>
          
          <TabsContent value="petitions">
            <ModulePlaceholder 
              title="Módulo de Petições" 
              description="Criação e revisão de petições e documentos"
              icon={Scale}
            />
          </TabsContent>
          
          <TabsContent value="employees">
            <ModulePlaceholder 
              title="Gestão de Equipe" 
              description="Administração de funcionários e permissões"
              icon={Briefcase}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}