// components/dashboard.tsx
"use client"

import { useState, useCallback, ReactNode, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Users, FileText, DollarSign, Calendar, CheckSquare, BarChart2,
  Briefcase, LogOut, Settings, Scale, FileCode, Bell, TrendingUp,
  Activity, AlertCircle, Clock, Star, Menu, ChevronLeft, ChevronRight,
  ArrowUp, ArrowDown, Sparkles, Zap, Shield, Award, Target
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import EntitiesModule from "@/components/entities-module"
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
    { value: "overview", label: "Dashboard", icon: BarChart2, description: "Visão geral do escritório", color: "from-blue-500 to-indigo-600" },
    { value: "entities", label: "Clientes", icon: Users, description: "Gerenciar clientes e partes", color: "from-emerald-500 to-teal-600" },
    { value: "cases", label: "Processos", icon: Briefcase, description: "Acompanhar processos jurídicos", color: "from-purple-500 to-pink-600" },
    { value: "petitions", label: "Petições", icon: FileText, description: "Documentos e petições", color: "from-amber-500 to-orange-600" },
    { value: "templates", label: "Modelos", icon: FileCode, description: "Templates de documentos", color: "from-cyan-500 to-blue-600" },
    { value: "financial", label: "Financeiro", icon: DollarSign, description: "Controle financeiro", color: "from-green-500 to-emerald-600" },
    { value: "calendar", label: "Agenda", icon: Calendar, description: "Compromissos e prazos", color: "from-red-500 to-rose-600" },
    { value: "tasks", label: "Tarefas", icon: CheckSquare, description: "Tarefas e lembretes", color: "from-indigo-500 to-purple-600" },
    { value: "employees", label: "Equipe", icon: Users, description: "Gerenciar colaboradores", color: "from-slate-500 to-slate-700" },
]

