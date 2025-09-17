// components/tasks-module.tsx
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const initialTasks = [
  { id: 1, title: 'Elaborar contestação para o Processo 001/2024', status: 'todo', priority: 'high', assignee: 'Dr. Cássio' },
  { id: 2, title: 'Ligar para o cliente João Silva', status: 'todo', priority: 'medium', assignee: 'Secretária' },
  { id: 3, title: 'Revisar petição inicial do caso Maria Souza', status: 'in-progress', priority: 'high', assignee: 'Dr. Cássio' },
  { id: 4, title: 'Agendar audiência de conciliação', status: 'in-progress', priority: 'medium', assignee: 'Secretária' },
  { id: 5, title: 'Protocolar recurso de apelação', status: 'done', priority: 'high', assignee: 'Dr. Cássio' },
];

const TaskCard = ({ task }: { task: any }) => (
  <Card className="mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <p className="font-medium text-sm text-slate-800">{task.title}</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div>
          {task.priority === 'high' && <Badge className="bg-red-100 text-red-800">Alta Prioridade</Badge>}
          {task.priority === 'medium' && <Badge className="bg-yellow-100 text-yellow-800">Média Prioridade</Badge>}
        </div>
        <div className="text-xs text-slate-500">{task.assignee}</div>
      </div>
    </CardContent>
  </Card>
);

export function TasksModule() {
  const [tasks, setTasks] = useState(initialTasks);

  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('taskId', id.toString());
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: string) => {
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status } : task
    );
    setTasks(updatedTasks);
  };

  const columns = [
    { id: 'todo', title: 'A Fazer' },
    { id: 'in-progress', title: 'Em Andamento' },
    { id: 'done', title: 'Concluído' },
  ];

  return (
     <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold mb-2">Gestão de Tarefas</h2>
                <p className="text-slate-300 text-lg">Organize e acompanhe as atividades da sua equipe.</p>
            </div>
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="mr-2 h-4 w-4" /> Nova Tarefa
            </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => (
            <div key={column.id} className="bg-slate-100 rounded-lg p-4" onDragOver={onDragOver} onDrop={(e) => onDrop(e, column.id)}>
            <h3 className="font-semibold mb-4 text-slate-700">{column.title}</h3>
            {tasks
                .filter(task => task.status === column.id)
                .map(task => (
                <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task.id)}>
                    <TaskCard task={task} />
                </div>
                ))}
            </div>
        ))}
        </div>
     </div>
  );
}