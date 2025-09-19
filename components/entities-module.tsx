// components/entities-module.tsx - VERSÃO COM PASTA VIRTUAL DO CLIENTE

"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Plus, Search, User, FolderOpen, ArrowLeft } from "lucide-react";
import { ClientDetailView } from "./client-detail-view"; // Importando a nova visão de detalhes

// Tipagem para Cliente
interface Client {
  id: string; // O ID deve ser string para ser mais flexível (ex: UUID)
  name: string;
  document: string;
  type: string;
  email: string;
}

export function EntitiesModule() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients = [], isLoading, isError, error } = useQuery<Client[]>({
    queryKey: ["entities"], // A chave da query continua a mesma para buscar os dados
    queryFn: apiClient.getEntities,
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.document.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <div>Carregando clientes...</div>;
  if (isError) return <div>Erro ao carregar clientes: {(error as Error).message}</div>;

  // Se um cliente for selecionado, renderiza a nova tela de detalhes
  if (selectedClient) {
    return (
      <div>
        <Button variant="outline" onClick={() => setSelectedClient(null)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a Lista de Clientes
        </Button>
        <ClientDetailView client={selectedClient} />
      </div>
    );
  }

  // Tela principal com a lista de clientes
  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Clientes</h2>
        <p className="text-slate-300 text-lg">Acesse a pasta virtual de cada cliente para ver processos e documentos.</p>
      </div>

       <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex justify-between items-center">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Buscar por nome ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Button className="h-11 bg-slate-800 hover:bg-slate-900">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </CardContent>
      </Card>
      
      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedClient(client)}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-500" />
                    {client.name}
                  </TableCell>
                  <TableCell className="font-mono">{client.document}</TableCell>
                  <TableCell>{client.email}</TableCell>
                   <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedClient(client)}>
                      <FolderOpen className="mr-2 h-4 w-4"/>
                      Abrir Pasta
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}