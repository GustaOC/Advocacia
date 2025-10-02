// components/employee-management.tsx 
"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2, Users, TrendingUp, Shield, Award } from "lucide-react";

const fetchEmployees = async () => {
  return apiClient.getEmployees();
};

function EmployeeStats({ employees }: { employees: any[] }) {
  const stats = [
    { label: "Total de Membros", value: employees.length.toString(), icon: Users, color: "text-blue-600", bg: "from-blue-50 to-blue-100", trend: "+5%" },
    { label: "Administradores", value: employees.filter(e => e.roles?.name?.toLowerCase().includes('admin')).length.toString(), icon: Shield, color: "text-purple-600", bg: "from-purple-50 to-purple-100", trend: "+2%" },
    { label: "Advogados", value: employees.filter(e => e.roles?.name?.toLowerCase().includes('advogado')).length.toString(), icon: Award, color: "text-green-600", bg: "from-green-50 to-green-100", trend: "+8%" },
    { label: "Equipe Ativa", value: employees.length.toString(), icon: TrendingUp, color: "text-orange-600", bg: "from-orange-50 to-orange-100", trend: "100%" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const StatIcon = stat.icon;
        return (
          <Card key={index} className="group hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border-0 bg-white relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bg} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start justify-between">
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

export function EmployeeManagement() {
  const { data: employees, isLoading, isError, error } = useQuery({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto" />
          <p className="text-slate-600 font-medium">Carregando equipe...</p>
        </div>
      </div>
    );
  }

  if (isError) return <div>Erro ao carregar equipe: {error.message}</div>;

  return (
    <div className="space-y-6">
      <div className="relative bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-10"></div>
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3">Gerenciamento de Equipe</h2>
          <p className="text-slate-100 text-xl">Visualize e gerencie os membros da sua equipe jurídica.</p>
        </div>
      </div>

      {employees && <EmployeeStats employees={employees} />}

      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <CardTitle className="text-2xl font-bold text-slate-900">Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200">
                <TableHead className="text-slate-700 font-bold">Membro</TableHead>
                <TableHead className="text-slate-700 font-bold">Email</TableHead>
                <TableHead className="text-slate-700 font-bold">Cargo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees && employees.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee.id} className="group hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-transparent transition-all duration-200">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative group-hover:scale-110 transition-transform">
                          <Avatar className="ring-2 ring-slate-200 group-hover:ring-slate-400 transition-all">
                            <AvatarImage src={employee.avatar_url || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white font-bold">
                              {employee.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <span className="font-medium group-hover:text-slate-700 transition-colors">{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{employee.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300">
                        {employee.roles?.name || 'Não definido'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-16">
                    <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">Nenhum membro encontrado</h3>
                    <p className="text-slate-500">Não há membros da equipe cadastrados no momento.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}