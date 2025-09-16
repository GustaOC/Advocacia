// components/financial-renegotiation-modal.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { AlertCircle, TrendingUp, Calculator, History } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

/**
 * Tipos (ajuste conforme seu retorno real de API se necessário)
 */
interface Agreement {
  id: number
  client_id: number
  total_value: number
  current_total_value?: number
  entry_value: number
  installments: number
  installment_value: number
  current_installment_value?: number
  first_due_date: string
  agreement_type: string
  status: string
  paid_installments: number
  apply_ipca: boolean
  ipca_base_date: string
  renegotiation_count: number
  created_at: string
  clients?: {
    id: number
    name: string
    email: string
  }
  ipca_correction?: {
    originalValue: number
    correctedValue: number
    ipcaRate: number
    correctionAmount: number
    days: number
  }
}

interface RenegotiationModalProps {
  agreement: Agreement | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedAgreement: Agreement) => void
}

interface RenegotiationData {
  newTotalValue: number
  newInstallments: number
  newFirstDueDate: string
  newEntryValue: number
  reason: string
  resetIPCABase: boolean
  maintainPaidInstallments: boolean
}

export function FinancialRenegotiationModal({ agreement, isOpen, onClose, onSuccess }: RenegotiationModalProps) {
  // Cria valores iniciais baseados no acordo (usa current_* quando disponível)
  const defaultForm = useCallback((a?: Agreement): RenegotiationData => {
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    if (!a) {
      return {
        newTotalValue: 0,
        newInstallments: 1,
        newFirstDueDate: nextMonth.toISOString().split('T')[0],
        newEntryValue: 0,
        reason: '',
        resetIPCABase: true,
        maintainPaidInstallments: true
      }
    }

    return {
      newTotalValue: a.current_total_value ?? a.ipca_correction?.correctedValue ?? a.total_value ?? 0,
      newInstallments: Math.max(1, a.installments - (a.paid_installments || 0)),
      newFirstDueDate: a.first_due_date ? a.first_due_date.split('T')[0] : nextMonth.toISOString().split('T')[0],
      newEntryValue: 0,
      reason: 'Renegociação solicitada pelo cliente',
      resetIPCABase: true,
      maintainPaidInstallments: true
    }
  }, [])

  const [formData, setFormData] = useState<RenegotiationData>(defaultForm(agreement ?? undefined))

  // Cálculos podem vir do backend (após PUT) ou ser calculados localmente como fallback
  const [calculations, setCalculations] = useState({
    installmentValue: agreement?.current_installment_value ?? agreement?.installment_value ?? 0,
    remainingValue: agreement?.current_total_value ?? agreement?.total_value ?? 0,
    entryPercentage: 0,
    valueDifference: 0,
    installmentsDifference: 0
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showIPCADetails, setShowIPCADetails] = useState(false)

  // Quando abrir ou agreement mudar, inicializa formulário e cálculo inicial
  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(agreement ?? undefined))
      setError('')
      // inicializa resumo usando valores corrigidos do servidor quando disponíveis
      const serverTotal = agreement?.current_total_value ?? agreement?.ipca_correction?.correctedValue ?? agreement?.total_value ?? 0
      const serverInstallment = agreement?.current_installment_value ?? agreement?.installment_value ?? 0
      const entry = 0
      const installments = Math.max(1, agreement?.installments || 1)
      setCalculations({
        installmentValue: Math.round((serverInstallment) * 100) / 100,
        remainingValue: Math.round((serverTotal - entry) * 100) / 100,
        entryPercentage: entry > 0 && serverTotal > 0 ? Math.round((entry / serverTotal) * 100 * 10) / 10 : 0,
        valueDifference: agreement ? Math.round((serverTotal - (agreement.total_value || 0)) * 100) / 100 : 0,
        installmentsDifference: agreement ? (installments - (agreement.installments || 0)) : 0
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreement, isOpen])

  // Recalcula instantaneamente ao alterar inputs (apenas para preview; backend fará cálculo oficial)
  useEffect(() => {
    const totalValue = Number(formData.newTotalValue) || 0
    const installments = Math.max(1, Number(formData.newInstallments) || 1)
    const entryValue = Number(formData.newEntryValue) || 0
    const remainingValue = Math.max(0, totalValue - entryValue)
    const installmentValue = remainingValue / installments
    const entryPercentage = totalValue > 0 ? (entryValue / totalValue) * 100 : 0

    setCalculations(prev => ({
      ...prev,
      installmentValue: Math.round(installmentValue * 100) / 100,
      remainingValue: Math.round(remainingValue * 100) / 100,
      entryPercentage: Math.round(entryPercentage * 10) / 10,
      valueDifference: agreement ? Math.round((totalValue - agreement.total_value) * 100) / 100 : prev.valueDifference,
      installmentsDifference: agreement ? (installments - agreement.installments) : prev.installmentsDifference
    }))
  }, [formData, agreement])

  const handleInputChange = <K extends keyof RenegotiationData>(field: K, value: RenegotiationData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const resetLocalState = () => {
    setFormData(defaultForm(agreement ?? undefined))
    setCalculations({
      installmentValue: agreement?.current_installment_value ?? agreement?.installment_value ?? 0,
      remainingValue: agreement?.current_total_value ?? agreement?.total_value ?? 0,
      entryPercentage: 0,
      valueDifference: agreement ? Math.round(((agreement.current_total_value ?? agreement.total_value) - agreement.total_value) * 100) / 100 : 0,
      installmentsDifference: 0
    })
    setError('')
    setShowIPCADetails(false)
    setLoading(false)
  }

  // controla fechamento seguro do Dialog (reseta estados)
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetLocalState()
      onClose()
    }
  }

  // Submete renegociação: envia ao backend e usa o cálculo oficial retornado
  const handleSubmit = async () => {
    if (!agreement) return

    // validações frontend
    if (!formData.reason || !formData.reason.trim()) {
      setError('O motivo da renegociação é obrigatório')
      return
    }

    if (Number(formData.newTotalValue) <= 0) {
      setError('O valor total deve ser maior que zero')
      return
    }

    if (Number(formData.newInstallments) < 1) {
      setError('O número de parcelas deve ser pelo menos 1')
      return
    }

    if (Number(formData.newEntryValue) >= Number(formData.newTotalValue)) {
      setError('O valor de entrada não pode ser maior ou igual ao valor total')
      return
    }

    setLoading(true)
    setError('')

    try {
      // payload usa nomes compatíveis com seu endpoint (o endpoint espera newTotalValue etc. no schema Zod — adaptamos)
      const payload = {
        action: 'renegotiate',
        newTotalValue: Number(formData.newTotalValue),
        newInstallments: Number(formData.newInstallments),
        newFirstDueDate: formData.newFirstDueDate || null,
        newEntryValue: Number(formData.newEntryValue) || 0,
        reason: String(formData.reason),
        resetIPCABase: Boolean(formData.resetIPCABase),
        maintainPaidInstallments: Boolean(formData.maintainPaidInstallments)
      }

      const response = await fetch(`/api/financial-agreements/${agreement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        // mostra erros de validação enviados pelo backend se existirem
        const msg = result?.details ? (Array.isArray(result.details) ? result.details.join('; ') : result.details) : (result.error || 'Erro ao processar renegociação')
        throw new Error(msg)
      }

      // se o backend retornou cálculos oficiais, usa-os para atualizar o resumo
      if (result?.calculations) {
        const calc = result.calculations
        // suporta tanto flat (installmentValue, remainingValue) quanto nested
        setCalculations(prev => ({
          ...prev,
          installmentValue: calc.installmentValue ?? calc.current_installment_value ?? prev.installmentValue,
          remainingValue: calc.remainingValue ?? calc.current_remaining_value ?? prev.remainingValue,
          entryPercentage: calc.entryPercentage ?? prev.entryPercentage,
          valueDifference: calc.totalValue !== undefined && agreement ? Math.round((calc.totalValue - agreement.total_value) * 100) / 100 : prev.valueDifference,
          installmentsDifference: calc.newInstallments !== undefined && agreement ? (calc.newInstallments - agreement.installments) : prev.installmentsDifference
        }))
      }

      // assume result.agreement contém o acordo atualizado (PUT /api/financial-agreements/[id] retorna isso)
      if (result?.agreement) {
        onSuccess(result.agreement)
      } else {
        // fallback: caso backend retorne o objeto em outro lugar
        onSuccess(result)
      }

      resetLocalState()
      onClose()
    } catch (err) {
      console.error('Erro na renegociação:', err)
      setError(err instanceof Error ? err.message : 'Erro inesperado ao enviar renegociação')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0)

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR')
    } catch {
      return dateString
    }
  }

  if (!agreement) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Renegociar Acordo Financeiro
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-4 h-4" />
                Acordo Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{agreement.clients?.name}</p>
                <p className="text-sm text-muted-foreground">{agreement.clients?.email}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Valor (corrigido se houver)</Label>
                  <p className="font-medium">{formatCurrency(agreement.current_total_value ?? agreement.ipca_correction?.correctedValue ?? agreement.total_value)}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Parcelas</Label>
                  <p className="font-medium">{agreement.installments}x</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Valor da Parcela (corrigido se houver)</Label>
                  <p className="font-medium">{formatCurrency(agreement.current_installment_value ?? agreement.installment_value)}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Pagas</Label>
                  <p className="font-medium">{agreement.paid_installments || 0}</p>
                </div>
              </div>

              {agreement.ipca_correction && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Correção IPCA
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => setShowIPCADetails(v => !v)}>
                        {showIPCADetails ? 'Ocultar' : 'Detalhes'}
                      </Button>
                    </div>

                    {showIPCADetails && (
                      <div className="mt-2 p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Valor Original:</span>
                          <span className="text-sm font-medium">{formatCurrency(agreement.ipca_correction.originalValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Taxa IPCA:</span>
                          <span className="text-sm font-medium text-green-600">+{agreement.ipca_correction.ipcaRate.toFixed(4)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Correção:</span>
                          <span className="text-sm font-medium text-green-600">+{formatCurrency(agreement.ipca_correction.correctionAmount)}</span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm">Valor Corrigido:</span>
                          <span className="text-sm text-green-600">{formatCurrency(agreement.ipca_correction.correctedValue)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Baseado em {agreement.ipca_correction.days} dias desde {formatDate(agreement.ipca_base_date)}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'}>{agreement.status}</Badge>
                <Badge variant="outline">{agreement.agreement_type}</Badge>
                {(agreement.renegotiation_count || 0) > 0 && <Badge variant="secondary">{agreement.renegotiation_count}ª renegociação</Badge>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nova Configuração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newTotalValue">Novo Valor Total</Label>
                  <Input
                    id="newTotalValue"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.newTotalValue ?? ''}
                    onChange={(e) => handleInputChange('newTotalValue', Number(e.target.value) || 0)}
                    placeholder="0,00"
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="newInstallments">Número de Parcelas</Label>
                  <Input
                    id="newInstallments"
                    type="number"
                    min="1"
                    value={formData.newInstallments ?? ''}
                    onChange={(e) => handleInputChange('newInstallments', Math.max(1, Number(e.target.value) || 1))}
                    placeholder="12"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="newEntryValue">Valor de Entrada (Opcional)</Label>
                <Input
                  id="newEntryValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.newEntryValue ?? ''}
                  onChange={(e) => handleInputChange('newEntryValue', Number(e.target.value) || 0)}
                  placeholder="0,00"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="newFirstDueDate">Data do Primeiro Vencimento</Label>
                <Input
                  id="newFirstDueDate"
                  type="date"
                  value={formData.newFirstDueDate ?? ''}
                  onChange={(e) => handleInputChange('newFirstDueDate', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo da Renegociação</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  placeholder="Descreva o motivo da renegociação..."
                  className="min-h-[60px]"
                  disabled={loading}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Resetar Base do IPCA</Label>
                    <p className="text-xs text-muted-foreground">Recomeça o cálculo do IPCA a partir de hoje</p>
                  </div>
                  <Switch
                    checked={formData.resetIPCABase}
                    onCheckedChange={(checked) => handleInputChange('resetIPCABase', Boolean(checked))}
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Manter Parcelas Pagas</Label>
                    <p className="text-xs text-muted-foreground">Considera as parcelas já pagas no novo acordo</p>
                  </div>
                  <Switch
                    checked={formData.maintainPaidInstallments}
                    onCheckedChange={(checked) => handleInputChange('maintainPaidInstallments', Boolean(checked))}
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Renegociação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Label className="text-xs text-muted-foreground">Nova Parcela</Label>
                <p className="text-lg font-bold">{formatCurrency(calculations.installmentValue)}</p>
              </div>

              <div className="text-center">
                <Label className="text-xs text-muted-foreground">Valor Restante</Label>
                <p className="text-lg font-bold">{formatCurrency(calculations.remainingValue)}</p>
              </div>

              <div className="text-center">
                <Label className="text-xs text-muted-foreground">% Entrada</Label>
                <p className="text-lg font-bold">{calculations.entryPercentage.toFixed(1)}%</p>
              </div>

              <div className="text-center">
                <Label className="text-xs text-muted-foreground">Diferença Valor</Label>
                <p className={`text-lg font-bold ${calculations.valueDifference >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {calculations.valueDifference >= 0 ? '+' : ''}{formatCurrency(calculations.valueDifference)}
                </p>
              </div>
            </div>

            {calculations.valueDifference !== 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {calculations.valueDifference > 0
                    ? `O novo acordo aumentará o valor total em ${formatCurrency(calculations.valueDifference)}`
                    : `O novo acordo reduzirá o valor total em ${formatCurrency(Math.abs(calculations.valueDifference))}`}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Processando...' : 'Confirmar Renegociação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
