// lib/services/entityService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { EntitySchema, EntityUpdateSchema } from "@/lib/schemas"; // Importação do schema centralizado

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
 */
export async function createEntity(entityData: unknown) {
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
  return data;
}

/**
 * Atualiza uma entidade existente.
 * @param id - O ID da entidade a ser atualizada.
 * @param entityData - Os novos dados da entidade.
 */
export async function updateEntity(id: string, entityData: unknown) {
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
  return data;
}

/**
 * Deleta uma entidade.
 * @param id - O ID da entidade a ser deletada.
 */
export async function deleteEntity(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("entities").delete().eq("id", id);

  if (error) {
    console.error(`Erro ao deletar entidade ${id}:`, error.message);
    throw new Error("Não foi possível deletar a entidade.");
  }
  return { message: "Entidade excluída com sucesso." };
}