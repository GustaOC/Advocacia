// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/enhanced-financial-module.tsx

'use client'

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  FilePlus,
  MoreHorizontal,
  FileSearch,
  AlertCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton' // Agora este import vai funcionar
import { useGetFinancialAgreements } from '@/hooks/use-financials'
import { EnhancedFinancialAgreementModal } from './enhanced-financial-agreement-modal'
import { BadgeProps } from '@/components/ui/badge' // Importando os tipos do Badge

// Componente para o estado de carregamento da tabela
const FinancialTableSkeleton = () => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Status</TableHead>
        <TableHead>Devedor</TableHead>
        <TableHead className="hidden md:table-cell">Nº do Processo</TableHead>
        <TableHead className="text-right">Valor Total</TableHead>
        <TableHead>Ações</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-40" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-5 w-24 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

// Componente para o estado de erro
const ErrorState = ({ refetch }: { refetch: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center py-10">
    <AlertCircle className="w-12 h-12 text-destructive mb-4" />
    <h3 className="text-xl font-semibold mb-2">Falha ao Carregar Acordos</h3>
    <p className="text-muted-foreground mb-4">
      Não foi possível buscar os dados. Verifique sua conexão e tente novamente.
    </p>
    <Button onClick={() => refetch()}>Tentar Novamente</Button>
  </div>
)

export function EnhancedFinancialModule() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(
    null,
  )
  const [page, setPage] = useState(1)

  const {
    data: agreements,
    isLoading,
    isError,
    refetch,
  } = useGetFinancialAgreements(page)

  // Agora esta função retorna um tipo válido para a prop 'variant' do Badge
  const getStatusVariant = (
    status: string,
  ): BadgeProps['variant'] => {
    switch (status) {
      case 'ATIVO':
        return 'default'
      case 'INADIMPLENTE':
        return 'destructive'
      case 'CONCLUIDO':
        return 'success' // Esta variante agora existe e é aceita
      case 'PAUSADO':
      case 'CANCELADO':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleOpenDetails = (id: string) => {
    console.log('Abrir detalhes para o ID:', id)
    setSelectedAgreementId(id)
    // setIsDetailsModalOpen(true);
  }

  const renderContent = () => {
    if (isLoading) {
      return <FinancialTableSkeleton />
    }

    if (isError) {
      return <ErrorState refetch={refetch} />
    }

    if (!agreements || agreements.length === 0) {
      return (
        <div className="text-center py-10">
          <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhum Acordo Encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie um novo acordo para começar a gerenciar suas finanças.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <FilePlus className="mr-2 h-4 w-4" />
            Criar Novo Acordo
          </Button>
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Devedor</TableHead>
            <TableHead className="hidden md:table-cell">Nº do Processo</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agreements.map((agreement: any) => (
            <TableRow key={agreement.id}>
              <TableCell>
                <Badge variant={getStatusVariant(agreement.status)}>
                  {agreement.status}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{agreement.debtor.name}</TableCell>
              <TableCell className="hidden md:table-cell">
                {agreement.case.case_number}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(agreement.total_amount)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleOpenDetails(agreement.id)}>
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>Renegociar</DropdownMenuItem>
                    <DropdownMenuItem>Registrar Pagamento</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestão de Acordos Financeiros</CardTitle>
              <CardDescription>
                Visualize, crie e gerencie todos os acordos.
              </CardDescription>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <FilePlus className="mr-2 h-4 w-4" />
              Novo Acordo
            </Button>
          </div>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>

      <EnhancedFinancialAgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}