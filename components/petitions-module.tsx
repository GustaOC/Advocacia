// components/petitions-module.tsx 

"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { format } from "date-fns";

const fetchPetitions = async () => {
  return apiClient.getPetitions();
};

export function PetitionsModule() {
  const { data: petitions, isLoading, isError, error } = useQuery({
    queryKey: ["petitions"],
    queryFn: fetchPetitions,
  });

  if (isLoading) return <div>Carregando petições...</div>;
  if (isError) return <div>Erro ao carregar petições: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Petições</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Caso Associado</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data de Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {petitions && petitions.length > 0 ? (
              petitions.map((petition) => (
                <TableRow key={petition.id}>
                  <TableCell>{petition.cases?.title || 'N/A'}</TableCell>
                  <TableCell>{petition.employees?.name || 'N/A'}</TableCell>
                  <TableCell><Badge>{petition.status}</Badge></TableCell>
                  <TableCell>{format(new Date(petition.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Nenhuma petição encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}