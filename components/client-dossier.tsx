"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Button } from "./ui/button"
import { ArrowLeft, PlusCircle } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Badge } from "./ui/badge"
import { cn } from "@/lib/utils"

interface ClientDossierProps {
  clientId: string
  onBack: () => void
  onSelectCase: (caseId: string) => void // Função para navegar para a CaseView
}

export function ClientDossier({ clientId, onBack, onSelectCase }: ClientDossierProps) {
  const {
    data: client,
    isLoading: isLoadingClient,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const response = await apiClient.get(`/clients/${clientId}`)
      return response.data
    },
  })

  const { data: cases, isLoading: isLoadingCases } = useQuery({
    queryKey: ["cases", "client", clientId],
    queryFn: async () => {
      // Este endpoint precisará ser criado para buscar casos por cliente
      const response = await apiClient.get(`/cases?clientId=${clientId}`)
      return response.data
    },
  })

  const getUrgencyVariant = (urgency: 'Baixa' | 'Media' | 'Alta' | null) => {
    switch (urgency) {
      case 'Alta':
        return 'destructive'
      case 'Media':
        return 'warning' // Precisaremos definir esta variante de cor
      case 'Baixa':
      default:
        return 'success' // E esta também
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para a lista de clientes
            </Button>
            {isLoadingClient ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-80" />
              </>
            ) : client ? (
              <>
                <CardTitle className="text-2xl">Dossiê de {client.name}</CardTitle>
                <CardDescription>
                  Visualize todos os processos e documentos do cliente.
                </CardDescription>
              </>
            ) : (
                <CardTitle className="text-2xl text-red-500">
                    Cliente não encontrado
                </CardTitle>
            )}
          </div>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Novo Processo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="md:col-span-2">
          <h3 className="font-semibold mb-4">Processos Vinculados</h3>
          <div className="border rounded-lg">
            {isLoadingCases ? (
                 <div className="space-y-2 p-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Nº do Processo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Urgência</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cases && cases.map((c: any) => (
                            <TableRow 
                                key={c.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => onSelectCase(c.id)}
                            >
                                <TableCell className="font-medium">{c.title}</TableCell>
                                <TableCell>{c.case_number || 'N/A'}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{c.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getUrgencyVariant(c.urgency)} className="capitalize">
                                        {c.urgency || 'Não definida'}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}