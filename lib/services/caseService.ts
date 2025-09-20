// lib/services/caseService.ts - VERSÃO ATUALIZADA E COMPLETA
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
 */
export async function getCaseById(id: number, user: AuthUser) {
  const supabase = createAdminClient();
  
  const query = supabase
    .from("cases")
    .select(`
      *,
      case_parties (
        role,
        entities (*)
      )
    `)
    .eq("id", id);

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`Erro ao buscar caso ${id}:`, error.message);
    throw new Error("Não foi possível buscar o caso.");
  }
  return data;
}

/**
 * Cria um novo caso e associa as partes (cliente e executado).
 * @param caseData - Os dados do novo caso, incluindo os IDs das entidades.
 * @param user - O usuário autenticado que está realizando a ação.
 */
export async function createCase(caseData: unknown, user: AuthUser) {
  const { client_entity_id, executed_entity_id, ...restOfCaseData } = CaseSchema.parse(caseData);
  
  const supabase = createAdminClient();

  // 1. Insere os dados principais na tabela 'cases'
  const { data: newCase, error: caseError } = await supabase
    .from("cases")
    .insert(restOfCaseData)
    .select()
    .single();

  if (caseError) {
    console.error("Erro ao criar caso:", caseError.message);
    if (caseError.code === '23505') {
      throw new Error("Já existe um caso com este número de processo.");
    }
    throw new Error("Não foi possível criar o caso.");
  }

  // 2. Associa as partes na tabela 'case_parties'
  const partiesToInsert = [
    { case_id: newCase.id, entity_id: client_entity_id, role: 'Cliente' },
    { case_id: newCase.id, entity_id: executed_entity_id, role: 'Executado' } // ou 'Parte Contrária'
  ];

  const { error: partiesError } = await supabase
    .from('case_parties')
    .insert(partiesToInsert);

  if (partiesError) {
    console.error(`ERRO CRÍTICO: Caso ${newCase.id} criado, mas falha ao associar partes. Fazendo rollback.`, partiesError.message);
    await supabase.from('cases').delete().eq('id', newCase.id);
    throw new Error("Não foi possível associar as partes ao caso. A operação foi desfeita.");
  }

  // Log de auditoria
  await logAudit('CASE_CREATE', user, { caseId: newCase.id, title: newCase.title });

  // Retorna o caso completo com os dados das partes para fácil atualização no frontend
  const { data: createdCaseWithParties } = await supabase
    .from("cases")
    .select(`*, case_parties(role, entities(id, name))`)
    .eq('id', newCase.id)
    .single();
    
  return createdCaseWithParties;
}

/**
 * Atualiza um caso existente.
 */
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
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