// Componente de estatísticas com animações aprimoradas
function QuickStats() {
  // Estado individual para cada valor animado
  const [processosAtivos, setProcessosAtivos] = useState(0);
  const [novosClientes, setNovosClientes] = useState(0);
  const [faturamento, setFaturamento] = useState(0);
  const [tarefasPendentes, setTarefasPendentes] = useState(0);

  const stats = [
    { 
      label: "Processos Ativos", 
      value: 42, 
      animatedValue: processosAtivos,
      setAnimatedValue: setProcessosAtivos,
      prefix: "", 
      suffix: "", 
      icon: Briefcase, 
      trend: 12, 
      color: "from-blue-500 to-indigo-600", 
      bgColor: "from-blue-50 to-indigo-50" 
    },
    { 
      label: "Novos Clientes", 
      value: 8, 
      animatedValue: novosClientes,
      setAnimatedValue: setNovosClientes,
      prefix: "", 
      suffix: "", 
      icon: Users, 
      trend: 25, 
      color: "from-emerald-500 to-teal-600", 
      bgColor: "from-emerald-50 to-teal-50" 
    },
    { 
      label: "Faturamento Mensal", 
      value: 45200, 
      animatedValue: faturamento,
      setAnimatedValue: setFaturamento,
      prefix: "R$ ", 
      suffix: "", 
      icon: DollarSign, 
      trend: 8, 
      color: "from-purple-500 to-pink-600", 
      bgColor: "from-purple-50 to-pink-50" 
    },
    { 
      label: "Tarefas Pendentes", 
      value: 15, 
      animatedValue: tarefasPendentes,
      setAnimatedValue: setTarefasPendentes,
      prefix: "", 
      suffix: "", 
      icon: AlertCircle, 
      trend: -5, 
      color: "from-amber-500 to-orange-600", 
      bgColor: "from-amber-50 to-orange-50" 
    },
  ];

  // Animação de contagem dos números
  useEffect(() => {
    const timers: ReturnType<typeof setInterval>[] = [];
    
    stats.forEach((stat) => {
      const duration = 2000;
      const steps = 50;
      const increment = stat.value / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          current = stat.value;
          clearInterval(timer);
        }
        stat.setAnimatedValue(Math.floor(current));
      }, duration / steps);
      
      timers.push(timer);
    });
    
    // Cleanup function
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatValue = (value: number, prefix: string, suffix: string) => {
    if (prefix === "R$ ") {
      return `${prefix}${(value / 1000).toFixed(1)}k${suffix}`;
    }
    return `${prefix}${value}${suffix}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const currentValue = stat.animatedValue;
        const percentage = (currentValue / stat.value) * 100;
        
        return (
          <Card 
            key={index} 
            className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white relative overflow-hidden cursor-pointer transform hover:-translate-y-1"
          >
            {/* Gradient Background Pattern */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-2xl"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 font-medium flex items-center gap-2">
                    {stat.label}
                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                  </p>
                  <p className="text-3xl font-bold text-slate-900 tabular-nums">
                    {formatValue(currentValue, stat.prefix, stat.suffix)}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                      stat.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {stat.trend > 0 ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {Math.abs(stat.trend)}%
                    </div>
                    <span className="text-xs text-slate-500">vs mês anterior</span>
                  </div>
                </div>
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-1000`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de atividades recentes aprimorado
function RecentActivity() {
  const activities = [
    { action: "Novo processo cadastrado", case: "Ação de Cobrança - Silva vs. Santos", time: "2 horas atrás", type: "case", icon: Briefcase, color: "bg-blue-500" },
    { action: "Petição enviada", case: "Inventário - Família Costa", time: "4 horas atrás", type: "petition", icon: FileText, color: "bg-purple-500" },
    { action: "Cliente adicionado", case: "Maria Fernandes", time: "1 dia atrás", type: "client", icon: Users, color: "bg-emerald-500" },
    { action: "Audiência agendada", case: "Divórcio Consensual", time: "2 dias atrás", type: "calendar", icon: Calendar, color: "bg-amber-500" },
  ];

  return (
    <Card className="bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group">
      {/* Animated gradient border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
      
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-xl font-bold text-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Activity className="w-4 h-4 text-white" />
            </div>
            Atividades Recentes
          </div>
          <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full animate-pulse">
            Ao vivo
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative z-10">
        {activities.map((activity, index) => (
          <div 
            key={index} 
            className="flex items-start gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 transition-all duration-300 group/item cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Animated Timeline Line */}
            <div className="relative">
              <div className={`p-2 rounded-xl ${activity.color} shadow-lg group-hover/item:scale-110 transition-transform duration-300`}>
                <activity.icon className="w-4 h-4 text-white" />
              </div>
              {index < activities.length - 1 && (
                <div className="absolute top-10 left-1/2 w-0.5 h-16 bg-gradient-to-b from-slate-200 to-transparent -translate-x-1/2"></div>
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <p className="font-semibold text-slate-900 text-sm group-hover/item:text-blue-600 transition-colors">
                {activity.action}
              </p>
              <p className="text-sm text-slate-600">{activity.case}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                {activity.time}
                <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
              </div>
            </div>
            
            {/* Hover action */}
            <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover/item:opacity-100 transition-all duration-300 transform group-hover/item:translate-x-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Badge component helper
function Badge({ className, children }: { className: string; children: ReactNode }) {
  return <span className={className}>{children}</span>;
}

function ModernLayout({ children, activeTab, setActiveTab, handleLogout, onUserSettings, onSystemSettings }: ModernLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const activeItem = menuItems.find(item => item.value === activeTab);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            {/* Animated Background Pattern */}
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 20% 80%, blue 0%, transparent 50%),
                                     radial-gradient(circle at 80% 20%, purple 0%, transparent 50%),
                                     radial-gradient(circle at 40% 40%, pink 0%, transparent 50%)`,
                }}></div>
            </div>

            {/* Sidebar Premium com Glassmorphism */}
            <aside className={`fixed left-0 top-0 h-screen backdrop-blur-xl bg-slate-900/95 text-white shadow-2xl z-50 transition-all duration-500 ease-in-out ${
                isCollapsed ? 'w-20' : 'w-72'
            } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-white/10`}>
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-transparent to-slate-900/50 pointer-events-none"></div>
                
                {/* Toggle Button Premium */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex absolute -right-4 top-7 bg-white text-slate-900 hover:bg-slate-50 shadow-xl rounded-full h-8 w-8 border-2 border-slate-200 z-10 transition-all duration-300 hover:scale-110"
                >
                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>

                {/* Logo Header Premium */}
                <div className="relative flex-shrink-0 p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm">
                    <div className="flex items-center justify-center">
                        {!isCollapsed ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl">
                                    <Scale className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-white text-lg">Cássio Miguel</h2>
                                    <p className="text-xs text-slate-400">Advocacia Digital</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl">
                                <Scale className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation Premium */}
                <nav className="relative flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-slate-800/50 scrollbar-thumb-slate-600/50 hover:scrollbar-thumb-slate-500/50">
                    <div className="space-y-2">
                        {menuItems.map((item, index) => (
                            <button
                                key={item.value}
                                onClick={() => {
                                    setActiveTab(item.value);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full group relative overflow-hidden rounded-xl transition-all duration-500 ${
                                    activeTab === item.value
                                        ? "bg-white/10 backdrop-blur-sm shadow-xl"
                                        : "hover:bg-white/5"
                                } ${isCollapsed ? 'p-3' : 'p-4'}`}
                                title={isCollapsed ? item.label : undefined}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Active Gradient Background */}
                                {activeTab === item.value && (
                                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-20 blur-xl`}></div>
                                )}
                                
                                <div className={`relative z-10 flex items-center ${isCollapsed ? 'justify-center' : 'gap-4'}`}>
                                    <div className={`p-2.5 rounded-xl transition-all duration-500 ${
                                        activeTab === item.value 
                                            ? `bg-gradient-to-br ${item.color} shadow-lg` 
                                            : "bg-white/10 group-hover:bg-white/20"
                                    }`}>
                                        <item.icon className="w-5 h-5 text-white" />
                                    </div>
                                    {!isCollapsed && (
                                        <div className="text-left flex-1">
                                            <div className={`font-semibold text-sm transition-colors duration-300 ${
                                                activeTab === item.value ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                            }`}>
                                                {item.label}
                                            </div>
                                            <div className={`text-xs mt-1 transition-colors duration-300 ${
                                                activeTab === item.value 
                                                    ? "text-slate-300" 
                                                    : "text-slate-500 group-hover:text-slate-400"
                                            }`}>
                                                {item.description}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Premium Active Indicator */}
                                {activeTab === item.value && (
                                    <>
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-r-full"></div>
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-l-full"></div>
                                    </>
                                )}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Premium User Profile Section */}
                <div className="relative flex-shrink-0 p-4 border-t border-white/10 bg-slate-800/50 backdrop-blur-sm">
                    {!isCollapsed ? (
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm">
                            <div className="relative">
                                <Avatar className="ring-2 ring-white/20 w-10 h-10">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">CM</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-sm text-white flex items-center gap-2">
                                    Dr. Cássio Miguel
                                    <Shield className="w-3 h-3 text-blue-400" />
                                </div>
                                <div className="text-xs text-slate-400">OAB/MS 12.345</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex space-x-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                                    Premium
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <div className="relative">
                                <Avatar className="ring-2 ring-white/20 w-10 h-10">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">CM</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 animate-pulse"></div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Mobile Menu Button Premium */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300"
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile Overlay with Blur */}
            {isMobileMenuOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Premium */}
            <main className={`min-h-screen flex flex-col transition-all duration-500 ${
                isCollapsed ? 'lg:ml-20' : 'lg:ml-72'
            } ml-0`}>
                {/* Premium Header with Glassmorphism */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
                    <div className={`relative px-8 py-6 transition-all duration-500 ${isCollapsed ? 'lg:pl-8' : 'lg:pl-8'} pl-16 lg:pl-8`}>
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h1 className="font-bold text-3xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                                        {activeItem?.label || 'Dashboard'}
                                    </h1>
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold">
                                        <Zap className="w-3 h-3 inline mr-1" />
                                        Atualizado
                                    </Badge>
                                </div>
                                <p className="text-slate-600 flex items-center gap-2">
                                    {activeItem?.description || 'Sistema de Gestão Jurídica'}
                                    <Award className="w-4 h-4 text-amber-500" />
                                </p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                {/* Premium Notifications */}
                                <div className="relative">
                                    <Button variant="ghost" size="sm" className="relative hover:bg-slate-100 rounded-xl transition-all duration-300">
                                        <Bell className="w-5 h-5" />
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold animate-pulse">
                                            3
                                        </span>
                                    </Button>
                                </div>

                                {/* Premium Quick Actions */}
                                <div className="hidden md:flex items-center gap-2">
                                    <Button variant="ghost" size="sm" className="hover:bg-slate-100 rounded-xl transition-all duration-300">
                                        <Target className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="hover:bg-slate-100 rounded-xl transition-all duration-300">
                                        <Sparkles className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Premium User Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-100/80 backdrop-blur-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                            <div className="relative">
                                                <Avatar className="ring-2 ring-slate-300 w-10 h-10">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">CM</AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div className="text-left hidden md:block">
                                                <div className="font-semibold text-sm text-slate-900">Dr. Cássio Miguel</div>
                                                <div className="text-xs text-slate-600">Online agora</div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-400 hidden md:block" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-72 p-2 backdrop-blur-xl bg-white/95">
                                        <div className="px-3 py-3 border-b border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">CM</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-semibold text-slate-900">Dr. Cássio Miguel</div>
                                                    <div className="text-sm text-slate-600">cassiomiguel@adv.br</div>
                                                    <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold mt-1">
                                                        Conta Premium
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenuItem onSelect={onUserSettings} className="mt-2 rounded-lg">
                                            <Users className="h-4 w-4 mr-3" />
                                            Minha Conta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={onSystemSettings} className="rounded-lg">
                                            <Settings className="h-4 w-4 mr-3" />
                                            Configurações
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg">
                                            <LogOut className="h-4 w-4 mr-3" />
                                            Sair do Sistema
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Premium Content Area */}
                <div className="flex-1 p-8 min-h-screen relative">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-fadeIn">
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
                        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8 backdrop-blur-sm animate-fadeIn">
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
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      
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