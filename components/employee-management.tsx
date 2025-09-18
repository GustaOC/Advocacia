// components/employee-management.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

// --- Tipos de Dados ---
interface Role { id: number; name: string; }
interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  role_id: number;
  is_active: boolean;
}

export function EmployeeManagement() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Partial<Employee>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [employeesData, rolesData] = await Promise.all([
        apiClient.getEmployees(),
        // Futuramente, criar apiClient.getRoles()
        fetch('/api/roles').then(res => res.json().then(data => data.roles))
      ]);
      setEmployees(employeesData || []);
      setRoles(rolesData || []);
    } catch (error: any) {
      toast({ title: "Erro", description: `Não foi possível carregar os dados da equipe: ${error.message}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const openModalForCreate = () => {
    setIsEditMode(false);
    setSelectedEmployee({ name: '', email: '', role_id: undefined, is_active: true });
    setModalOpen(true);
  };
  
  const openModalForEdit = (employee: Employee) => {
    setIsEditMode(true);
    setSelectedEmployee(employee);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (isEditMode) {
        await apiClient.updateEmployee(selectedEmployee.id!, {
            name: selectedEmployee.name,
            role_id: selectedEmployee.role_id,
            is_active: selectedEmployee.is_active,
        });
        toast({ title: "Sucesso!", description: "Funcionário atualizado." });
      } else {
        await apiClient.createEmployee({
            name: selectedEmployee.name,
            email: selectedEmployee.email,
            role_id: selectedEmployee.role_id,
        });
        toast({ title: "Sucesso!", description: "Convite de cadastro enviado para o funcionário." });
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (confirm(`Tem certeza que deseja desativar o funcionário ${employee.name}?`)) {
      try {
        await apiClient.deleteEmployee(employee.id);
        toast({ title: "Sucesso", description: "Funcionário desativado." });
        loadData();
      } catch(error: any) {
        toast({ title: "Erro ao desativar", description: error.message, variant: "destructive" });
      }
    }
  };

  const filteredEmployees = useMemo(() =>
    employees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    ), [employees, searchTerm]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="h-8 w-8 animate-spin"/></div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gerenciamento de Equipe</h2>
        <p className="text-slate-300 text-lg">Adicione, edite e gerencie as permissões dos funcionários.</p>
      </div>
      
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <Input placeholder="Buscar por nome, email ou função..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
          {/* ✅ MELHORIA: Texto do botão alterado */}
          <Button onClick={openModalForCreate} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Cadastrar Funcionário</Button>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Função</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredEmployees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell><Badge variant="secondary">{emp.role}</Badge></TableCell>
                  <TableCell><Badge variant={emp.is_active ? "default" : "destructive"}>{emp.is_active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openModalForEdit(emp)}><Edit className="h-4 w-4" /></Button>
                    {emp.is_active && <Button variant="ghost" size="icon" onClick={() => handleDelete(emp)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Funcionário" : "Cadastrar Novo Funcionário"}</DialogTitle>
            {!isEditMode && <DialogDescription>Um e-mail de convite será enviado para que o novo funcionário defina sua senha.</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="name">Nome Completo</Label><Input id="name" value={selectedEmployee.name || ''} onChange={e => setSelectedEmployee({...selectedEmployee, name: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={selectedEmployee.email || ''} onChange={e => setSelectedEmployee({...selectedEmployee, email: e.target.value})} disabled={isEditMode} /></div>
            <div className="space-y-2"><Label htmlFor="role">Função</Label>
              <Select value={selectedEmployee.role_id?.toString()} onValueChange={value => setSelectedEmployee({...selectedEmployee, role_id: parseInt(value)})}>
                <SelectTrigger><SelectValue placeholder="Selecione uma função..." /></SelectTrigger>
                <SelectContent>{roles.map(role => <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {isEditMode && (
                <div className="flex items-center space-x-2"><input type="checkbox" id="is_active" checked={selectedEmployee.is_active} onChange={e => setSelectedEmployee({...selectedEmployee, is_active: e.target.checked})} /><Label htmlFor="is_active">Funcionário Ativo</Label></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{isEditMode ? "Salvar Alterações" : "Enviar Convite"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}