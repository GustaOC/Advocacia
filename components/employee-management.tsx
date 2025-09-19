"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, PlusCircle } from "lucide-react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "./ui/skeleton"

const employeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  roleId: z.string().min(1, "Cargo é obrigatório"),
})

type EmployeeFormValues = z.infer<typeof employeeSchema>

export function EmployeeManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    data: employees,
    isLoading: isLoadingEmployees,
    error: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await apiClient.get("/employees")
      return response.data
    },
  })

  const {
    data: roles,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await apiClient.get("/roles")
      return response.data
    },
  })

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      roleId: "",
    },
  })

  useEffect(() => {
    if (selectedEmployee) {
      form.reset({
        name: selectedEmployee.user.name,
        email: selectedEmployee.user.email,
        roleId: selectedEmployee.role_id,
      })
    } else {
      form.reset({
        name: "",
        email: "",
        roleId: "",
      })
    }
  }, [selectedEmployee, form])

  const createEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormValues) =>
      apiClient.post("/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast({ title: "Funcionário criado com sucesso!" })
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error || "Ocorreu um erro ao criar o funcionário."
      toast({ title: "Erro", description: message, variant: "destructive" })
    },
  })

  const updateEmployeeMutation = useMutation({
    mutationFn: (data: EmployeeFormValues) =>
      apiClient.put(`/employees/${selectedEmployee.user.id}`, {
        ...data,
        roleId: data.roleId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      toast({ title: "Funcionário atualizado com sucesso!" })
      setIsModalOpen(false)
      setSelectedEmployee(null)
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.error ||
        "Ocorreu um erro ao atualizar o funcionário."
      toast({ title: "Erro", description: message, variant: "destructive" })
    },
  })

  const onSubmit = (data: EmployeeFormValues) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate(data)
    } else {
      createEmployeeMutation.mutate(data)
    }
  }

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setSelectedEmployee(null)
    form.reset()
    setIsModalOpen(true)
  }

  if (isLoadingEmployees || isLoadingRoles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Gerencie os funcionários e suas permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (employeesError || rolesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Gerencie os funcionários e suas permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            Erro ao carregar dados. Tente novamente mais tarde.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipe</CardTitle>
        <CardDescription>
          Gerencie os funcionários e suas permissões.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar Funcionário
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee: any) => (
              <TableRow key={employee.user.id}>
                <TableCell>{employee.user.name}</TableCell>
                <TableCell>{employee.user.email}</TableCell>
                <TableCell>{employee.role.name}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(employee)}>
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled
                        className="text-red-500"
                        // onClick={() => handleDelete(employee.id)}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Editar Funcionário" : "Novo Funcionário"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do funcionário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Email de acesso"
                        {...field}
                        disabled={!!selectedEmployee}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((role: any) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createEmployeeMutation.isPending ||
                    updateEmployeeMutation.isPending
                  }
                >
                  {selectedEmployee ? "Salvar Alterações" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}