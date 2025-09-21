// components/tasks-module.tsx - VERSÃO CORRIGIDA
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, CheckCircle, Clock, AlertTriangle, User, Calendar, Filter, Star, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';

// Interfaces
interface Task { 
  id: number; 
  title: string; 
  status: 'todo' | 'in-progress' | 'done'; 
  priority: 'high' | 'medium' | 'low'; 
  assigneeId: string; 
  dueDate?: string;
  description?: string;
}

interface Employee { 
  id: string; 
  name: string; 
  email: string; 
  avatar?: string; 
}

// Mock data
const mockTasks: Task[] = [
  { id: 1, title: 'Elaborar contestação para o Processo 001/2024', status: 'todo', priority: 'high', assigneeId: 'dr_cassio', dueDate: '2025-09-25' },
  { id: 2, title: 'Ligar para o cliente João Silva', status: 'todo', priority: 'medium', assigneeId: 'secretaria', dueDate: '2025-09-22' },
  { id: 3, title: 'Revisar petição inicial do caso Maria Souza', status: 'in-progress', priority: 'high', assigneeId: 'dr_cassio' },
  { id: 4, title: 'Agendar audiência de conciliação', status: 'in-progress', priority: 'medium', assigneeId: 'secretaria' },
  { id: 5, title: 'Protocolar recurso de apelação', status: 'done', priority: 'high', assigneeId: 'dr_cassio' },
];

const mockEmployees: Employee[] = [
  {id: 'dr_cassio', name: 'Dr. Cássio Miguel', email: 'cassio@adv.com', avatar: '/avatar-cassio.jpg'},
  {id: 'secretaria', name: 'Secretária Ana', email: 'ana@adv.com', avatar: '/avatar-ana.jpg'},
];

