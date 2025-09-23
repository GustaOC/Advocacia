// components/dashboard.tsx
"use client"

import { useState, useCallback, ReactNode } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Users, FileText, DollarSign, Calendar, CheckSquare, BarChart2,
  Briefcase, LogOut, Settings, Scale, FileCode, Bell, TrendingUp,
  Activity, AlertCircle, Clock, Star, Menu, ChevronLeft, ChevronRight
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Importação dos Módulos
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
import { TemplatesModule } from "./templates-module"

interface GlobalFilters {
  cases?: { status: string };
  petitions?: { status: string };
  financial?: { status: string };
}

interface ModernLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  onUserSettings: () => void;
  onSystemSettings: () => void;
}

const menuItems = [
    { value: "overview", label: "Dashboard", icon: BarChart2, description: "Visão geral do escritório" },
    { value: "entities", label: "Clientes", icon: Users, description: "Gerenciar clientes e partes" },
    { value: "cases", label: "Processos", icon: Briefcase, description: "Acompanhar processos jurídicos" },
    { value: "petitions", label: "Petições", icon: FileText, description: "Documentos e petições" },
    { value: "templates", label: "Modelos", icon: FileCode, description: "Templates de documentos" },
    { value: "financial", label: "Financeiro", icon: DollarSign, description: "Controle financeiro" },
    { value: "calendar", label: "Agenda", icon: Calendar, description: "Compromissos e prazos" },
    { value: "tasks", label: "Tarefas", icon: CheckSquare, description: "Tarefas e lembretes" },
    { value: "employees", label: "Equipe", icon: Users, description: "Gerenciar colaboradores" },
]

