// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/enhanced-financial-agreement-modal.tsx

'use client'

import React, { useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { cn } from '@/lib/utils'
import {
  EnhancedAgreementSchema,
  EnhancedAgreement,
} from '@/lib/schemas'

import { useCreateFinancialAgreement } from '@/hooks/use-financials'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AgreementFormData = z.infer<typeof EnhancedAgreementSchema>

// Mock de dados
const mockCases = [
  { id: 'case-1', case_number: '001/2023' },
  { id: 'case-2', case_number: '002/2023' },
  { id: 'case-3', case_number: '003/2023' },
]
const mockEntities = [
  { id: 'entity-1', name: 'João da Silva' },
  { id: 'entity-2', name: 'Empresa ABC Ltda' },
  { id: 'entity-3', name: 'Maria Oliveira' },
]

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  agreementId?: string | null
  // Prop para receber dados de pré-preenchimento
  initialData?: {
    id?: string;
    debtor_id?: string;
    creditor_id?: string;
  } | null;
}

export function EnhancedFinancialAgreementModal({ isOpen, onClose, agreementId, initialData }: ModalProps) {
  const isEditing = !!agreementId

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<AgreementFormData>({
    resolver: zodResolver(EnhancedAgreementSchema),
    defaultValues: {
      case_id: '',
      debtor_id: '',
      creditor_id: '',
      total_amount: 0,
      down_payment: 0,
      number_of_installments: 12,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Garante que a data final seja após a de início por defeito
      status: 'ATIVO',
      agreement_type: 'SOMENTE_PARCELADO',
      notes: '',
    },
  })

  useEffect(() => {
    if (initialData && isOpen) {
      reset({
        case_id: initialData.id || '',
        debtor_id: initialData.debtor_id || '',
        creditor_id: initialData.creditor_id || '',
        // Reseta o resto para valores padrão
        total_amount: 0,
        down_payment: 0,
        number_of_installments: 12,
        start_date: new Date(),
        end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: 'ATIVO',
        agreement_type: 'SOMENTE_PARCELADO',
        notes: '',
      });
    } else if (!isOpen) {
      reset();
    }
  }, [initialData, isOpen, reset]);


  const createAgreementMutation = useCreateFinancialAgreement()

  const onSubmit = (data: AgreementFormData) => {
    createAgreementMutation.mutate(data, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Acordo' : 'Criar Novo Acordo'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Criando um acordo para o processo selecionado.' : 'Preencha os detalhes para registrar um novo acordo.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
            <Controller
              name="case_id"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Label>Processo</Label>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {mockCases.map((c) => (<SelectItem key={c.id} value={c.id}>{c.case_number}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  {errors.case_id && <p className="text-red-500 text-xs">{errors.case_id.message as string}</p>}
                </div>
              )}
            />
            <Controller
              name="debtor_id"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Label>Devedor</Label>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {mockEntities.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.debtor_id && <p className="text-red-500 text-xs">{errors.debtor_id.message as string}</p>}
                </div>
              )}
            />
             <Controller
              name="creditor_id"
              control={control}
              render={({ field }) => (
                <div className="space-y-1 col-span-2">
                  <Label>Credor</Label>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {mockEntities.map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.creditor_id && <p className="text-red-500 text-xs">{errors.creditor_id.message as string}</p>}
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller name="total_amount" control={control} render={({ field }) => (
              <div className="space-y-1">
                <Label htmlFor="total_amount">Valor Total (R$)</Label>
                <Input id="total_amount" type="number" step="0.01" {...field} />
                {errors.total_amount && <p className="text-red-500 text-xs">{errors.total_amount.message as string}</p>}
              </div>
            )}/>
            <Controller name="down_payment" control={control} render={({ field }) => (
              <div className="space-y-1">
                <Label htmlFor="down_payment">Entrada (R$)</Label>
                <Input id="down_payment" type="number" step="0.01" {...field} />
                {errors.down_payment && <p className="text-red-500 text-xs">{errors.down_payment.message as string}</p>}
              </div>
            )}/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller name="number_of_installments" control={control} render={({ field }) => (
              <div className="space-y-1">
                <Label htmlFor="number_of_installments">Nº de Parcelas</Label>
                <Input id="number_of_installments" type="number" {...field} />
                {errors.number_of_installments && <p className="text-red-500 text-xs">{errors.number_of_installments.message as string}</p>}
              </div>
            )}/>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <Label>Data de Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Escolha uma data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  {errors.start_date && <p className="text-red-500 text-xs">{errors.start_date.message as string}</p>}
                </div>
              )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createAgreementMutation.isPending}>
              {createAgreementMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Acordo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}