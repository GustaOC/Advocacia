// lib/services/caseService.ts - VERSÃO COMPLETA E CORRIGIDA

import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

const CaseCreateSchema = CaseSchema.extend({
  client_entity_id: z.number(),
  executed_entity_id: z.number(),
});

export async function getCases(page: number = 1, limit: number = 10) {
  const supabase = createAdminClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from("cases")
    .select(`*, case_parties (role, entity_id, entities:entity_id (id, name, document))`, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Erro ao buscar casos:", error);
    throw new Error("Não foi possível buscar os casos.");
  }
  
  const normalizedData = (data || []).map(caseItem => ({
    ...caseItem,
    case_parties: caseItem.case_parties.map((party: any) => ({
      role: party.role,
      entities: party.entities
    }))
  }));
  
  return { data: normalizedData, count: count || 0 };
}

export async function getCaseById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cases")
    .select(`*, case_parties (role, entity_id, entities:entity_id (*))`)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(`Erro ao buscar caso ${id}:`, error);
    throw new Error("Não foi possível buscar o caso.");
  }
  
  if (data) {
    data.case_parties = data.case_parties.map((party: any) => ({
      role: party.role,
      entities: party.entities
    }));
  }
  
  return data;
}

export async function createCase(caseData: unknown, user: AuthUser) {
    const { client_entity_id, executed_entity_id, ...restOfCaseData } = CaseCreateSchema.parse(caseData);
    const supabase = createAdminClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert(restOfCaseData)
      .select()
      .single();

    if (caseError) {
      console.error("Erro ao criar caso:", caseError);
      if (caseError.code === '23505') throw new Error("Já existe um caso com este número de processo.");
      throw new Error("Não foi possível criar o caso.");
    }

    const partiesToInsert = [
      { case_id: newCase.id, entity_id: client_entity_id, role: 'Cliente' },
      { case_id: newCase.id, entity_id: executed_entity_id, role: 'Executado' }
    ];

    const { error: partiesError } = await supabase.from('case_parties').insert(partiesToInsert);

    if (partiesError) {
      console.error(`ERRO CRÍTICO: Rollback do caso ${newCase.id} por falha ao associar partes.`, partiesError);
      await supabase.from('cases').delete().eq('id', newCase.id);
      throw new Error("Não foi possível associar as partes ao caso. A operação foi desfeita.");
    }

    await logAudit('CASE_CREATE', user, { caseId: newCase.id, title: newCase.title });

    await supabase.from('case_status_history').insert({
      case_id: newCase.id, new_main_status: newCase.status,
      changed_by_user_id: user.id, changed_by_user_email: user.email,
      notes: 'Caso criado no sistema.'
    });

    if (newCase.status === 'Acordo' && newCase.agreement_value && newCase.agreement_type) {
        const agreementData = {
            case_id: newCase.id, 
            debtor_id: client_entity_id,
            agreement_type: newCase.agreement_type, 
            total_amount: newCase.agreement_value,
            down_payment: newCase.down_payment || 0, 
            number_of_installments: newCase.installments || 1,
            start_date: newCase.installment_due_date || new Date().toISOString(),
            status: 'active' as const, 
            notes: `Acordo criado junto com o caso #${newCase.id}.`
        };
        const { error: agreementError } = await supabase.from('financial_agreements').insert(agreementData);
        if (agreementError) {
            console.error(`Erro ao criar acordo financeiro inicial para o caso ${newCase.id}:`, agreementError);
        }
    }

    const { data: createdCaseWithParties } = await supabase
      .from("cases").select(`*, case_parties (role, entity_id, entities:entity_id (id, name))`)
      .eq('id', newCase.id).single();
    
    if (createdCaseWithParties) {
      createdCaseWithParties.case_parties = createdCaseWithParties.case_parties.map((party: any) => ({
        role: party.role,
        entities: party.entities
      }));
    }
    
    return createdCaseWithParties;
}

export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseSchema.partial().parse(caseData);
    const supabase = createAdminClient();

    const { data: currentCase, error: fetchError } = await supabase
        .from("cases").select(`*, case_parties (role, entity_id)`)
        .eq("id", id).single();

    if (fetchError || !currentCase) {
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

    const { data: updatedCase, error: updateError } = await supabase
        .from("cases").update(parsedData).eq("id", id).select('*').single();

    if (updateError) {
        throw new Error("Não foi possível atualizar o caso.");
    }
    
    const statusChanged = currentCase.status !== updatedCase.status;
    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id, previous_main_status: currentCase.status, new_main_status: updatedCase.status,
            changed_by_user_id: user.id, changed_by_user_email: user.email,
        });
    }

    const clientParty = currentCase.case_parties.find((p: any) => p.role === 'Cliente');
    const clientEntityId = clientParty?.entity_id;

    if (!clientEntityId) {
        console.warn(`[caseService.updateCase] Cliente não encontrado para o caso ${id}. Ações financeiras ignoradas.`);
        return updatedCase;
    }

    const { data: existingAgreement } = await supabase
        .from('financial_agreements').select('id, status').eq('case_id', id).maybeSingle();

    const hasAgreementData = updatedCase.agreement_value && updatedCase.agreement_type;

    if (updatedCase.status === 'Acordo' && hasAgreementData) {
        const agreementPayload = {
            case_id: id,
            debtor_id: clientEntityId,
            agreement_type: updatedCase.agreement_type,
            total_amount: Number(updatedCase.agreement_value),
            down_payment: Number(updatedCase.down_payment) || 0,
            number_of_installments: Number(updatedCase.installments) || 1,
            start_date: updatedCase.installment_due_date || new Date().toISOString(),
        };

        if (existingAgreement) {
            console.log(`Atualizando acordo existente para o caso ${id}`);
            const { error } = await supabase
                .from('financial_agreements')
                .update({ ...agreementPayload, status: 'active' }) // Reativa caso esteja cancelado
                .eq('id', existingAgreement.id);
            if (error) console.error(`Erro ao ATUALIZAR acordo para o caso ${id}:`, error);
        } else {
            console.log(`Criando NOVO acordo para o caso ${id}`);
            const { error } = await supabase
                .from('financial_agreements')
                .insert({ ...agreementPayload, status: 'active', notes: `Acordo gerado a partir do caso #${id}.` });
            if (error) console.error(`Erro ao CRIAR acordo para o caso ${id}:`, error);
        }
    } else if (statusChanged && currentCase.status === 'Acordo' && existingAgreement) {
        console.log(`Cancelando acordo para o caso ${id} pois o status mudou para ${updatedCase.status}`);
        await supabase.from('financial_agreements').update({ status: 'cancelled' }).eq('id', existingAgreement.id);
    }
    
    await logAudit('CASE_UPDATE', user, { caseId: updatedCase.id, updatedFields: Object.keys(parsedData) });
    return updatedCase;
}

export async function getCaseHistory(caseId: number) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from("case_status_history").select("*").eq("case_id", caseId).order("changed_at", { ascending: false });
    
    if (error) {
        console.error(`Erro ao buscar histórico do caso ${caseId}:`, error);
        throw new Error("Não foi possível buscar o histórico do caso.");
    }
    return data;
}