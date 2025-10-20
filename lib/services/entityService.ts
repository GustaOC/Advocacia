// lib/services/entityService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { EntitySchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Sanitiza payload para colunas existentes no banco.
 * - Remove campos ainda não migrados (ex.: birth_date)
 * - Mapeia 'district' (UI) para 'neighborhood' (DB atual)
 */
function toDbEntity(input: any) {
  if (!input || typeof input !== 'object') return {};
  const out: any = {};

  // Mapeamento direto de campos comuns
  const ALLOWED = [
    'id','name','document','type',
    'email','cellphone1','cellphone2','phone',
    'address','address_number',
    /* usamos neighborhood no DB; 'district' vem da UI */
    'city','state','zip_code','observations'
  ] as const;

  for (const k of ALLOWED) {
    if (input[k] !== undefined) out[k] = input[k];
  }

  // CORREÇÃO APLICADA AQUI
  // district -> neighborhood (mantemos apenas a coluna existente no DB)
  if (input.district !== undefined && out.neighborhood === undefined) {
    out.neighborhood = input.district;
  }
  // Se vier neighborhood diretamente, mantemos
  if (input.neighborhood !== undefined) {
    out.neighborhood = input.neighborhood;
  }

  // Campos ainda não migrados no DB: ignorar para não quebrar o insert/update
  // birth_date será adicionado via migração futura
  // quaisquer extras também são ignorados

  return out;
}


/**
 * Busca todas as entidades no banco de dados.
 */
export async function getEntities() {
  const supabase = createAdminClient();

  // Buscar TODAS as entidades sem limite (paginação manual se necessário)
  let allData: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error, count } = await supabase
      .from("entities")
      .select("*", { count: 'exact' })
      .order("name", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("Erro ao buscar entidades:", error.message);
      throw new Error("Não foi possível buscar as entidades.");
    }

    if (data) {
      allData = allData.concat(data);
      from += pageSize;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`[entityService.getEntities] Total carregado: ${allData.length} entidades`);
  return allData;
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
  const dbData = toDbEntity(parsedData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entities")
    .insert(dbData)
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
  const parsedData = EntitySchema.partial().parse(entityData);
  const dbData = toDbEntity(parsedData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("entities")
    .update(dbData)
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