// Componente de estatísticas de tarefas
function TasksStats({ tasks }: { tasks: Task[] }) {
  const stats = [
    { 
      label: "Total de Tarefas", 
      value: tasks.length.toString(), 
      icon: CheckCircle, 
      color: "text-blue-600",
      bg: "from-blue-50 to-blue-100",
      trend: "+5%"
    },
    { 
      label: "Em Progresso", 
      value: tasks.filter(t => t.status === 'in-progress').length.toString(), 
      icon: Clock, 
      color: "text-orange-600",
      bg: "from-orange-50 to-orange-100",
      trend: "+12%"
    },
    { 
      label: "Concluídas", 
      value: tasks.filter(t => t.status === 'done').length.toString(), 
      icon: CheckCircle, 
      color: "text-green-600",
      bg: "from-green-50 to-green-100",
      trend: "+8%"
    },
    { 
      label: "Alta Prioridade", 
      value: tasks.filter(t => t.priority === 'high').length.toString(), 
      icon: AlertTriangle, 
      color: "text-red-600",
      bg: "from-red-50 to-red-100",
      trend: "-3%"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        // Correção: Extrair o ícone corretamente
        const StatIcon = stat.icon;
        
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600 font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <StatIcon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Componente de card de tarefa moderno
const TaskCard = ({ task, employees, onEdit }: { task: Task, employees: Employee[], onEdit?: (task: Task) => void }) => {
  const assignee = employees.find(e => e.id === task.assigneeId);
  
  const priorityConfig = {
    high: { color: 'from-red-500 to-red-600', label: 'Alta', icon: AlertTriangle },
    medium: { color: 'from-yellow-500 to-orange-500', label: 'Média', icon: Clock },
    low: { color: 'from-green-500 to-green-600', label: 'Baixa', icon: CheckCircle }
  };

  const statusConfig = {
    todo: { bg: 'bg-slate-50', border: 'border-slate-200' },
    'in-progress': { bg: 'bg-blue-50', border: 'border-blue-200' },
    done: { bg: 'bg-green-50', border: 'border-green-200' }
  };

  // Correção: Extrair o ícone corretamente
  const PriorityIcon = priorityConfig[task.priority].icon;
  const priorityLabel = priorityConfig[task.priority].label;
  const priorityColor = priorityConfig[task.priority].color;

  return (
    <Card className={`group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 ${statusConfig[task.status].border} ${statusConfig[task.status].bg} relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
      
      <CardContent className="p-4 relative z-10">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-slate-700 transition-colors">
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-slate-600 line-clamp-1">{task.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge className={`bg-gradient-to-r ${priorityColor} text-white border-0 px-3 py-1 font-semibold shadow-lg`}>
              <PriorityIcon className="h-3 w-3 mr-1" />
              {priorityLabel}
            </Badge>
            
            {task.dueDate && (
              <div className="flex items-center text-xs text-slate-500">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {assignee?.name?.charAt(0) || '?'}
              </div>
              <span className="text-xs text-slate-600">{assignee?.name || 'N/A'}</span>
            </div>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
              onClick={() => onEdit?.(task)}
            >
              Editar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function TasksModule() {
  const { toast } = useToast();
  const { user, can } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    assigneeId: '', 
    priority: 'medium' as Task['priority'],
    dueDate: '',
    description: ''
  });

  useEffect(() => {
    // Simulação de carregamento
    setTimeout(() => {
      setTasks(mockTasks);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleCreateTask = () => {
    if(!newTask.title || !newTask.assigneeId) {
      toast({title: "Erro", description: "Título e responsável são obrigatórios.", variant: "destructive"});
      return;
    }
    const taskToSave: Task = { 
      ...newTask, 
      id: Date.now(), 
      status: 'todo' 
    };
    setTasks(prev => [...prev, taskToSave]);
    toast({title: "Sucesso!", description: "Tarefa criada e atribuída."});
    setModalOpen(false);
    setNewTask({ title: '', assigneeId: '', priority: 'medium', dueDate: '', description: '' });
  };

  const visibleTasks = useMemo(() => {
    if (can && can('tasks_view_all')) return tasks;
    return tasks.filter(task => task.assigneeId === user?.id);
  }, [tasks, user, can]);

  const columns = [
    { id: 'todo', title: 'A Fazer', color: 'from-slate-100 to-slate-200' },
    { id: 'in-progress', title: 'Em Andamento', color: 'from-blue-100 to-blue-200' },
    { id: 'done', title: 'Concluído', color: 'from-green-100 to-green-200' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
          <p className="text-slate-600 font-medium">Carregando tarefas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Moderno */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20"></div>
        
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold mb-3">Gestão de Tarefas</h2>
            <p className="text-purple-100 text-xl">Organize e acompanhe as atividades da sua equipe com eficiência.</p>
          </div>
          
          {can && can('tasks_create') && (
            <Button 
              onClick={() => setModalOpen(true)} 
              className="bg-white text-purple-900 hover:bg-purple-50 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" /> 
              Nova Tarefa
            </Button>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <TasksStats tasks={visibleTasks} />

      {/* Kanban Board Moderno */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            {/* Header da coluna */}
            <Card className={`bg-gradient-to-r ${column.color} border-0 shadow-lg`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-lg">{column.title}</h3>
                  <Badge variant="secondary" className="bg-white/80 text-slate-700 font-semibold shadow-sm">
                    {visibleTasks.filter(task => task.status === column.id).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {/* Tarefas da coluna */}
            <div className="space-y-4 min-h-[500px]">
              {visibleTasks
                .filter(task => task.status === column.id)
                .map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    employees={employees}
                    onEdit={(task) => console.log('Edit task:', task)}
                  />
                ))}
              
              {visibleTasks.filter(task => task.status === column.id).length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Nova Tarefa Moderno */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white/95 backdrop-blur-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Criar Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Título da Tarefa *</Label>
              <Input 
                value={newTask.title} 
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                className="bg-white border-2 border-slate-200 focus:border-purple-400"
                placeholder="Digite o título da tarefa..."
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Descrição</Label>
              <Input 
                value={newTask.description} 
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                className="bg-white border-2 border-slate-200 focus:border-purple-400"
                placeholder="Descrição opcional..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Responsável *</Label>
                <Select value={newTask.assigneeId} onValueChange={id => setNewTask({...newTask, assigneeId: id})}>
                  <SelectTrigger className="bg-white border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Prioridade</Label>
                <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger className="bg-white border-2 border-slate-200 focus:border-purple-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Data de Vencimento</Label>
              <Input 
                type="date" 
                value={newTask.dueDate} 
                onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                className="bg-white border-2 border-slate-200 focus:border-purple-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-2 border-slate-200">
              Cancelar
            </Button>
            <Button onClick={handleCreateTask} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg">
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}