// Componente de estatísticas rápidas para o overview
function QuickStats() {
  const stats = [
    { label: "Processos Ativos", value: "42", icon: Briefcase, trend: "+12%", color: "text-blue-600" },
    { label: "Novos Clientes", value: "8", icon: Users, trend: "+25%", color: "text-green-600" },
    { label: "Faturamento Mensal", value: "R$ 45.2k", icon: DollarSign, trend: "+8%", color: "text-purple-600" },
    { label: "Tarefas Pendentes", value: "15", icon: AlertCircle, trend: "-5%", color: "text-orange-600" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-50"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-100 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
          
          <CardContent className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-slate-100 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Componente de atividades recentes
function RecentActivity() {
  const activities = [
    { action: "Novo processo cadastrado", case: "Ação de Cobrança - Silva vs. Santos", time: "2 horas atrás", type: "case" },
    { action: "Petição enviada", case: "Inventário - Família Costa", time: "4 horas atrás", type: "petition" },
    { action: "Cliente adicionado", case: "Maria Fernandes", time: "1 dia atrás", type: "client" },
    { action: "Audiência agendada", case: "Divórcio Consensual", time: "2 dias atrás", type: "calendar" },
  ];

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-blue-600" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div className="flex-1 space-y-1">
              <p className="font-medium text-slate-900">{activity.action}</p>
              <p className="text-sm text-slate-600">{activity.case}</p>
              <p className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ModernLayout({ children, activeTab, setActiveTab, handleLogout, onUserSettings, onSystemSettings }: ModernLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const activeItem = menuItems.find(item => item.value === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
            {/* Sidebar Retrátil */}
            <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl z-50 transition-all duration-300 ${
                isCollapsed ? 'w-20' : 'w-72'
            } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                
                {/* Toggle Button - Desktop */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-3 top-6 bg-white text-slate-900 hover:bg-slate-100 shadow-lg rounded-full h-6 w-6 border-2 border-slate-200 z-10"
                >
                    {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                </Button>

                {/* Logo Header */}
                <div className="flex-shrink-0 p-6 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-700">
                    <div className="flex items-center justify-center">
                        {!isCollapsed ? (
                            <div className="relative w-40 h-12">
                                <Image 
                                    src="/logo.png" 
                                    alt="Cássio Miguel Advocacia" 
                                    fill 
                                    className="object-contain brightness-0 invert"
                                    priority 
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <Scale className="w-5 h-5 text-slate-900" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation - Com scroll customizado */}
                <nav className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
                    <div className="space-y-2">
                        {menuItems.map(item => (
                            <button
                                key={item.value}
                                onClick={() => {
                                    setActiveTab(item.value);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-300 ${
                                    activeTab === item.value
                                        ? "bg-gradient-to-r from-slate-700 to-slate-600 text-white shadow-lg"
                                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                                } ${isCollapsed ? 'p-3' : 'p-4'}`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                                        activeTab === item.value 
                                            ? "bg-white/20 text-white" 
                                            : "bg-slate-600/50 group-hover:bg-slate-600"
                                    }`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    {!isCollapsed && (
                                        <div className="text-left flex-1">
                                            <div className="font-semibold text-sm">{item.label}</div>
                                            <div className={`text-xs mt-1 transition-colors ${
                                                activeTab === item.value 
                                                    ? "text-slate-200" 
                                                    : "text-slate-400 group-hover:text-slate-300"
                                            }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Active indicator */}
                                {activeTab === item.value && (
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-blue-600 rounded-l-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* User Profile Section */}
                {!isCollapsed && (
                    <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-800/50">
                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/30">
                            <Avatar className="ring-2 ring-slate-600 w-8 h-8">
                                <AvatarFallback className="bg-slate-600 text-white font-bold text-xs">CM</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="font-semibold text-sm">Dr. Cássio Miguel</div>
                                <div className="text-xs text-slate-400">OAB/MS 12.345</div>
                            </div>
                            <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* User compact quando collapsed */}
                {isCollapsed && (
                    <div className="flex-shrink-0 p-4 border-t border-slate-700/50 bg-slate-800/50">
                        <div className="flex justify-center">
                            <Avatar className="ring-2 ring-slate-600 w-8 h-8">
                                <AvatarFallback className="bg-slate-600 text-white font-bold text-xs">CM</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                )}
            </aside>

            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-lg"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className={`min-h-screen flex flex-col transition-all duration-300 ${
                isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
            } ml-0`}>
                {/* Header Moderno */}
                <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-slate-200/50 shadow-sm">
                    <div className={`px-8 py-6 transition-all duration-300 ${isCollapsed ? 'lg:pl-8' : 'lg:pl-8'} pl-16 lg:pl-8`}>
                        <div className="flex justify-between items-center">
                            <div className="space-y-1">
                                <h1 className="font-bold text-3xl text-slate-900">{activeItem?.label || 'Dashboard'}</h1>
                                <p className="text-slate-600">{activeItem?.description || 'Sistema de Gestão Jurídica'}</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {/* Notifications */}
                                <div className="relative">
                                    <Button variant="ghost" size="sm" className="relative">
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
                                    </Button>
                                </div>

                                {/* User Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300">
                                            <Avatar className="ring-2 ring-slate-300">
                                                <AvatarFallback className="bg-slate-700 text-white font-bold">CM</AvatarFallback>
                                            </Avatar>
                                            <div className="text-left hidden md:block">
                                                <div className="font-semibold text-sm text-slate-900">Dr. Cássio Miguel</div>
                                                <div className="text-xs text-slate-600">Advogado</div>
                                            </div>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-64 p-2">
                                        <div className="px-3 py-2 border-b border-slate-100">
                                            <div className="font-semibold text-slate-900">Dr. Cássio Miguel</div>
                                            <div className="text-sm text-slate-600">cassiomiguel@adv.br</div>
                                        </div>
                                        <DropdownMenuItem onSelect={onUserSettings} className="mt-2">
                                            <Users className="h-4 w-4 mr-3" />
                                            Minha Conta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={onSystemSettings}>
                                            <Settings className="h-4 w-4 mr-3" />
                                            Configurações
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Sair do Sistema
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <QuickStats />
                            <div className="grid lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <ReportsModule onNavigate={(tab: string, filters: GlobalFilters = {}) => {
                                        setActiveTab(tab);
                                    }} />
                                </div>
                                <div className="space-y-6">
                                    <RecentActivity />
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab !== 'overview' && (
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 p-8">
                            {children}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [globalFilters, setGlobalFilters] = useState<GlobalFilters>({});
  const [isSystemSettingsOpen, setSystemSettingsOpen] = useState(false);
  const [isUserSettingsOpen, setUserSettingsOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    await apiClient.logout();
  }, []);

  const handleNavigate = (tab: string, filters: GlobalFilters = {}) => {
    setActiveTab(tab);
    setGlobalFilters(filters);
  };

  const TABS_CONTENT: { [key: string]: React.ReactNode } = {
    overview: null, // Handled directly in ModernLayout
    entities: <EntitiesModule />,
    cases: <CasesModule initialFilters={globalFilters.cases} />,
    petitions: <PetitionsModule />,
    templates: <TemplatesModule />,
    financial: <FinancialModule />,
    calendar: <CalendarModule />,
    tasks: <TasksModule />,
    employees: <EmployeeManagement />,
  };

  return (
    <>
      <ModernLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        onUserSettings={() => setUserSettingsOpen(true)}
        onSystemSettings={() => setSystemSettingsOpen(true)}
      >
        {TABS_CONTENT[activeTab]}
      </ModernLayout>
      <SystemSettingsModal isOpen={isSystemSettingsOpen} onClose={() => setSystemSettingsOpen(false)} />
      <UserSettingsModal isOpen={isUserSettingsOpen} onClose={() => setUserSettingsOpen(false)} />
    </>
  );
}