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
export async function getCaseById(id: number) {
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

  // 3. Log de auditoria e histórico inicial
  await logAudit('CASE_CREATE', user, { caseId: newCase.id, title: newCase.title });
  await supabase.from('case_status_history').insert({
    case_id: newCase.id,
    new_main_status: newCase.main_status,
    new_status_reason: newCase.status_reason,
    changed_by_user_id: user.id,
    changed_by_user_email: user.email,
    notes: 'Caso criado no sistema.'
  });


  // Retorna o caso completo com os dados das partes para fácil atualização no frontend
  const { data: createdCaseWithParties } = await supabase
    .from("cases")
    .select(`*, case_parties(role, entities(id, name))`)
    .eq('id', newCase.id)
    .single();

  return createdCaseWithParties;
}

/**
 * Atualiza um caso existente e registra a mudança de status no histórico.
 */
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseUpdateSchema.parse(caseData);
    const supabase = createAdminClient();

    // 1. Busca o estado atual do caso antes de atualizar
    const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select("main_status, status_reason")
        .eq("id", id)
        .single();

    if (fetchError) {
        console.error(`Erro ao buscar caso ${id} antes de atualizar:`, fetchError.message);
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

    // 2. Atualiza o caso
    const { data: updatedCase, error: updateError } = await supabase
        .from("cases")
        .update(parsedData)
        .eq("id", id)
        .select()
        .single();

    if (updateError) {
        console.error(`Erro ao atualizar caso ${id}:`, updateError.message);
        throw new Error("Não foi possível atualizar o caso.");
    }

    // 3. Verifica se o status mudou e, se sim, registra no histórico
    const statusChanged = currentCase.main_status !== updatedCase.main_status || currentCase.status_reason !== updatedCase.status_reason;

    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id,
            previous_main_status: currentCase.main_status,
            new_main_status: updatedCase.main_status,
            previous_status_reason: currentCase.status_reason,
            new_status_reason: updatedCase.status_reason,
            changed_by_user_id: user.id,
            changed_by_user_email: user.email,
        });
    }

    // 4. Log de auditoria
    await logAudit('CASE_UPDATE', user, { caseId: updatedCase.id, updatedFields: Object.keys(parsedData) });

    return updatedCase;
}

/**
 * Busca o histórico de status de um caso.
 */
export async function getCaseHistory(caseId: number) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("case_status_history")
        .select("*")
        .eq("case_id", caseId)
        .order("changed_at", { ascending: false });

    if (error) {
        console.error(`Erro ao buscar histórico do caso ${caseId}:`, error.message);
        throw new Error("Não foi possível buscar o histórico do caso.");
    }

    return data;
}