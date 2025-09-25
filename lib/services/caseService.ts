// lib/services/caseService.ts - VERSÃO COM CORREÇÃO DE TIPO
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema, CaseUpdateSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

/**
 * Busca casos com paginação, incluindo as partes (entidades) associadas.
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
    console.error("Erro ao buscar casos:", error);
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
    console.error(`Erro ao buscar caso ${id}:`, error);
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
      console.error("Erro ao criar caso:", caseError);
      if (caseError.code === '23505') {
        throw new Error("Já existe um caso com este número de processo.");
      }
      throw new Error("Não foi possível criar o caso.");
    }

    const partiesToInsert = [
      { case_id: newCase.id, entity_id: client_entity_id, role: 'Cliente' },
      { case_id: newCase.id, entity_id: executed_entity_id, role: 'Executado' }
    ];

    const { error: partiesError } = await supabase.from('case_parties').insert(partiesToInsert);

    if (partiesError) {
      console.error(`ERRO CRÍTICO: Caso ${newCase.id} criado, mas falha ao associar partes. Rollback.`, partiesError);
      await supabase.from('cases').delete().eq('id', newCase.id);
      throw new Error("Não foi possível associar as partes ao caso. A operação foi desfeita.");
    }

    await logAudit('CASE_CREATE', user, { caseId: newCase.id, title: newCase.title });

    await supabase.from('case_status_history').insert({
      case_id: newCase.id,
      new_main_status: newCase.status,
      changed_by_user_id: user.id,
      changed_by_user_email: user.email,
      notes: 'Caso criado no sistema.'
    });

    if (newCase.status === 'Acordo' && newCase.agreement_value && newCase.agreement_type) {
        const agreementData = {
            case_id: newCase.id, client_entity_id,
            agreement_type: newCase.agreement_type, total_value: newCase.agreement_value,
            entry_value: newCase.down_payment || 0, installments: newCase.installments || 1,
            status: 'active' as const, notes: `Acordo criado junto com o caso #${newCase.id}.`
        };
        const { error: agreementError } = await supabase.from('financial_agreements').insert(agreementData);
        if (agreementError) console.error(`Erro ao criar acordo financeiro para o caso ${newCase.id}:`, agreementError);
        else console.log(`Acordo financeiro criado com sucesso para o caso ${newCase.id}`);
    }

    const { data: createdCaseWithParties } = await supabase.from("cases").select(`*, case_parties(role, entities(id, name))`).eq('id', newCase.id).single();
    return createdCaseWithParties;
}

/**
 * Atualiza um caso existente e sincroniza com financial_agreements quando necessário.
 */
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseUpdateSchema.parse(caseData);
    const supabase = createAdminClient();

    const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select("*, case_parties(role, entities(id))")
        .eq("id", id).single();

    if (fetchError || !currentCase) {
        console.error(`Erro ao buscar caso ${id} antes de atualizar:`, fetchError);
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

    if (parsedData.status && parsedData.status !== 'Acordo') {
        Object.assign(parsedData, { agreement_type: null, agreement_value: null, installments: null, down_payment: null, installment_due_date: null });
    }

    const { data: updatedCase, error: updateError } = await supabase
        .from("cases")
        .update(parsedData)
        .eq("id", id)
        .select('*')
        .single();

    if (updateError) {
        console.error(`Erro ao atualizar caso ${id}:`, updateError);
        throw new Error("Não foi possível atualizar o caso.");
    }
    
    console.log('[caseService] Dados antes da atualização:', currentCase);
    console.log('[caseService] Dados após a atualização:', updatedCase);

    const statusChanged = currentCase.status !== updatedCase.status;
    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id, previous_main_status: currentCase.status, new_main_status: updatedCase.status,
            changed_by_user_id: user.id, changed_by_user_email: user.email,
        });
    }

    const clientParty = currentCase.case_parties.find((p: any) => p.role === 'Cliente');
    // ✅ CORREÇÃO DE TIPO APLICADA AQUI
    const clientEntityId = clientParty?.entities?.id;

    if (clientEntityId) {
        const { data: existingAgreement } = await supabase.from('financial_agreements').select('id').eq('case_id', id).single();
        console.log(`[caseService] Verificando acordo para caso ${id}. Existente:`, !!existingAgreement);

        const hasAgreementData = updatedCase.agreement_value && updatedCase.agreement_type;

        // Cenário 1: Status mudou para 'Acordo' e não existia acordo antes
        if (statusChanged && updatedCase.status === 'Acordo' && hasAgreementData && !existingAgreement) {
            console.log(`[caseService] Cenário 1: Status mudou para 'Acordo', criando acordo.`);
            const { error } = await supabase.from('financial_agreements').insert({
                case_id: updatedCase.id, client_entity_id: clientEntityId, agreement_type: updatedCase.agreement_type!,
                total_value: updatedCase.agreement_value, entry_value: updatedCase.down_payment || 0,
                installments: updatedCase.installments || 1, status: 'active' as const, notes: `Acordo gerado a partir da atualização do caso #${updatedCase.id}.`
            });
            if (error) console.error(`Erro ao criar acordo (Cenário 1):`, error); else console.log(`Acordo criado (Cenário 1) para caso ${id}`);
        } 
        // Cenário 2: Status continua 'Acordo', acordo já existe, valores mudaram
        else if (!statusChanged && updatedCase.status === 'Acordo' && existingAgreement && hasAgreementData) {
            console.log(`[caseService] Cenário 2: Status 'Acordo' mantido, atualizando acordo existente.`);
            const valuesChanged = currentCase.agreement_value !== updatedCase.agreement_value || currentCase.agreement_type !== updatedCase.agreement_type || currentCase.installments !== updatedCase.installments || currentCase.down_payment !== updatedCase.down_payment;
            console.log(`[caseService] Valores do acordo mudaram: ${valuesChanged}`);
            if (valuesChanged) {
                const { error } = await supabase.from('financial_agreements').update({
                    agreement_type: updatedCase.agreement_type!, total_value: updatedCase.agreement_value,
                    entry_value: updatedCase.down_payment || 0, installments: updatedCase.installments || 1,
                    updated_at: new Date().toISOString()
                }).eq('id', existingAgreement.id);
                if (error) console.error(`Erro ao atualizar acordo (Cenário 2):`, error); else console.log(`Acordo atualizado (Cenário 2) para caso ${id}`);
            }
        } 
        // Cenário 3 (Fallback): Status é 'Acordo', mas acordo não existia. Criar.
        else if (!statusChanged && updatedCase.status === 'Acordo' && !existingAgreement && hasAgreementData) {
            console.log(`[caseService] Cenário de Fallback: Status 'Acordo' mantido, mas acordo não existia. Criando...`);
            const { error } = await supabase.from('financial_agreements').insert({
                case_id: updatedCase.id, client_entity_id: clientEntityId, agreement_type: updatedCase.agreement_type!,
                total_value: updatedCase.agreement_value, entry_value: updatedCase.down_payment || 0,
                installments: updatedCase.installments || 1, status: 'active' as const, notes: `Acordo criado a partir da atualização do caso #${updatedCase.id} (lógica de fallback).`
            });
            if (error) console.error(`Erro ao criar acordo (Fallback):`, error); else console.log(`Acordo criado (Fallback) para caso ${id}`);
        } 
        // Cenário 4: Status mudou DE 'Acordo' para outro
        else if (statusChanged && currentCase.status === 'Acordo' && updatedCase.status !== 'Acordo' && existingAgreement) {
            console.log(`[caseService] Cenário 4: Status mudou de 'Acordo', cancelando acordo.`);
            const { error } = await supabase.from('financial_agreements').update({ status: 'cancelled', updated_at: new Date().toISOString(), notes: `Acordo cancelado devido à mudança de status do caso para ${updatedCase.status}` }).eq('id', existingAgreement.id);
            if (error) console.error(`Erro ao cancelar acordo (Cenário 4):`, error); else console.log(`Acordo cancelado (Cenário 4) para caso ${id}`);
        } 
        // Cenário 5: Status voltou a ser 'Acordo'
        else if (statusChanged && updatedCase.status === 'Acordo' && existingAgreement && hasAgreementData) {
            console.log(`[caseService] Cenário 5: Status voltou para 'Acordo', reativando acordo.`);
            const { error } = await supabase.from('financial_agreements').update({
                agreement_type: updatedCase.agreement_type!, total_value: updatedCase.agreement_value,
                entry_value: updatedCase.down_payment || 0, installments: updatedCase.installments || 1,
                status: 'active' as const, updated_at: new Date().toISOString(), notes: `Acordo reativado`
            }).eq('id', existingAgreement.id);
            if (error) console.error(`Erro ao reativar acordo (Cenário 5):`, error); else console.log(`Acordo reativado (Cenário 5) para caso ${id}`);
        }
    } else {
        console.warn(`Caso ${updatedCase.id}: não foi possível encontrar a parte 'Cliente' para gerenciar registro financeiro.`);
    }

    await logAudit('CASE_UPDATE', user, { caseId: updatedCase.id, updatedFields: Object.keys(parsedData) });
    return updatedCase;
}


/**
 * Busca o histórico de status de um caso.
 */
export async function getCaseHistory(caseId: number) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("case_status_history").select("*").eq("case_id", caseId).order("changed_at", { ascending: false });
    if (error) {
        console.error(`Erro ao buscar histórico do caso ${caseId}:`, error);
        throw new Error("Não foi possível buscar o histórico do caso.");
    }
    return data;
}