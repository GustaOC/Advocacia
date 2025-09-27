// lib/services/caseService.ts - VERSÃO CORRIGIDA
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

// Estende o CaseSchema base para incluir os IDs das partes, que são necessários para a criação.
const CaseCreateSchema = CaseSchema.extend({
  client_entity_id: z.number(),
  executed_entity_id: z.number(),
});

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
        entity_id,
        entities:entity_id (
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
  
  // Normalizar a estrutura para o formato esperado pelo frontend
  const normalizedData = (data || []).map(caseItem => ({
    ...caseItem,
    case_parties: caseItem.case_parties.map((party: any) => ({
      role: party.role,
      entities: party.entities
    }))
  }));
  
  return { data: normalizedData, count: count || 0 };
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
        entity_id,
        entities:entity_id (*)
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
  
  // Normalizar a estrutura
  if (data) {
    data.case_parties = data.case_parties.map((party: any) => ({
      role: party.role,
      entities: party.entities
    }));
  }
  
  return data;
}

/**
 * Cria um novo caso e associa as partes (cliente e executado).
 */
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
            case_id: newCase.id, 
            debtor_id: client_entity_id,
            agreement_type: newCase.agreement_type, 
            total_amount: newCase.agreement_value,
            down_payment: newCase.down_payment || 0, 
            number_of_installments: newCase.installments || 1,
            // ✅ CORREÇÃO: Adicionando a data de início que é obrigatória.
            start_date: new Date().toISOString(),
            status: 'active' as const, 
            notes: `Acordo criado junto com o caso #${newCase.id}.`
        };
        
        console.log('[caseService.createCase] Criando acordo financeiro:', agreementData);
        
        const { error: agreementError } = await supabase.from('financial_agreements').insert(agreementData);
        if (agreementError) {
            console.error(`Erro ao criar acordo financeiro para o caso ${newCase.id}:`, agreementError);
        } else {
            console.log(`[caseService.createCase] Acordo financeiro criado com sucesso para o caso ${newCase.id}`);
        }
    }

    const { data: createdCaseWithParties } = await supabase
      .from("cases")
      .select(`
        *, 
        case_parties (
          role, 
          entity_id,
          entities:entity_id (id, name)
        )
      `)
      .eq('id', newCase.id)
      .single();
    
    // Normalizar a estrutura antes de retornar
    if (createdCaseWithParties) {
      createdCaseWithParties.case_parties = createdCaseWithParties.case_parties.map((party: any) => ({
        role: party.role,
        entities: party.entities
      }));
    }
    
    return createdCaseWithParties;
}

