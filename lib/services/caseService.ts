// lib/services/caseService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema, CaseUpdateSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Busca casos com paginação, incluindo as partes (entidades) associadas.
 * @param page - O número da página a ser buscada.
 * @param limit - O número de itens por página.
 */
export async function getCases(page: number = 1, limit: number = 10) {
  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
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
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Erro ao buscar casos:", error.message);
    throw new Error("Não foi possível buscar os casos.");
  }
  return { data: data || [], count: count || 0 };
}

/**
 * Busca um caso específico pelo ID, incluindo as partes associadas.
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

    const partiesToInsert = [
      { case_id: newCase.id, entity_id: client_entity_id, role: 'Cliente' },
      { case_id: newCase.id, entity_id: executed_entity_id, role: 'Executado' }
    ];
  
    const { error: partiesError } = await supabase
      .from('case_parties')
      .insert(partiesToInsert);
  
    if (partiesError) {
      console.error(`ERRO CRÍTICO: Caso ${newCase.id} criado, mas falha ao associar partes. Fazendo rollback.`, partiesError.message);
      await supabase.from('cases').delete().eq('id', newCase.id);
      throw new Error("Não foi possível associar as partes ao caso. A operação foi desfeita.");
    }
  
    await logAudit('CASE_CREATE', user, { caseId: newCase.id, title: newCase.title });
    
    await supabase.from('case_status_history').insert({
      case_id: newCase.id,
      new_main_status: newCase.status, // Corrigido
      new_status_reason: newCase.status_reason,
      changed_by_user_id: user.id,
      changed_by_user_email: user.email,
      notes: 'Caso criado no sistema.'
    });

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

    const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select("status, status_reason") // Corrigido
        .eq("id", id)
        .single();

    if (fetchError) {
        console.error(`Erro ao buscar caso ${id} antes de atualizar:`, fetchError.message);
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

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
    
    const statusChanged = currentCase.status !== updatedCase.status || currentCase.status_reason !== updatedCase.status_reason;

    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id,
            previous_main_status: currentCase.status, // Corrigido
            new_main_status: updatedCase.status,       // Corrigido
            previous_status_reason: currentCase.status_reason,
            new_status_reason: updatedCase.status_reason,
            changed_by_user_id: user.id,
            changed_by_user_email: user.email,
        });
    }

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