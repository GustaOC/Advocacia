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
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { apiClient } from "@/lib/api-client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

const TaskSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  description: z.string().optional(),
  assigned_to: z.string().uuid("Selecione um responsável."),
  due_date: z.string().optional().nullable(),
})

type TaskFormValues = z.infer<typeof TaskSchema>

interface TaskModalProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export function TaskModal({ isOpen, onOpenChange }: TaskModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiClient.get('/employees').then(res => res.data)
  })

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskSchema),
    defaultValues: { title: "", description: "" },
  })

  const mutation = useMutation({
    mutationFn: (data: TaskFormValues) => apiClient.post("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({ title: "Tarefa criada com sucesso!" })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: TaskFormValues) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
          <DialogDescription>
            Descreva a tarefa e atribua a um membro da equipe.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input placeholder="Ex: Elaborar petição inicial do caso X" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Detalhes adicionais sobre a tarefa..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="assigned_to"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Atribuir Para</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um funcionário" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {isLoadingEmployees ? <SelectItem value="loading" disabled>Carregando...</SelectItem> :
                                employees?.map((emp: any) => (
                                    <SelectItem key={emp.user.id} value={emp.user.id}>
                                        {emp.user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Prazo Final</FormLabel>
                        <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Criando..." : "Criar Tarefa"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}