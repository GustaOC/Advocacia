"use client"

import { useState, useCallback, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Users, FileText, DollarSign, Calendar, CheckSquare, BarChart2,
  Briefcase, LogOut, Settings, Scale, FileCode, Bell
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // <-- CORREÇÃO AQUI

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
    { value: "overview", label: "Dashboard", icon: BarChart2 },
    { value: "entities", label: "Clientes", icon: Users },
    { value: "cases", label: "Casos", icon: Briefcase },
    { value: "petitions", label: "Petições", icon: FileText },
    { value: "templates", label: "Modelos", icon: FileCode },
    { value: "financial", label: "Financeiro", icon: DollarSign },
    { value: "calendar", label: "Agenda", icon: Calendar },
    { value: "tasks", label: "Tarefas", icon: CheckSquare },
    { value: "employees", label: "Equipe", icon: Users },
]

function ModernLayout({ children, activeTab, setActiveTab, handleLogout, onUserSettings, onSystemSettings }: ModernLayoutProps) {
    const activeItem = menuItems.find(item => item.value === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gold-50/10">
            <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-100 shadow-xl">
                <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
                           <Scale className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-display font-bold text-xl text-slate-900">Sistema</span>
                    </div>
                </div>
                <nav className="p-4 space-y-1">
                    {menuItems.map(item => (
                        <button
                            key={item.value}
                            onClick={() => setActiveTab(item.value)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all active:scale-[0.98] group
                                ${activeTab === item.value
                                    ? "bg-gold-50 text-gold-600 font-semibold shadow-inner"
                                    : "hover:bg-gold-50/50 hover:text-gold-600"
                                }`}
                        >
                            <item.icon className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="ml-64 min-h-screen">
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
                    <div className="px-8 py-4 flex justify-between items-center">
                        <h1 className="font-display text-title text-slate-900">{activeItem?.label || 'Dashboard'}</h1>
                        <div className="flex items-center gap-4">
                            <NotificationsDropdown />
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-10 h-10 rounded-full ring-2 ring-gold-400/20 ring-offset-2 focus:outline-none focus:ring-gold-400">
                                         <Avatar>
                                            <AvatarFallback>CM</AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuItem onSelect={onUserSettings}>
                                        <Users className="h-4 w-4 mr-2" />
                                        Minha Conta
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={onSystemSettings}>
                                        <Settings className="h-4 w-4 mr-2" />
                                        Configurações
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-danger focus:bg-red-50 focus:text-danger">
                                        <LogOut className="h-4 w-4 mr-2" />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>
                <div className="p-8">{children}</div>
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
    overview: <ReportsModule onNavigate={handleNavigate} />,
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