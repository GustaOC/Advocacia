// lib/services/caseService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema, CaseUpdateSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Busca todos os casos, incluindo as partes (entidades) associadas.
 */
export async function getCases() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      case_parties (
        role,
        entities (
          id,
          name,
          document
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar casos:", error.message);
    throw new Error("Não foi possível buscar os casos.");
  }
  return data;
}

/**
 * Busca um caso específico pelo ID, incluindo as partes associadas.
 * @param id - O ID do caso.
 */
export async function getCaseById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cases")
    .select(`
      *,
      case_parties (
        role,
        entities (*)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Nenhum caso encontrado
      return null;
    }
    console.error(`Erro ao buscar caso ${id}:`, error.message);
    throw new Error("Não foi possível buscar o caso.");
  }
  return data;
}

/**
 * Cria um novo caso.
 * @param caseData - Os dados do novo caso.
 * @param user - O usuário autenticado que está realizando a ação.
 */
export async function createCase(caseData: unknown, user: AuthUser) {
  const parsedData = CaseSchema.parse(caseData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cases")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Violação de unicidade
      throw new Error("Já existe um caso com este número de processo.");
    }
    console.error("Erro ao criar caso:", error.message);
    throw new Error("Não foi possível criar o caso.");
  }

  // Log de auditoria
  await logAudit('CASE_CREATE', user, { caseId: data.id, title: data.title });

  return data;
}

/**
 * Atualiza um caso existente.
 * @param id - O ID do caso a ser atualizado.
 * @param caseData - Os novos dados para o caso.
 * @param user - O usuário autenticado que está realizando a ação.
 */
export async function updateCase(id: string, caseData: unknown, user: AuthUser) {
  const parsedData = CaseUpdateSchema.parse(caseData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cases")
    .update(parsedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar caso ${id}:`, error.message);
    throw new Error("Não foi possível atualizar o caso.");
  }

  // Log de auditoria
  await logAudit('CASE_UPDATE', user, { caseId: data.id, updatedFields: Object.keys(parsedData) });

  return data;
}