"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CaseSchema } from "@/lib/schemas"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiClient } from "@/lib/api-client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"

type CaseFormValues = z.infer<typeof CaseSchema>

interface CaseModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  caseData?: any
}

export function CaseModal({ isOpen, onOpenChange, caseData }: CaseModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(CaseSchema),
    defaultValues: {
      title: "",
      case_number: "",
      description: "",
      status: "Em Andamento",
      urgency: "Baixa",
      court: "",
      agreement_type: null,
      extinction_reason: null,
    },
  })
  
  const status = form.watch("status");

  useEffect(() => {
    if (caseData) {
      form.reset(caseData)
    } else {
      form.reset()
    }
  }, [caseData, form])

  const mutation = useMutation({
    mutationFn: (data: CaseFormValues) => {
        if (caseData?.id) {
            return apiClient.put(`/cases/${caseData.id}`, data)
        }
        return apiClient.post("/cases", data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cases"] })
      toast({ title: `Caso ${caseData ? 'atualizado' : 'criado'} com sucesso!` })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: `Erro ao ${caseData ? 'atualizar' : 'criar'} caso`,
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: CaseFormValues) => {
    // Garante que campos condicionais não enviados sejam nulos
    const payload = {
        ...data,
        agreement_type: data.status === 'Em Acordo' ? data.agreement_type : null,
        extinction_reason: data.status === 'Extinto' ? data.extinction_reason : null,
    };
    mutation.mutate(payload)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{caseData ? "Editar Caso" : "Criar Novo Caso"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do processo abaixo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Caso</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Revisão de Aposentadoria INSS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="case_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nº do Processo</FormLabel>
                      <FormControl>
                        <Input placeholder="0000000-00.0000.0.00.0000" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="court"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tribunal/Vara</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 1ª Vara Cível de Campo Grande" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descrição sobre o caso..." {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Processo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                      <SelectItem value="Em Acordo">Em Acordo</SelectItem>
                      <SelectItem value="Extinto">Extinto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {status === 'Em Acordo' && (
              <FormField
                control={form.control}
                name="agreement_type"
                render={({ field }) => (
                  <FormItem className="bg-blue-50 p-4 rounded-md dark:bg-blue-900/20">
                    <FormLabel>Tipo de Acordo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de acordo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Judicial">Judicial</SelectItem>
                        <SelectItem value="Extrajudicial">Extrajudicial</SelectItem>
                        <SelectItem value="Acordo em Audiência">Acordo em Audiência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {status === 'Extinto' && (
               <FormField
                control={form.control}
                name="extinction_reason"
                render={({ field }) => (
                  <FormItem className="bg-red-50 p-4 rounded-md dark:bg-red-900/20">
                    <FormLabel>Motivo da Extinção</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo da extinção" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Grupo Econômico">Grupo Econômico</SelectItem>
                        <SelectItem value="Citação Negativa">Citação Negativa</SelectItem>
                        <SelectItem value="Penhora Infrutífera">Penhora Infrutífera</SelectItem>
                        <SelectItem value="Pagamento">Pagamento</SelectItem>
                        <SelectItem value="Morte">Morte</SelectItem>
                        <SelectItem value="Desistência">Desistência</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : (caseData ? "Salvar Alterações" : "Criar Caso")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}