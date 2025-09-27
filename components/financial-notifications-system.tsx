// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/components/financial-notifications-system.tsx

'use client'

import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bell, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { NotificationRuleSchema } from '@/lib/schemas' // Usando o schema que já criamos
import { useToast } from '@/hooks/use-toast'

type NotificationRule = z.infer<typeof NotificationRuleSchema>

// Mock de dados e hooks para simular a interação com a API
const mockRules: NotificationRule[] = [
  { id: 'rule-1', name: 'Lembrete Padrão (3 dias)', days_before_due: 3, message_template: 'Olá, [DEVEDOR]! Sua parcela de [VALOR] vence em 3 dias. Pague via PIX: [CHAVE_PIX]', is_active: true },
  { id: 'rule-2', name: 'Alerta de Vencimento (1 dia)', days_before_due: 1, message_template: 'ATENÇÃO: Sua parcela vence amanhã!', is_active: true },
  { id: 'rule-3', name: 'Campanha de Renegociação', days_before_due: 10, message_template: 'Evite juros! Sua parcela vence em 10 dias. Quer renegociar? Responda a esta mensagem.', is_active: false },
]

// Simulação de hooks que seriam criados em `use-financials.ts`
const useGetNotificationRules = () => ({ data: mockRules, isLoading: false })
const useCreateNotificationRule = () => {
    const { toast } = useToast();
    return { 
        mutate: (data: NotificationRule, { onSuccess }: { onSuccess?: () => void } = {}) => {
            console.log('Criando nova regra:', data)
            toast({ title: "Sucesso!", description: "Nova regra de notificação criada." })
            onSuccess?.();
        },
        isPending: false 
    }
}
const useDeleteNotificationRule = () => {
    const { toast } = useToast();
    return { 
        mutate: (id: string) => {
            console.log('Deletando regra ID:', id)
            toast({ title: "Sucesso!", description: "Regra deletada." })
        }
    }
}

export function FinancialNotificationsSystem() {
  const [isFormVisible, setFormVisible] = useState(false)
  const { data: rules, isLoading } = useGetNotificationRules()
  const createRuleMutation = useCreateNotificationRule()
  const deleteRuleMutation = useDeleteNotificationRule()

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
    reset,
  } = useForm<NotificationRule>({
    resolver: zodResolver(NotificationRuleSchema),
    // ✅ Este defaultValues agora é a única fonte do valor inicial, o que é o correto.
    defaultValues: {
      name: '',
      days_before_due: 3,
      message_template: 'Olá, [DEVEDOR]! Sua parcela de [VALOR] no valor de [VALOR_PARCELA] vence em [DIAS] dias.',
      is_active: true,
    },
  })

  const onSubmit = (data: NotificationRule) => {
    createRuleMutation.mutate(data, {
      onSuccess: () => {
        reset()
        setFormVisible(false)
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <Bell className="mr-2" />
              Sistema de Notificações Automáticas
            </CardTitle>
            <CardDescription>
              Crie e gerencie regras para enviar lembretes de pagamento aos devedores.
            </CardDescription>
          </div>
          {!isFormVisible && (
            <Button onClick={() => setFormVisible(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Regra
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isFormVisible && (
          <Card className="mb-6 bg-slate-50 p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">Nome da Regra</Label>
                <Input id="name" {...register('name')} placeholder="Ex: Lembrete de 3 dias via WhatsApp" />
                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="days_before_due">Disparar quantos dias antes do vencimento?</Label>
                <Input id="days_before_due" type="number" {...register('days_before_due')} />
                {errors.days_before_due && <p className="text-red-500 text-xs">{errors.days_before_due.message}</p>}
              </div>
              <div className="space-y-1">
                <Label htmlFor="message_template">Modelo da Mensagem</Label>
                <Textarea id="message_template" {...register('message_template')} rows={4} />
                 <p className="text-xs text-muted-foreground">
                  Use placeholders como [DEVEDOR], [VALOR_PARCELA], [VENCIMENTO].
                </p>
                {errors.message_template && <p className="text-red-500 text-xs">{errors.message_template.message}</p>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Controller name="is_active" control={control} render={({ field }) => (
                         <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                    )}/>
                    <Label htmlFor="is_active">Regra Ativa</Label>
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => { setFormVisible(false); reset(); }}>Cancelar</Button>
                    <Button type="submit" disabled={createRuleMutation.isPending}>
                        {createRuleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Salvar Regra
                    </Button>
                </div>
              </div>
            </form>
          </Card>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Regra</TableHead>
                <TableHead>Condição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell>{rule.days_before_due} dias antes do venc.</TableCell>
                  <TableCell>
                    <Badge variant={rule.is_active ? 'success' : 'secondary'}>
                      {rule.is_active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-destructive"/>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta ação não pode ser desfeita. A regra de notificação será permanentemente deletada.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRuleMutation.mutate(rule.id!)}>
                                Sim, deletar
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}