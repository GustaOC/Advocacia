// lib/services/caseService.ts - VERSÃO CORRIGIDA
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
      new_main_status: newCase.status,
      changed_by_user_id: user.id,
      changed_by_user_email: user.email,
      notes: 'Caso criado no sistema.'
    });

    // 🆕 Se o caso já for criado com status 'Acordo', criar registro financeiro
    if (newCase.status === 'Acordo' && newCase.agreement_value && newCase.agreement_type) {
        const agreementData = {
            case_id: newCase.id,
            client_entity_id: client_entity_id,
            agreement_type: newCase.agreement_type,
            total_value: newCase.agreement_value,
            entry_value: newCase.down_payment || 0,
            installments: newCase.installments || 1,
            status: 'active' as const,
            notes: `Acordo criado junto com o caso #${newCase.id}.`
        };
        
        const { error: agreementError } = await supabase
            .from('financial_agreements')
            .insert(agreementData);

        if (agreementError) {
            console.error(`Erro ao criar acordo financeiro para o caso ${newCase.id}:`, agreementError.message);
        } else {
            console.log(`Acordo financeiro criado com sucesso para o caso ${newCase.id}`);
        }
    }

    const { data: createdCaseWithParties } = await supabase
      .from("cases")
      .select(`*, case_parties(role, entities(id, name))`)
      .eq('id', newCase.id)
      .single();

    return createdCaseWithParties;
}

/**
 * Atualiza um caso existente e sincroniza com financial_agreements quando necessário.
 */
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseUpdateSchema.parse(caseData);
    const supabase = createAdminClient();

    // 1. Busca o estado atual do caso ANTES da atualização
    const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select("status, agreement_value, agreement_type, installments, down_payment, case_parties(role, entities(id))")
        .eq("id", id)
        .single();

    if (fetchError || !currentCase) {
        console.error(`Erro ao buscar caso ${id} antes de atualizar:`, fetchError?.message);
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

    // Se o status não for 'Acordo', garante que os campos de acordo sejam nulos
    if (parsedData.status && parsedData.status !== 'Acordo') {
        parsedData.agreement_type = null;
        parsedData.agreement_value = null;
        parsedData.installments = null;
        parsedData.down_payment = null;
        parsedData.installment_due_date = null;
    }

    // 2. Realiza a atualização
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

    // 3. Compara o status antigo com o novo e registra no histórico se houver mudança
    const statusChanged = currentCase.status !== updatedCase.status;

    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id,
            previous_main_status: currentCase.status,
            new_main_status: updatedCase.status,
            changed_by_user_id: user.id,
            changed_by_user_email: user.email,
        });
    }

    // 4. 🆕 CORREÇÃO PRINCIPAL: Gerenciar sincronização com financial_agreements
    const clientParty = currentCase.case_parties.find((p: any) => p.role === 'Cliente');
    const clientEntityId = clientParty?.entities?.[0]?.id;

    if (clientEntityId) {
        // Verifica se já existe um acordo financeiro para este caso
        const { data: existingAgreement, error: checkError } = await supabase
            .from('financial_agreements')
            .select('id')
            .eq('case_id', id)
            .single();

        // Caso 1: Status mudou para 'Acordo' E não existe acordo financeiro
        if (statusChanged && updatedCase.status === 'Acordo' && 
            updatedCase.agreement_value && updatedCase.agreement_type && !existingAgreement) {
            
            const agreementData = {
                case_id: updatedCase.id,
                client_entity_id: clientEntityId,
                agreement_type: updatedCase.agreement_type,
                total_value: updatedCase.agreement_value,
                entry_value: updatedCase.down_payment || 0,
                installments: updatedCase.installments || 1,
                status: 'active' as const,
                notes: `Acordo gerado a partir da atualização do caso #${updatedCase.id}.`
            };
            
            const { error: agreementError } = await supabase
                .from('financial_agreements')
                .insert(agreementData);

            if (agreementError) {
                console.error(`Erro ao criar acordo financeiro para o caso ${updatedCase.id}:`, agreementError.message);
            } else {
                console.log(`Acordo financeiro criado com sucesso para o caso ${updatedCase.id}`);
            }
        }
        // 🆕 Caso 2: Status continua 'Acordo' mas valores mudaram - ATUALIZA o acordo existente
        else if (!statusChanged && updatedCase.status === 'Acordo' && existingAgreement && 
                 updatedCase.agreement_value && updatedCase.agreement_type) {
            
            // Verifica se houve mudança nos valores do acordo
            const valuesChanged = 
                currentCase.agreement_value !== updatedCase.agreement_value ||
                currentCase.agreement_type !== updatedCase.agreement_type ||
                currentCase.installments !== updatedCase.installments ||
                currentCase.down_payment !== updatedCase.down_payment;

            if (valuesChanged) {
                const updateAgreementData = {
                    agreement_type: updatedCase.agreement_type,
                    total_value: updatedCase.agreement_value,
                    entry_value: updatedCase.down_payment || 0,
                    installments: updatedCase.installments || 1,
                    updated_at: new Date().toISOString()
                };
                
                const { error: updateAgreementError } = await supabase
                    .from('financial_agreements')
                    .update(updateAgreementData)
                    .eq('id', existingAgreement.id);

                if (updateAgreementError) {
                    console.error(`Erro ao atualizar acordo financeiro ${existingAgreement.id}:`, updateAgreementError.message);
                } else {
                    console.log(`Acordo financeiro ${existingAgreement.id} atualizado com sucesso`);
                }
            }
        }
        // 🆕 Caso 3: Status mudou DE 'Acordo' PARA outro status - marca acordo como cancelado
        else if (statusChanged && currentCase.status === 'Acordo' && 
                 updatedCase.status !== 'Acordo' && existingAgreement) {
            
            const { error: cancelError } = await supabase
                .from('financial_agreements')
                .update({ 
                    status: 'cancelled',
                    updated_at: new Date().toISOString(),
                    notes: `Acordo cancelado devido à mudança de status do caso para ${updatedCase.status}`
                })
                .eq('id', existingAgreement.id);

            if (cancelError) {
                console.error(`Erro ao cancelar acordo financeiro ${existingAgreement.id}:`, cancelError.message);
            } else {
                console.log(`Acordo financeiro ${existingAgreement.id} marcado como cancelado`);
            }
        }
        // 🆕 Caso 4: Status mudou PARA 'Acordo' mas acordo já existe (reativar)
        else if (statusChanged && updatedCase.status === 'Acordo' && existingAgreement &&
                 updatedCase.agreement_value && updatedCase.agreement_type) {
            
            const reactivateData = {
                agreement_type: updatedCase.agreement_type,
                total_value: updatedCase.agreement_value,
                entry_value: updatedCase.down_payment || 0,
                installments: updatedCase.installments || 1,
                status: 'active' as const,
                updated_at: new Date().toISOString(),
                notes: `Acordo reativado`
            };
            
            const { error: reactivateError } = await supabase
                .from('financial_agreements')
                .update(reactivateData)
                .eq('id', existingAgreement.id);

            if (reactivateError) {
                console.error(`Erro ao reativar acordo financeiro ${existingAgreement.id}:`, reactivateError.message);
            } else {
                console.log(`Acordo financeiro ${existingAgreement.id} reativado com sucesso`);
            }
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