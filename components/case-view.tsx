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
import { ArrowLeft, AlertTriangle, FileCheck2 } from "lucide-react"
import { Skeleton } from "./ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { Badge } from "./ui/badge"

interface CaseViewProps {
  caseId: string
  onBack: () => void
}

// Lista de documentos padrão necessários para um processo
const REQUIRED_DOCUMENTS = [
  "Procuração",
  "Documento de Identidade (RG/CNH)",
  "CPF",
  "Comprovante de Residência",
  "Contrato Social (se aplicável)",
]

export function CaseView({ caseId, onBack }: CaseViewProps) {
  const {
    data: caseData,
    isLoading: isLoadingCase,
  } = useQuery({
    queryKey: ["case", caseId],
    queryFn: async () => {
      // Este endpoint /cases/[id] já deve existir
      const response = await apiClient.get(`/cases/${caseId}`)
      return response.data
    },
  })
  
  // Por enquanto, vamos simular os documentos que já foram enviados
  const uploadedDocuments = ["Procuração", "CPF"];
  
  const missingDocuments = REQUIRED_DOCUMENTS.filter(
    doc => !uploadedDocuments.includes(doc)
  );

  const isReadyToPetition = missingDocuments.length === 0;

  const getUrgencyVariant = (urgency: 'Baixa' | 'Media' | 'Alta' | null) => {
    switch (urgency) {
      case 'Alta':
        return 'destructive'
      case 'Media':
        return 'warning'
      case 'Baixa':
      default:
        return 'success'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dossiê do Cliente
            </Button>
            {isLoadingCase ? (
              <>
                <Skeleton className="h-8 w-80 mb-2" />
                <Skeleton className="h-4 w-64" />
              </>
            ) : caseData ? (
              <>
                <CardTitle className="text-2xl">{caseData.title}</CardTitle>
                <CardDescription>
                  Nº do processo: {caseData.case_number || "Ainda não distribuído"}
                </CardDescription>
              </>
            ) : (
              <CardTitle className="text-2xl text-red-500">
                Processo não encontrado
              </CardTitle>
            )}
          </div>
           {caseData && (
             <Badge variant={getUrgencyVariant(caseData.urgency)} className="text-base">
                {caseData.urgency}
            </Badge>
           )}
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="font-semibold mb-4">Checklist de Documentos</h3>
           <div className="space-y-2">
            {REQUIRED_DOCUMENTS.map(doc => {
              const isUploaded = uploadedDocuments.includes(doc);
              return (
                <div key={doc} className={`flex items-center p-2 rounded-md ${isUploaded ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900'}`}>
                  {isUploaded ? 
                    <FileCheck2 className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" /> : 
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-400" />
                  }
                  <span className={`text-sm ${isUploaded ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
                    {doc}
                  </span>
                </div>
              )
            })}
          </div>
          <Button className="w-full mt-4" disabled>Fazer Upload</Button>
        </div>
        <div className="md:col-span-2">
            {isReadyToPetition && (
                <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-900/50">
                    <FileCheck2 className="h-5 w-5 text-green-600" />
                    <AlertTitle className="text-green-800 dark:text-green-300">Ação Pronta!</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Todos os documentos necessários foram anexados. Este processo está pronto para ser peticionado.
                    </AlertDescription>
                </Alert>
            )}
            <h3 className="font-semibold mb-4">Detalhes e Andamento</h3>
            {/* Aqui entrarão mais detalhes sobre o processo no futuro */}
            <p className="text-sm text-muted-foreground">
                {caseData?.description || "Nenhuma descrição fornecida."}
            </p>
        </div>
      </CardContent>
    </Card>
  )
}