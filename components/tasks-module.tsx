// components/tasks-module.tsx
"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, CheckCircle, ListTodo } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskModal } from "./task-modal"
import { Badge } from "./ui/badge"

export function TasksModule() {
  // CORREÇÃO: Acessando 'user' diretamente, que contém a propriedade 'role'.
  const { user } = useAuth(); 
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // CORREÇÃO: A verificação de admin agora usa 'user.role'.
  const isAdmin = user?.role === 'admin';

  const {
    data: tasks,
    isLoading,
  } = useQuery({
    // A queryKey agora depende de isAdmin para garantir que os dados sejam recarregados se o perfil do utilizador mudar.
    queryKey: ["tasks", user?.id, isAdmin],
    queryFn: async () => {
      // A API irá retornar as tarefas corretas com base no perfil do utilizador.
      const response = await apiClient.getTasks();
      return response; // A API já retorna um array
    },
    enabled: !!user, // A query só é executada quando o utilizador está carregado.
  })

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiClient.completeTask(taskId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["tasks", user?.id, isAdmin] })
    }
  })

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gestor de Tarefas</CardTitle>
              <CardDescription>
                {isAdmin ? "Crie e atribua tarefas à equipa." : "Visualize e complete as suas tarefas atribuídas."}
              </CardDescription>
            </div>
            {/* Apenas administradores podem ver o botão para criar novas tarefas */}
            {isAdmin && (
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : (
                <div className="space-y-4">
                    {tasks && tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center p-4 border rounded-lg">
                            <div className="flex-grow">
                                <p className="font-semibold">{task.title}</p>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="flex items-center space-x-2 mt-2 text-xs">
                                    <Badge variant={task.status === 'Concluída' ? 'default' : 'secondary'}>{task.status}</Badge>
                                    <span>Para: <strong>{task.assignee_name || 'N/A'}</strong></span>
                                    <span>Prazo: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>
                            {task.status !== 'Concluída' && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => completeTaskMutation.mutate(task.id)}
                                    disabled={completeTaskMutation.isPending}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Marcar como Concluída
                                </Button>
                            )}
                        </div>
                    ))}
                    {(!tasks || tasks.length === 0) && (
                        <div className="text-center py-12 text-muted-foreground">
                            <ListTodo className="mx-auto h-12 w-12" />
                            <p className="mt-4">Nenhuma tarefa encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </CardContent>
      </Card>
      {isAdmin && <TaskModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />}
    </>
  )
}