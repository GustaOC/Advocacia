// components/dashboard.tsx
"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  FileText,
  DollarSign,
  Calendar,
  Bell,
  CheckSquare,
  BarChart2,
  Briefcase,
  LogOut,
  Settings,
  Scale
} from "lucide-react"
// A CORREÇÃO ESTÁ AQUI: Adicionado DropdownMenuSeparator
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"

// Importação dos MÓDULOS ATUALIZADOS
import { EntitiesModule } from "@/components/entities-module"
import { CasesModule } from "@/components/cases-module"
import { FinancialModule } from "@/components/financial-module"
import { PetitionsModule } from "@/components/petitions-module"
import { EmployeeManagement } from "@/components/employee-management"
import { CalendarModule } from "@/components/calendar-module"
import { TasksModule } from "@/components/tasks-module"
import { ReportsModule } from "@/components/reports-module"
import { NotificationsDropdown } from "./notifications-dropdown"
import { SystemSettingsModal } from './system-settings-modal'
import { UserSettingsModal } from './user-settings-modal'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isSystemSettingsOpen, setSystemSettingsOpen] = useState(false)
  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false)

  const handleLogout = useCallback(async () => {
    await apiClient.logout()
  }, [])

  const TABS = [
    { value: "overview", label: "Dashboard", icon: BarChart2, component: <ReportsModule /> },
    { value: "entities", label: "Entidades", icon: Users, component: <EntitiesModule /> },
    { value: "cases", label: "Casos", icon: Briefcase, component: <CasesModule /> },
    { value: "petitions", label: "Petições", icon: FileText, component: <PetitionsModule /> },
    { value: "financial", label: "Financeiro", icon: DollarSign, component: <FinancialModule /> },
    { value: "calendar", label: "Agenda", icon: Calendar, component: <CalendarModule /> },
    { value: "tasks", label: "Tarefas", icon: CheckSquare, component: <TasksModule /> },
    { value: "employees", label: "Equipe", icon: Users, component: <EmployeeManagement /> },
  ]

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg">
                  <Scale className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Cássio Miguel Advocacia
                  </h1>
                  <p className="text-sm text-slate-500">Sistema de Gestão Jurídica</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <NotificationsDropdown />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                      <Settings className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onSelect={() => setUserSettingsOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Minha Conta
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSystemSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações do Sistema
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
            <TabsList className="grid w-full grid-cols-8 bg-white shadow-lg rounded-2xl p-2 h-auto">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl py-3.5 font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>

      {/* Modais de Configuração */}
      <SystemSettingsModal isOpen={isSystemSettingsOpen} onClose={() => setSystemSettingsOpen(false)} />
      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setUserSettingsOpen(false)} />
    </>
  )
}