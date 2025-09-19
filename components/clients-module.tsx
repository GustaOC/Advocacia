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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Upload, Search, Filter } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { CaseModal } from "./case-modal" // Nosso novo modal

const statusFilters = ["Todos", "Em Andamento", "Em Acordo", "Extinto", "Pagos"]

export function CasesModule() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("Todos")

  const {
    data: cases,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["cases"],
    queryFn: async () => {
      const response = await apiClient.get("/cases")
      return response.data
    },
  })

  const handleEdit = (caseItem: any) => {
    setSelectedCase(caseItem)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedCase(null)
    setIsModalOpen(true)
  }
  
  const filteredCases = cases?.filter((caseItem: any) => {
    const searchMatch = caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        caseItem.case_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "Todos") {
      return searchMatch;
    }
    if (activeFilter === "Pagos") {
      return searchMatch && caseItem.status === 'Extinto' && caseItem.extinction_reason === 'Pagamento';
    }
    return searchMatch && caseItem.status === activeFilter;
  }) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Casos</CardTitle>
          <CardDescription>
            Visualize, filtre e gerencie todos os processos do escritório.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por título ou nº do processo..."
                    className="max-w-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" disabled>
                <Upload className="mr-2 h-4 w-4" />
                Importar Casos
              </Button>
              <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Cadastrar Novo Caso
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4 border-b pb-2">
             <Filter className="h-5 w-5" />
             <span className="font-semibold">Filtrar por Status:</span>
             {statusFilters.map(filter => (
                <Button 
                    key={filter} 
                    variant={activeFilter === filter ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                >
                    {filter}
                </Button>
             ))}
          </div>

          {isLoading && (
             <div className="space-y-2 p-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
          )}
          {error && <p className="text-red-500 text-center">Erro ao carregar os casos.</p>}

          {!isLoading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título do Caso</TableHead>
                  <TableHead>Nº do Processo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhe do Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem: any) => (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleEdit(caseItem)}>
                    <TableCell className="font-medium">{caseItem.title}</TableCell>
                    <TableCell>{caseItem.case_number || "N/A"}</TableCell>
                    <TableCell>
                        <Badge>{caseItem.status}</Badge>
                    </TableCell>
                    <TableCell>
                        {caseItem.status === 'Em Acordo' && caseItem.agreement_type}
                        {caseItem.status === 'Extinto' && caseItem.extinction_reason}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

        </CardContent>
      </Card>
      <CaseModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        caseData={selectedCase} 
      />
    </>
  )
}