// components/employee-management.tsx - VERSÃO IMPLEMENTADA

"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const fetchEmployees = async () => {
  return apiClient.getEmployees();
};

export function EmployeeManagement() {
  const { data: employees, isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  if (isLoading) return <div>Carregando equipe...</div>;
  if (isError) return <div>Erro ao carregar equipe: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Equipe</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees && employees.length > 0 ? (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="flex items-center gap-2">
                    <Avatar>
                        <AvatarImage src={employee.avatar_url || ''} />
                        <AvatarFallback>{employee.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {employee.name}
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.roles?.name || 'Não definido'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Nenhum membro da equipe encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}