/**
 * Atualiza um caso existente e sincroniza com financial_agreements quando necessário.
 */
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseSchema.partial().parse(caseData);
    const supabase = createAdminClient();

    // Buscar caso atual com as partes para obter o client_entity_id
    const { data: currentCase, error: fetchError } = await supabase
        .from("cases")
        .select(`
          *, 
          case_parties (
            role, 
            entity_id
          )
        `)
        .eq("id", id)
        .single();

    if (fetchError || !currentCase) {
        console.error(`Erro ao buscar caso ${id} antes de atualizar:`, fetchError);
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }

    console.log('[caseService.updateCase] Case parties do caso atual:', currentCase.case_parties);

    // Se o status não for mais 'Acordo', limpar campos relacionados
    if (parsedData.status && parsedData.status !== 'Acordo') {
        Object.assign(parsedData, { 
            agreement_type: null, 
            agreement_value: null, 
            installments: null, 
            down_payment: null, 
            installment_due_date: null 
        });
    }

    // Atualizar o caso
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
    
    console.log('[caseService.updateCase] Caso atualizado:', updatedCase);
    console.log('[caseService.updateCase] Status mudou?', currentCase.status, '->', updatedCase.status);

    // Verificar se o status mudou
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

    // Obter o ID da entidade cliente diretamente do array de case_parties
    const clientParty = currentCase.case_parties.find((p: any) => p.role === 'Cliente');
    const clientEntityId = clientParty?.entity_id;

    console.log('[caseService.updateCase] Cliente encontrado:', { clientParty, clientEntityId });

    if (clientEntityId) {
        // Verificar se já existe um acordo financeiro para este caso
        const { data: existingAgreements } = await supabase
            .from('financial_agreements')
            .select('id, status')
            .eq('case_id', id);
        
        const existingAgreement = existingAgreements && existingAgreements.length > 0 ? existingAgreements[0] : null;
        
        console.log(`[caseService.updateCase] Acordo existente para caso ${id}:`, existingAgreement);

        const hasAgreementData = updatedCase.agreement_value && updatedCase.agreement_type;
        console.log('[caseService.updateCase] Tem dados de acordo?', hasAgreementData, { 
            value: updatedCase.agreement_value, 
            type: updatedCase.agreement_type 
        });

        // Cenário 1: Status mudou para 'Acordo' e não existia acordo antes
        if (statusChanged && updatedCase.status === 'Acordo' && hasAgreementData && !existingAgreement) {
            console.log(`[caseService.updateCase] Criando novo acordo financeiro`);
            
            const agreementData = {
                case_id: id, 
                debtor_id: clientEntityId, 
                agreement_type: updatedCase.agreement_type,
                total_amount: Number(updatedCase.agreement_value),
                down_payment: Number(updatedCase.down_payment) || 0,
                number_of_installments: Number(updatedCase.installments) || 1,
                // ✅ CORREÇÃO: Adicionando a data de início que é obrigatória.
                start_date: new Date().toISOString(),
                status: 'active', 
                notes: `Acordo gerado a partir da atualização do caso #${id}.`
            };
            
            console.log('[caseService.updateCase] Dados do novo acordo:', agreementData);
            
            const { error, data } = await supabase
                .from('financial_agreements')
                .insert(agreementData)
                .select()
                .single();
            
            if (error) {
                console.error(`[caseService.updateCase] Erro ao criar acordo:`, error);
            } else {
                console.log(`[caseService.updateCase] Acordo criado com sucesso:`, data);
            }
        } 
        // Cenário 2: Status continua 'Acordo', acordo já existe, valores mudaram
        else if (!statusChanged && updatedCase.status === 'Acordo' && existingAgreement && hasAgreementData) {
            const valuesChanged = 
                currentCase.agreement_value !== updatedCase.agreement_value || 
                currentCase.agreement_type !== updatedCase.agreement_type || 
                currentCase.installments !== updatedCase.installments || 
                currentCase.down_payment !== updatedCase.down_payment;
            
            console.log(`[caseService.updateCase] Valores do acordo mudaram: ${valuesChanged}`);
            
            if (valuesChanged) {
                const { error } = await supabase
                    .from('financial_agreements')
                    .update({
                        agreement_type: updatedCase.agreement_type, 
                        total_amount: Number(updatedCase.agreement_value),
                        down_payment: Number(updatedCase.down_payment) || 0, 
                        number_of_installments: Number(updatedCase.installments) || 1,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existingAgreement.id);
                
                if (error) {
                    console.error(`[caseService.updateCase] Erro ao atualizar acordo:`, error);
                } else {
                    console.log(`[caseService.updateCase] Acordo atualizado com sucesso`);
                }
            }
        } 
        // Cenário 3: Status é 'Acordo', mas acordo não existia (fallback)
        else if (updatedCase.status === 'Acordo' && !existingAgreement && hasAgreementData) {
            console.log(`[caseService.updateCase] Criando acordo (fallback)`);
            
            const agreementData = {
                case_id: id, 
                debtor_id: clientEntityId, 
                agreement_type: updatedCase.agreement_type,
                total_amount: Number(updatedCase.agreement_value), 
                down_payment: Number(updatedCase.down_payment) || 0,
                number_of_installments: Number(updatedCase.installments) || 1,
                // ✅ CORREÇÃO: Adicionando a data de início que é obrigatória.
                start_date: new Date().toISOString(),
                status: 'active', 
                notes: `Acordo criado - caso #${id}.`
            };
            
            const { error } = await supabase
                .from('financial_agreements')
                .insert(agreementData);
            
            if (error) {
                console.error(`[caseService.updateCase] Erro ao criar acordo (fallback):`, error);
            } else {
                console.log(`[caseService.updateCase] Acordo criado com sucesso (fallback)`);
            }
        } 
        // Cenário 4: Status mudou DE 'Acordo' para outro
        else if (statusChanged && currentCase.status === 'Acordo' && updatedCase.status !== 'Acordo' && existingAgreement) {
            console.log(`[caseService.updateCase] Cancelando acordo`);
            
            const { error } = await supabase
                .from('financial_agreements')
                .update({ 
                    status: 'cancelled', 
                    updated_at: new Date().toISOString(), 
                    notes: `Acordo cancelado - status do caso mudou para ${updatedCase.status}` 
                })
                .eq('id', existingAgreement.id);
            
            if (error) {
                console.error(`[caseService.updateCase] Erro ao cancelar acordo:`, error);
            } else {
                console.log(`[caseService.updateCase] Acordo cancelado com sucesso`);
            }
        } 
        // Cenário 5: Status voltou a ser 'Acordo' e acordo existe mas está cancelado
        else if (statusChanged && updatedCase.status === 'Acordo' && existingAgreement && hasAgreementData && existingAgreement.status === 'cancelled') {
            console.log(`[caseService.updateCase] Reativando acordo`);
            
            const { error } = await supabase
                .from('financial_agreements')
                .update({
                    agreement_type: updatedCase.agreement_type, 
                    total_amount: Number(updatedCase.agreement_value),
                    down_payment: Number(updatedCase.down_payment) || 0, 
                    number_of_installments: Number(updatedCase.installments) || 1,
                    status: 'active', 
                    updated_at: new Date().toISOString(), 
                    notes: `Acordo reativado`
                })
                .eq('id', existingAgreement.id);
            
            if (error) {
                console.error(`[caseService.updateCase] Erro ao reativar acordo:`, error);
            } else {
                console.log(`[caseService.updateCase] Acordo reativado com sucesso`);
            }
        }
    } else {
        console.warn(`[caseService.updateCase] Caso ${updatedCase.id}: não foi possível encontrar a parte 'Cliente' para gerenciar registro financeiro.`);
    }

    await logAudit('CASE_UPDATE', user, { caseId: updatedCase.id, updatedFields: Object.keys(parsedData) });
    
    // Retornar o caso atualizado com as partes normalizadas
    const { data: finalCase } = await supabase
      .from("cases")
      .select(`
        *, 
        case_parties (
          role, 
          entity_id,
          entities:entity_id (id, name)
        )
      `)
      .eq('id', id)
      .single();
    
    if (finalCase) {
      finalCase.case_parties = finalCase.case_parties.map((party: any) => ({
        role: party.role,
        entities: party.entities
      }));
    }
    
    return finalCase || updatedCase;
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
        console.error(`Erro ao buscar histórico do caso ${caseId}:`, error);
        throw new Error("Não foi possível buscar o histórico do caso.");
    }
    return data;
}