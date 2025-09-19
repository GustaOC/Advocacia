// components/clients-module.tsx
"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Edit, Trash2, Loader2, Users, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
// Futuramente, criar um modal de cliente: import { ClientModal } from "./client-modal";

interface Client {
  id: number;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export function ClientsModule() {
  const [searchTerm, setSearchTerm] = useState("");
  const { can } = useAuth();
  const { toast } = useToast();
  
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => apiClient.getEntities(), // Assumindo que getEntities busca clientes
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      (client.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.document || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm]);

  const handleAddNew = () => {
    // setSelectedClient(null);
    // setIsModalOpen(true);
    toast({ title: "Funcionalidade em desenvolvimento", description: "O modal para adicionar/editar clientes será implementado em breve." });
  };

  if (isLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Gestão de Clientes</h2>
        <p className="text-slate-300 text-lg">Centralize as informações de todos os seus clientes.</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6 flex flex-col md:flex-row gap-4 justify-between">
          <Input
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <div className="flex gap-2">
            {can('clients_import') && (
              <Button variant="outline" disabled><Upload className="mr-2 h-4 w-4" /> Importar</Button>
            )}
            {can('clients_create') && (
              <Button onClick={handleAddNew} className="bg-slate-800 hover:bg-slate-900"><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="font-mono text-sm">{client.document || '-'}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{client.email || '-'}</span>
                      <span className="text-xs text-slate-500">{client.phone || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>{client.city && client.state ? `${client.city} - ${client.state}` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={handleAddNew}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => toast({ title: "Funcionalidade em desenvolvimento", variant: "destructive" })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* O modal de cliente será adicionado aqui futuramente 
        <ClientModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} clientData={selectedClient} />
      */}
    </div>
  );
}