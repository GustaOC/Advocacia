"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Users, Edit, Trash2, Shield, UserCheck, ArrowUpRight, TrendingUp, Clock, Search } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface Employee {
  id: number
  name: string
  email: string
  role: string
  permissions: {
    clients?: { create: boolean; read: boolean; update: boolean; delete: boolean }
    processes?: { create: boolean; read: boolean; update: boolean; delete: boolean }
    financial?: { create: boolean; read: boolean; update: boolean; delete: boolean }
    employees?: { create: boolean; read: boolean; update: boolean; delete: boolean }
  }
  status: string
  created_by: string
  created_at: string
}

// Componente de loading moderno
function ModuleLoader() {
  return (
    <div className="min-h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
          <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2 animate-pulse"></div>
        </div>
        <p className="text-slate-600 font-medium">Carregando funcionários...</p>
      </div>
    </div>
  )
}

// Componente de estatísticas moderno
function ModernStatsCard({ title, value, change, icon: Icon, color, bgColor }: {
  title: string
  value: string
  change: string
  icon: React.ElementType
  color: string
  bgColor: string
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgColor} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <div className="flex items-center space-x-1">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-600">{change}</span>
              <span className="text-sm text-slate-500">este mês</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [newEmployeeForm, setNewEmployeeForm] = useState({
    name: "",
    email: "",
    role: "",
    permissions: {
      clients: { create: false, read: true, update: false, delete: false },
      processes: { create: false, read: true, update: false, delete: false },
      financial: { create: false, read: true, update: false, delete: false },
      employees: { create: false, read: false, update: false, delete: false },
    },
  })
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; employee: Employee | null }>({
    show: false,
    employee: null,
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setIsLoading(true)
      const data = await apiClient.getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error("Error loading employees:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateEmployee = async () => {
    try {
      await apiClient.createEmployee({
        ...newEmployeeForm,
        created_by: "Gustavo",
      })
      await loadEmployees()
      // Reset form
      setNewEmployeeForm({
        name: "",
        email: "",
        role: "",
        permissions: {
          clients: { create: false, read: true, update: false, delete: false },
          processes: { create: false, read: true, update: false, delete: false },
          financial: { create: false, read: true, update: false, delete: false },
          employees: { create: false, read: false, update: false, delete: false },
        },
      })
      alert("Funcionário cadastrado com sucesso!")
    } catch (error) {
      console.error("Error creating employee:", error)
      alert("Erro ao cadastrar funcionário. Tente novamente.")
    }
  }

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setNewEmployeeForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module as keyof typeof prev.permissions],
          [action]: checked,
        },
      },
    }))
  }

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    setDeleteConfirmation({ show: true, employee })
  }

  const confirmDeleteEmployee = async () => {
    if (deleteConfirmation.employee) {
      try {
        await apiClient.deleteEmployee(deleteConfirmation.employee.id.toString())
        await loadEmployees()
        setDeleteConfirmation({ show: false, employee: null })
        alert("Funcionário excluído com sucesso!")
      } catch (error) {
        console.error("Error deleting employee:", error)
        alert("Erro ao excluir funcionário")
      }
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      Administrador: { color: "bg-red-100 text-red-800 border-red-200", icon: Shield },
      Advogado: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: UserCheck },
      Assistente: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: Users },
      Estagiário: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: UserCheck },
    }

    const config = roleConfig[role as keyof typeof roleConfig] || { color: "bg-slate-100 text-slate-800 border-slate-200", icon: Users }
    const Icon = config.icon

    return (
      <Badge className={`${config.color} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{role}</span>
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Ativo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">Inativo</Badge>
    )
  }

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <ModuleLoader />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center space-x-2">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Users className="h-6 w-6" />
                </div>
                <span>Gerenciamento de Equipe</span>
              </h2>
              <p className="text-slate-300 text-lg">Gerencie funcionários e suas permissões no sistema</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Total de funcionários</p>
              <p className="text-white font-semibold text-2xl">{employees.length}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <ModernStatsCard
            title="Total de Funcionários"
            value={employees.length.toString()}
            change="+12%"
            icon={Users}
            color="text-blue-600"
            bgColor="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <ModernStatsCard
            title="Funcionários Ativos"
            value={employees.filter(e => e.status === 'active').length.toString()}
            change="+5%"
            icon={UserCheck}
            color="text-emerald-600"
            bgColor="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <ModernStatsCard
            title="Novos este Mês"
            value="3"
            change="+25%"
            icon={TrendingUp}
            color="text-purple-600"
            bgColor="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <ModernStatsCard
            title="Cadastrados Hoje"
            value="0"
            change="0%"
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-gradient-to-br from-orange-500 to-orange-600"
          />
        </div>

        {/* Controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar funcionários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-slate-900 flex items-center space-x-2">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        <Plus className="h-5 w-5 text-slate-600" />
                      </div>
                      <span>Cadastrar Novo Funcionário</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  {/* ÁREA COM SCROLL - Container scrollável */}
                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-6 p-1">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-700 font-medium">Nome Completo *</Label>
                          <Input
                            placeholder="Nome do funcionário"
                            value={newEmployeeForm.name}
                            onChange={(e) => setNewEmployeeForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-700 font-medium">Email *</Label>
                          <Input
                            type="email"
                            placeholder="email@advocacia.com"
                            value={newEmployeeForm.email}
                            onChange={(e) => setNewEmployeeForm((prev) => ({ ...prev, email: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-slate-700 font-medium">Função *</Label>
                          <Select onValueChange={(value) => setNewEmployeeForm((prev) => ({ ...prev, role: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Advogado">Advogado</SelectItem>
                              <SelectItem value="Assistente">Assistente Jurídico</SelectItem>
                              <SelectItem value="Estagiário">Estagiário</SelectItem>
                              <SelectItem value="Secretário">Secretário</SelectItem>
                              <SelectItem value="Contador">Contador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-lg font-semibold text-slate-900">Permissões por Módulo</Label>
                        <div className="grid grid-cols-2 gap-6 mt-4">
                          {Object.entries(newEmployeeForm.permissions).map(([module, perms]) => (
                            <Card key={module} className="border border-slate-200">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm capitalize text-slate-800">
                                  {module === "clients"
                                    ? "Clientes"
                                    : module === "processes"
                                      ? "Processos"
                                      : module === "financial"
                                        ? "Financeiro"
                                        : "Funcionários"}
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                {Object.entries(perms).map(([action, checked]) => (
                                  <div key={action} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(checked) => handlePermissionChange(module, action, checked as boolean)}
                                    />
                                    <Label className="text-sm text-slate-700">
                                      {action === "create"
                                        ? "Criar"
                                        : action === "read"
                                          ? "Visualizar"
                                          : action === "update"
                                            ? "Editar"
                                            : "Excluir"}
                                    </Label>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* FOOTER FIXO - Sempre visível */}
                  <div className="flex-shrink-0 flex justify-end space-x-2 pt-6 border-t border-slate-200 mt-4">
                    <Button variant="outline">Cancelar</Button>
                    <Button 
                      onClick={handleCreateEmployee} 
                      className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                    >
                      Cadastrar Funcionário
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Employees Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-slate-900 flex items-center space-x-2">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <span>Lista de Funcionários ({filteredEmployees.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Nome</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Função</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Permissões</TableHead>
                    <TableHead className="font-semibold text-slate-700">Cadastrado por</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow key={employee.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <TableCell className="font-medium text-slate-900">{employee.name}</TableCell>
                      <TableCell className="text-slate-600">{employee.email}</TableCell>
                      <TableCell>{getRoleBadge(employee.role)}</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {employee.permissions &&
                            Object.entries(employee.permissions).map(([module, perms]) => {
                              const hasPermissions = perms && Object.values(perms).some((p) => p)
                              return hasPermissions ? (
                                <Badge key={module} variant="outline" className="text-xs border-slate-300 text-slate-600">
                                  {module === "clients"
                                    ? "Clientes"
                                    : module === "processes"
                                      ? "Processos"
                                      : module === "financial"
                                        ? "Financeiro"
                                        : "Funcionários"}
                                </Badge>
                              ) : null
                            })}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">{employee.created_by}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditEmployee(employee)}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmation.show}
          onOpenChange={(open) => setDeleteConfirmation({ show: open, employee: null })}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-slate-900">Confirmar Exclusão</DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              Tem certeza que deseja excluir o funcionário <span className="font-semibold">{deleteConfirmation.employee?.name}</span>?
            </p>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmation({ show: false, employee: null })}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDeleteEmployee}>
                Excluir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-slate-900 flex items-center space-x-2">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Edit className="h-5 w-5 text-slate-600" />
                </div>
                <span>Editar Funcionário - {editingEmployee?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            {/* ÁREA COM SCROLL */}
            <div className="flex-1 overflow-y-auto pr-2">
              {editingEmployee && (
                <div className="space-y-4 p-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-700 font-medium">Nome Completo</Label>
                      <Input defaultValue={editingEmployee.name} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Email</Label>
                      <Input defaultValue={editingEmployee.email} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Função</Label>
                      <Select defaultValue={editingEmployee.role}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Advogado">Advogado</SelectItem>
                          <SelectItem value="Assistente">Assistente Jurídico</SelectItem>
                          <SelectItem value="Estagiário">Estagiário</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-slate-700 font-medium">Status</Label>
                      <Select defaultValue={editingEmployee.status}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* FOOTER FIXO */}
            <div className="flex-shrink-0 flex justify-end space-x-2 pt-6 border-t border-slate-200 mt-4">
              <Button variant="outline" onClick={() => setEditingEmployee(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  alert("Funcionário atualizado com sucesso!")
                  setEditingEmployee(null)
                }}
                className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
              >
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
