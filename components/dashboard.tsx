// components/dashboard.tsx
"use client"

import { useState } from "react" // Importando useState
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientsModule } from "./clients-module"
import { CasesModule } from "./cases-module"
import { DocumentsModule } from "./documents-module"
import { TasksModule } from "./tasks-module"
import { CalendarModule } from "./calendar-module"
import { FinancialModule } from "./financial-module"
import { ReportsModule } from "./reports-module"
import Image from "next/image"
import { SettingsDropdown } from "./settings-dropdown"
import { NotificationsDropdown } from "./notifications-dropdown"
import { PetitionsModule } from "./petitions-module"
import { TemplatesModule } from "./templates-module"
import { PublicationsModule } from "./publications-module"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "./ui/skeleton"

export function Dashboard() {
  const { user, isLoading } = useAuth(); // Renomeado 'loading' para 'isLoading' para consistência
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleNavigate = (tab: string, filters?: any) => {
    // Lógica de filtros pode ser implementada aqui no futuro
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
          <Skeleton className="h-10 w-40" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <Skeleton className="h-full w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-4">
          <Image src="/logo.png" alt="Logo" width={150} height={40} />
        </div>
        <div className="flex items-center space-x-4">
          <NotificationsDropdown />
          <SettingsDropdown />
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {/* O valor do Tabs agora é controlado pelo estado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="cases">Casos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="calendar">Agenda</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="petitions">Petições</TabsTrigger>
            <TabsTrigger value="publications">Publicações</TabsTrigger>
            <TabsTrigger value="templates">Modelos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="h-full">
            {/* Passando a função de navegação para o ReportsModule */}
            <ReportsModule onNavigate={handleNavigate} />
          </TabsContent>
          <TabsContent value="clients" className="h-full">
            <ClientsModule />
          </TabsContent>
          <TabsContent value="cases" className="h-full">
            <CasesModule />
          </TabsContent>
          <TabsContent value="documents" className="h-full">
            <DocumentsModule caseId={0} />
          </TabsContent>
          <TabsContent value="tasks" className="h-full">
            <TasksModule />
          </TabsContent>
          <TabsContent value="calendar" className="h-full">
            <CalendarModule />
          </TabsContent>
          <TabsContent value="financial" className="h-full">
            <FinancialModule />
          </TabsContent>
          <TabsContent value="petitions" className="h-full">
            <PetitionsModule />
          </TabsContent>
          <TabsContent value="publications" className="h-full">
            <PublicationsModule />
          </TabsContent>
          <TabsContent value="templates" className="h-full">
            <TemplatesModule />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}