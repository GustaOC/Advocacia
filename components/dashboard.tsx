"use client"

import { useState, useCallback, useMemo, Suspense } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, DollarSign, Calendar, AlertTriangle, Clock, Scale, LogOut, TrendingUp, Settings, MoreVertical, ArrowUpRight, ArrowDownRight, Briefcase } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// --- Componentes Auxiliares ---

function ModuleLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando módulo...</p>
      </div>
    </div>
  )
}

// --- Lazy Loading dos Módulos Refatorados ---

const EntitiesModule = dynamic(() => import("./entities-module").then(mod => ({ default: mod.EntitiesModule })), {
  loading: () => <ModuleLoader />
})
const CasesModule = dynamic(() => import("./cases-module").then(mod => ({ default: mod.CasesModule })), {
  loading: () => <ModuleLoader />
})
const FinancialModule = dynamic(() => import("./financial-module").then(mod => ({ default: mod.FinancialModule })), {
  loading: () => <ModuleLoader />
})
const PetitionsModule = dynamic(() => import("./petitions-module").then(mod => ({ default: mod.PetitionsModule })), {
  loading: () => <ModuleLoader />
})
const EmployeeManagement = dynamic(() => import("./employee-management").then(mod => ({ default: mod.EmployeeManagement })), {
  loading: () => <ModuleLoader />
})

// Componentes do Dashboard (mantidos como estavam)
import { SettingsDropdown } from "./settings-dropdown"
import { NotificationsDropdown } from "./notifications-dropdown"
import { UserSettingsModal } from "./user-settings-modal"
import { SystemSettingsModal } from "./system-settings-modal"

// ... (Restante do código do Dashboard.tsx sem alterações)

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)

  const handleLogout = useCallback(() => {
    // Idealmente, chamar apiClient.logout()
    document.cookie = "auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    window.location.href = "/login"
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
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

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-lg rounded-2xl p-2 h-auto">
            {[
              { value: "overview", label: "Dashboard" },
              { value: "entities", label: "Entidades" },
              { value: "cases", label: "Casos" },
              { value: "financial", label: "Financeiro" },
              { value: "petitions", label: "Petições" },
              { value: "employees", label: "Equipe" },
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

          <TabsContent value="overview" className="space-y-8">
            {/* O conteúdo do Overview pode ser adicionado aqui */}
            <p>Bem-vindo ao Dashboard! Selecione uma aba para começar.</p>
          </TabsContent>
          
          <TabsContent value="entities"><Suspense fallback={<ModuleLoader />}><EntitiesModule /></Suspense></TabsContent>
          <TabsContent value="cases"><Suspense fallback={<ModuleLoader />}><CasesModule /></Suspense></TabsContent>
          <TabsContent value="financial"><Suspense fallback={<ModuleLoader />}><FinancialModule /></Suspense></TabsContent>
          <TabsContent value="petitions"><Suspense fallback={<ModuleLoader />}><PetitionsModule /></Suspense></TabsContent>
          <TabsContent value="employees"><Suspense fallback={<ModuleLoader />}><EmployeeManagement /></Suspense></TabsContent>
        </Tabs>

        <UserSettingsModal isOpen={showUserSettings} onClose={() => setShowUserSettings(false)} />
        <SystemSettingsModal isOpen={showSystemSettings} onClose={() => setShowSystemSettings(false)} />
      </main>
    </div>
  )
}