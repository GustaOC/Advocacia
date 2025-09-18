// lib/services/entityService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { EntitySchema, EntityUpdateSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Busca todas as entidades no banco de dados.
 */
export async function getEntities() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Erro ao buscar entidades:", error.message);
    throw new Error("Não foi possível buscar as entidades.");
  }
  return data;
}

/**
 * Busca uma entidade específica pelo seu ID.
 * @param id - O ID da entidade.
 */
export async function getEntityById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Código para "nenhuma linha encontrada"
      return null;
    }
    console.error(`Erro ao buscar entidade ${id}:`, error.message);
    throw new Error("Não foi possível buscar a entidade.");
  }
  return data;
}

/**
 * Cria uma nova entidade.
 * @param entityData - Os dados da nova entidade.
 * @param user - O usuário que está realizando a ação.
 */
export async function createEntity(entityData: unknown, user: AuthUser) {
  const parsedData = EntitySchema.parse(entityData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entities")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Violação de unicidade
      throw new Error("Já existe uma entidade com este email ou documento.");
    }
    console.error("Erro ao criar entidade:", error.message);
    throw new Error("Não foi possível criar a entidade.");
  }

  // Log de auditoria
  await logAudit('ENTITY_CREATE', user, { entityId: data.id, name: data.name });

  return data;
}

/**
 * Atualiza uma entidade existente.
 * @param id - O ID da entidade a ser atualizada.
 * @param entityData - Os novos dados da entidade.
 * @param user - O usuário que está realizando a ação.
 */
export async function updateEntity(id: string, entityData: unknown, user: AuthUser) {
  const parsedData = EntityUpdateSchema.parse(entityData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entities")
    .update(parsedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar entidade ${id}:`, error.message);
    throw new Error("Não foi possível atualizar a entidade.");
  }

  // Log de auditoria
  await logAudit('ENTITY_UPDATE', user, { entityId: data.id, name: data.name, updatedFields: Object.keys(parsedData) });

  return data;
}

/**
 * Deleta uma entidade.
 * @param id - O ID da entidade a ser deletada.
 * @param user - O usuário que está realizando a ação.
 */
export async function deleteEntity(id: string, user: AuthUser) {
  const supabase = createAdminClient();
  
  // Primeiro, busca os dados da entidade para o log
  const entityToDelete = await getEntityById(id);
  if (!entityToDelete) {
    throw new Error("Entidade não encontrada para exclusão.");
  }

  const { error } = await supabase.from("entities").delete().eq("id", id);

  if (error) {
    console.error(`Erro ao deletar entidade ${id}:`, error.message);
    throw new Error("Não foi possível deletar a entidade.");
  }

  // Log de auditoria
  await logAudit('ENTITY_DELETE', user, { entityId: entityToDelete.id, name: entityToDelete.name });

  return { message: "Entidade excluída com sucesso." };
}