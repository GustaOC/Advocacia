'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
// ✅ CORREÇÃO: A importação do componente Label estava faltando.
import { Label } from './ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useGetFinancialAgreementDetails } from '@/hooks/use-financials'
import { Skeleton } from './ui/skeleton'

interface Props {
  agreementId: string | null
  isOpen: boolean
  onClose: () => void
}

export function FinancialAgreementDetailsModal({
  agreementId,
  isOpen,
  onClose,
}: Props) {
  const {
    data: agreement,
    isLoading,
    isError,
  } = useGetFinancialAgreementDetails(agreementId)

  const renderSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-20 w-full" />
    </div>
  )

  const renderContent = () => {
    if (isLoading) return renderSkeleton()
    if (isError || !agreement) {
      return (
        <div className="text-center text-destructive">
          <DialogTitle>Erro ao Carregar</DialogTitle>
          <DialogDescription>
            Não foi possível carregar os detalhes do acordo. Tente novamente mais
            tarde.
          </DialogDescription>
        </div>
      )
    }

    const totalPaid =
      agreement.installments?.reduce(
        (acc, inst) =>
          acc +
          (inst.payments?.reduce(
            (pAcc, p) => pAcc + (p.amount_paid || 0),
            0,
          ) || 0),
        0,
      ) || 0
    // ✅ CORREÇÃO: Lógica mais segura para evitar divisão por zero.
    const completionPercentage =
      agreement.total_amount > 0
        ? (totalPaid / agreement.total_amount) * 100
        : 0

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Acordo</span>
            <Badge variant={
              agreement.status === 'ATIVO' ? 'success' :
              agreement.status === 'INADIMPLENTE' ? 'destructive' : 'secondary'
            }>
              {agreement.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Visualização completa do acordo com o cliente{' '}
            <strong>{agreement.debtor?.name}</strong> referente ao caso{' '}
            <strong>{agreement.cases?.case_number}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="progress">Progresso do Pagamento</Label>
            <div className="flex items-center gap-2">
              <Progress
                id="progress"
                // ✅ CORREÇÃO: Garante que o valor é sempre um número.
                value={completionPercentage || 0}
                className="w-full"
              />
              <span className="text-sm font-medium">
                {completionPercentage.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalPaid)} de {formatCurrency(agreement.total_amount)}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold">Credor</p>
              <p>{agreement.creditor?.name}</p>
            </div>
            <div>
              <p className="font-semibold">Valor Total</p>
              <p>{formatCurrency(agreement.total_amount)}</p>
            </div>
            <div>
              <p className="font-semibold">Data de Início</p>
              <p>{formatDate(agreement.start_date)}</p>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">Parcelas</h3>
            <ScrollArea className="h-64 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreement.installments?.map((installment) => (
                    <TableRow key={installment.id}>
                      <TableCell>{installment.installment_number}</TableCell>
                      <TableCell>{formatDate(installment.due_date)}</TableCell>
                      {/* ✅ CORREÇÃO: Fallback para o caso de o valor ser nulo. */}
                      <TableCell>
                        {formatCurrency(installment.amount || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            installment.status === 'PAGA'
                              ? 'success'
                              : installment.status === 'ATRASADA'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {installment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">{renderContent()}</DialogContent>
    </Dialog>
  )
}