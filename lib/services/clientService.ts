// lib/services/clientService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { ClientSchema, ClientUpdateSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Busca todos os clientes no banco de dados.
 */
export async function getClients() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar clientes:", error.message);
    throw new Error("Não foi possível buscar os clientes.");
  }
  return data;
}

/**
 * Busca um cliente específico pelo seu ID.
 * @param id - O ID do cliente.
 */
export async function getClientById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Código para "nenhuma linha encontrada"
      return null;
    }
    console.error(`Erro ao buscar cliente ${id}:`, error.message);
    throw new Error("Não foi possível buscar o cliente.");
  }
  return data;
}

/**
 * Cria um novo cliente.
 * @param clientData - Os dados do novo cliente.
 * @param user - O usuário que está realizando a ação.
 */
export async function createClient(clientData: unknown, user: AuthUser) {
  const parsedData = ClientSchema.parse(clientData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Violação de unicidade
      throw new Error("Já existe um cliente com este email ou documento.");
    }
    console.error("Erro ao criar cliente:", error.message);
    throw new Error("Não foi possível criar o cliente.");
  }

  // Log de auditoria
  await logAudit('CLIENT_CREATE', user, { clientId: data.id, name: data.name });

  return data;
}

/**
 * Atualiza um cliente existente.
 * @param id - O ID do cliente a ser atualizado.
 * @param clientData - Os novos dados do cliente.
 * @param user - O usuário que está realizando a ação.
 */
export async function updateClient(id: string, clientData: unknown, user: AuthUser) {
  const parsedData = ClientUpdateSchema.parse(clientData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .update(parsedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar cliente ${id}:`, error.message);
    throw new Error("Não foi possível atualizar o cliente.");
  }

  // Log de auditoria
  await logAudit('CLIENT_UPDATE', user, { clientId: data.id, name: data.name, updatedFields: Object.keys(parsedData) });

  return data;
}

/**
 * Deleta um cliente.
 * @param id - O ID do cliente a ser deletado.
 * @param user - O usuário que está realizando a ação.
 */
export async function deleteClient(id: string, user: AuthUser) {
  const supabase = createAdminClient();
  
  const clientToDelete = await getClientById(id);
  if (!clientToDelete) {
    throw new Error("Cliente não encontrado para exclusão.");
  }

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    console.error(`Erro ao deletar cliente ${id}:`, error.message);
    throw new Error("Não foi possível deletar o cliente.");
  }

  // Log de auditoria
  await logAudit('CLIENT_DELETE', user, { clientId: clientToDelete.id, name: clientToDelete.name });

  return { message: "Cliente excluído com sucesso." };
}