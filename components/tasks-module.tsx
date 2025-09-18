// components/tasks-module.tsx
"use client";

// ✅ CORREÇÃO: Adicionado 'useMemo' à importação do React
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

// --- Tipos de Dados ---
interface Task { id: number; title: string; status: 'todo' | 'in-progress' | 'done'; priority: 'high' | 'medium' | 'low'; assigneeId: string; }
interface Employee { id: string; name: string; email: string; }
interface CurrentUser { id: string; name: string; role: 'admin' | 'user'; }

// --- Mocks para simulação ---
const mockTasks: Task[] = [
  { id: 1, title: 'Elaborar contestação para o Processo 001/2024', status: 'todo', priority: 'high', assigneeId: 'dr_cassio' },
  { id: 2, title: 'Ligar para o cliente João Silva', status: 'todo', priority: 'medium', assigneeId: 'secretaria' },
  { id: 3, title: 'Revisar petição inicial do caso Maria Souza', status: 'in-progress', priority: 'high', assigneeId: 'dr_cassio' },
  { id: 4, title: 'Agendar audiência de conciliação', status: 'in-progress', priority: 'medium', assigneeId: 'secretaria' },
  { id: 5, title: 'Protocolar recurso de apelação', status: 'done', priority: 'high', assigneeId: 'dr_cassio' },
];
const mockEmployees: Employee[] = [
    {id: 'dr_cassio', name: 'Dr. Cássio Miguel', email: 'cassio@adv.com'},
    {id: 'secretaria', name: 'Secretária Ana', email: 'ana@adv.com'},
];

const TaskCard = ({ task, employees }: { task: Task, employees: Employee[] }) => (
  <Card className="mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <p className="font-medium text-sm text-slate-800">{task.title}</p>
      <div className="flex items-center justify-between mt-2">
        <div>
          {task.priority === 'high' && <Badge className="bg-red-100 text-red-800">Alta Prioridade</Badge>}
          {task.priority === 'medium' && <Badge className="bg-yellow-100 text-yellow-800">Média Prioridade</Badge>}
        </div>
        <div className="text-xs text-slate-500">{employees.find(e => e.id === task.assigneeId)?.name || 'N/A'}</div>
      </div>
    </CardContent>
  </Card>
);

export function TasksModule() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', assigneeId: '', priority: 'medium' as Task['priority'], description: '' });

  // Simula o usuário logado e sua role
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ id: 'dr_cassio', name: 'Dr. Cássio Miguel', role: 'admin' });

  useEffect(() => {
    // Em um app real:
    // const user = await apiClient.getCurrentUser(); setCurrentUser(user);
    // const fetchedTasks = await apiClient.getTasks(); setTasks(fetchedTasks);
    // const fetchedEmployees = await apiClient.getEmployees(); setEmployees(fetchedEmployees);
    setTasks(mockTasks);
    setIsLoading(false);
  }, []);

  const handleCreateTask = () => {
    if(!newTask.title || !newTask.assigneeId) {
        toast({title: "Erro", description: "Título e responsável são obrigatórios.", variant: "destructive"});
        return;
    }
    const taskToSave = { ...newTask, id: Math.random(), status: 'todo' as 'todo' };
    setTasks(prev => [...prev, taskToSave]);
    toast({title: "Sucesso!", description: "Tarefa criada e atribuída."});
    setModalOpen(false);
    setNewTask({ title: '', assigneeId: '', priority: 'medium', description: '' });
  };
  
  // Filtra as tarefas para mostrar apenas as do usuário, a menos que seja admin
  const visibleTasks = useMemo(() => {
    if (currentUser.role === 'admin') return tasks;
    return tasks.filter(task => task.assigneeId === currentUser.id);
  }, [tasks, currentUser]);

  const columns = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'in-progress', title: 'Em Andamento' },
    { id: 'done', title: 'Concluído' },
  ];

  return (
     <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold mb-2">Gestão de Tarefas</h2>
                <p className="text-slate-300 text-lg">Organize e acompanhe as atividades da sua equipe.</p>
            </div>
            {currentUser.role === 'admin' && (
                <Button onClick={() => setModalOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100">
                    <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
                </Button>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => (
            <div key={column.id} className="bg-slate-100 rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-slate-700">{column.title}</h3>
                {visibleTasks
                    .filter(task => task.status === column.id)
                    .map(task => <TaskCard key={task.id} task={task} employees={employees} />)
                }
            </div>
        ))}
        </div>

        <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>Criar e Atribuir Nova Tarefa</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2"><Label>Título da Tarefa *</Label><Input value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Atribuir para *</Label>
                        <Select value={newTask.assigneeId} onValueChange={id => setNewTask({...newTask, assigneeId: id})}>
                            <SelectTrigger><SelectValue placeholder="Selecione o responsável..." /></SelectTrigger>
                            <SelectContent>{employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateTask}>Criar Tarefa</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
     </div>
  );
}