"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import { PetitionEditor } from "./petition-editor" // O novo componente de editor

export function PetitionsModule() {
  const [currentView, setCurrentView] = useState("list") // 'list' ou 'editor'
  const [selectedPetition, setSelectedPetition] = useState<any>(null)

  const {
    data: petitions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["petitions"],
    queryFn: async () => {
      const response = await apiClient.get("/petitions")
      return response.data
    },
  })

  const handleCreateNew = () => {
    setSelectedPetition(null)
    setCurrentView("editor")
  }

  const handleEdit = (petition: any) => {
    setSelectedPetition(petition)
    setCurrentView("editor")
  }

  const handleBackToList = () => {
    setCurrentView("list")
    // Idealmente, invalidar o query para recarregar a lista
  }

  if (currentView === "editor") {
    return (
      <PetitionEditor
        petition={selectedPetition}
        onBack={handleBackToList}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulo de Petições</CardTitle>
        <CardDescription>
          Crie, edite e gerencie as petições do escritório.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={handleCreateNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Nova Petição
          </Button>
        </div>

        {isLoading && <Skeleton className="h-40 w-full" />}
        {error && <p className="text-red-500">Não foi possível carregar as petições.</p>}
        
        <div className="space-y-3">
          {petitions && petitions.map((p: any) => (
            <div key={p.id} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">
                  Associado ao caso: {p.case_id} - Status: {p.status}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>
                <FileText className="mr-2 h-4 w-4" />
                Abrir Petição
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}