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
  Bell,
  CheckSquare,
  BarChart2
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ClientsModule } from "@/components/entities-module";
import { ProcessControl } from "@/components/process-control";
import { FinancialModule } from "@/components/financial-module";
import { PublicationsModule } from "@/components/publications-module";
import { EmployeeManagement } from "@/components/employee-management";
import { CalendarModule } from "@/components/calendar-module";
import { TasksModule } from "@/components/tasks-module";
import { ReportsModule } from "@/components/reports-module";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")

  const handleLogout = useCallback(async () => {
    try {
      console.log("[Dashboard] Iniciando logout...")

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
        console.log("[Dashboard] Cookies e sessionStorage limpos")
      }

      console.log("[Dashboard] Redirecionando para login...")
      window.location.href = "/login"

    } catch (error) {
      console.error("[Dashboard] Erro no logout:", error)
      window.location.href = "/login"
    }
  }, [])

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
          <TabsList className="grid w-full grid-cols-8 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
              { value: "overview", label: "Dashboard", icon: TrendingUp },
              { value: "entities", label: "Clientes", icon: Users },
              { value: "cases", label: "Processos", icon: FileText },
              { value: "financial", label: "Financeiro", icon: DollarSign },
              { value: "publications", label: "Publicações", icon: Bell },
              { value: "calendar", label: "Agenda", icon: Calendar },
              { value: "tasks", label: "Tarefas", icon: CheckSquare },
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
            <ReportsModule />
          </TabsContent>

          <TabsContent value="entities">
            <ClientsModule />
          </TabsContent>

          <TabsContent value="cases">
            <ProcessControl />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialModule />
          </TabsContent>

          <TabsContent value="publications">
            <PublicationsModule />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarModule />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksModule />
          </TabsContent>

          <TabsContent value="employees">
            <EmployeeManagement />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}