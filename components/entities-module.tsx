// components/entities-module.tsx - VERSÃO IMPLEMENTADA

"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";

const fetchEntities = async () => {
  return apiClient.getEntities();
};

export function EntitiesModule() {
  const { data: entities, isLoading, isError, error } = useQuery({
    queryKey: ["entities"],
    queryFn: fetchEntities,
  });

  if (isLoading) return <div>Carregando entidades...</div>;
  if (isError) return <div>Erro ao carregar entidades: {error.message}</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Entidades</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities && entities.length > 0 ? (
              entities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell>{entity.name}</TableCell>
                  <TableCell>{entity.document}</TableCell>
                  <TableCell><Badge variant="outline">{entity.type}</Badge></TableCell>
                  <TableCell>{entity.email}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Nenhuma entidade encontrada.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}