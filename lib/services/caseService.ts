// lib/services/caseService.ts - VERSÃO FINAL E ROBUSTA COM LÓGICA DE ALVARÁ

import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { CaseSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";
import { logAudit } from "./auditService";

// Função auxiliar para normalizar a estrutura de dados das partes do processo
function normalizeParties(caseItem: any) {
  if (!caseItem?.case_parties) return caseItem;
  caseItem.case_parties = caseItem.case_parties.map((party: any) => ({
    role: party?.role,
    entity_id: party?.entity_id ?? party?.entities?.id ?? null,
    entities: party?.entities
      ? { ...party.entities, id: party.entities?.id != null ? String(party.entities.id) : null }
      : null,
  }));
  return caseItem;
}

// Schema para a criação de um caso, exigindo os IDs do cliente e do executado
const CaseCreateSchema = CaseSchema.extend({
  client_entity_id: z.number(),
  executed_entity_id: z.number(),
});

// Busca paginada de todos os casos
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
  
  return { data: (data || []).map(d => normalizeParties(d)), count: count || 0 };
}

// Busca um único caso pelo seu ID
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
  
  return normalizeParties(data);
}

// Cria um novo caso e, se aplicável, o acordo financeiro associado
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

    // --- LÓGICA UNIFICADA PARA CRIAÇÃO DE ACORDO FINANCEIRO ---
    if (newCase.status === 'Acordo') {
        // Lógica para acordo padrão
        if (newCase.agreement_value && newCase.agreement_type) {
            const agreementData = {
                case_id: newCase.id, 
                debtor_id: executed_entity_id, // Executado é quem deve
                creditor_id: client_entity_id, // Cliente é quem recebe
                agreement_type: 'Extrajudicial', // Tipo fixo ou do form
                total_amount: newCase.agreement_value,
                down_payment: newCase.down_payment || 0,
                number_of_installments: newCase.installments || 1,
                start_date: newCase.installment_due_date || new Date().toISOString(),
                status: 'ATIVO' as const, 
                notes: `Acordo (padrão) criado junto com o caso #${newCase.id}.`
            };
            const { error: agreementError } = await supabase.from('financial_agreements').insert(agreementData);
            if (agreementError) {
                console.error(`Erro ao criar acordo financeiro padrão para o caso ${newCase.id}:`, agreementError);
            }
        }
        // Lógica para acordo de ALVARÁ
        if (newCase.has_alvara && newCase.alvara_value) {
            const alvaraAgreementData = {
                case_id: newCase.id,
                debtor_id: executed_entity_id,
                creditor_id: client_entity_id,
                agreement_type: 'A_VISTA',
                total_amount: newCase.alvara_value,
                down_payment: 0,
                number_of_installments: 1,
                start_date: new Date().toISOString(),
                status: 'ATIVO' as const,
                notes: `Acordo financeiro referente ao ALVARÁ do caso #${newCase.id}.`
            };
            const { error: alvaraError } = await supabase.from('financial_agreements').insert(alvaraAgreementData);
            if (alvaraError) {
                console.error(`Erro ao criar acordo financeiro de ALVARÁ para o caso ${newCase.id}:`, alvaraError);
            }
        }
    }

    const { data: createdCaseWithParties } = await supabase
      .from("cases").select(`*, case_parties (role, entity_id, entities:entity_id (id, name))`)
      .eq('id', newCase.id).single();
    
    return normalizeParties(createdCaseWithParties);
}

// Atualiza um caso existente e gerencia o acordo financeiro associado
export async function updateCase(id: number, caseData: unknown, user: AuthUser) {
    const parsedData = CaseSchema.partial().parse(caseData);
    const supabase = createAdminClient();

    const { data: currentCase, error: fetchError } = await supabase
        .from("cases").select(`*, case_parties (role, entity_id)`)
        .eq("id", id).single();

    if (fetchError || !currentCase) {
        throw new Error("Não foi possível encontrar o caso para atualização.");
    }
    
    // Filtra os campos para garantir que apenas colunas da tabela 'cases' sejam enviadas no update
    const caseFields = Object.keys(CaseSchema.shape);
    const caseUpdateData: Partial<typeof parsedData> = {};
    for (const key of Object.keys(parsedData)) {
      if (caseFields.includes(key)) {
        // @ts-ignore
        caseUpdateData[key] = parsedData[key];
      }
    }

    const { data: updatedCase, error: updateError } = await supabase
        .from("cases")
        .update(caseUpdateData)
        .eq("id", id)
        .select('*')
        .single();

    if (updateError) {
        console.error("Erro do Supabase ao atualizar o caso:", updateError);
        throw new Error("Não foi possível atualizar o caso.");
    }
    
    // Log de auditoria e histórico de status
    const statusChanged = currentCase.status !== updatedCase.status;
    if (statusChanged) {
        await supabase.from('case_status_history').insert({
            case_id: id, previous_main_status: currentCase.status, new_main_status: updatedCase.status,
            changed_by_user_id: user.id, changed_by_user_email: user.email,
        });
    }
    await logAudit('CASE_UPDATE', user, { caseId: updatedCase.id, updatedFields: Object.keys(parsedData) });

    // --- LÓGICA ROBUSTA PARA GERENCIAR ACORDOS FINANCEIROS ---
    const clientParty = currentCase.case_parties.find((p: any) => p.role === 'Cliente');
    const executedParty = currentCase.case_parties.find((p: any) => p.role === 'Executado');

    if (!clientParty || !executedParty) {
        console.warn(`[caseService.updateCase] Partes não encontradas para o caso ${id}. Ações financeiras ignoradas.`);
        return updatedCase;
    }
    
    // VERIFICA SE O CASO FOI ATUALIZADO PARA "ACORDO" COM ALVARÁ
    const becameAlvaraAgreement = updatedCase.status === 'Acordo' && updatedCase.has_alvara && updatedCase.alvara_value && (!currentCase.has_alvara || currentCase.status !== 'Acordo');
    
    if (becameAlvaraAgreement) {
        console.log(`Criando NOVO acordo financeiro para o ALVARÁ do caso ${id}`);
        const { error } = await supabase.from('financial_agreements').insert({
            case_id: id,
            debtor_id: executedParty.entity_id,
            creditor_id: clientParty.entity_id,
            agreement_type: 'A_VISTA',
            total_amount: Number(updatedCase.alvara_value),
            number_of_installments: 1,
            start_date: new Date().toISOString(),
            status: 'ATIVO',
            notes: `Acordo gerado a partir da definição de um ALVARÁ no caso #${id}.`
        });
        if (error) console.error(`Erro ao CRIAR acordo de alvará para o caso ${id}:`, error);
    }
    
    // A lógica original para acordos padrão pode ser mantida ou ajustada conforme a regra de negócio.
    // Por exemplo, você pode decidir que um alvará e um acordo padrão não podem coexistir,
    // ou podem ser acordos separados. Abaixo, mantenho a lógica original para o acordo padrão.

    const { data: existingAgreement } = await supabase
        .from('financial_agreements').select('id').eq('case_id', id).ilike('notes', '%(padrão)%').maybeSingle();

    if (updatedCase.status === 'Acordo' && updatedCase.agreement_value && updatedCase.agreement_type) {
        const agreementPayload = {
            case_id: id,
            debtor_id: executedParty.entity_id,
            creditor_id: clientParty.entity_id,
            agreement_type: 'Extrajudicial',
            total_amount: Number(updatedCase.agreement_value),
            down_payment: Number(updatedCase.down_payment) || 0,
            number_of_installments: Number(updatedCase.installments) || 1,
            start_date: updatedCase.installment_due_date || new Date().toISOString(),
        };

        if (existingAgreement) {
            console.log(`Atualizando acordo padrão existente para o caso ${id}`);
            await supabase.from('financial_agreements').update({ ...agreementPayload, status: 'ATIVO' }).eq('id', existingAgreement.id);
        } else {
            console.log(`Criando NOVO acordo padrão para o caso ${id}`);
            await supabase.from('financial_agreements').insert({ ...agreementPayload, status: 'ATIVO', notes: `Acordo (padrão) gerado a partir do caso #${id}.` });
        }
    } else if (statusChanged && currentCase.status === 'Acordo' && existingAgreement) {
        console.log(`Excluindo acordo padrão para o caso ${id} pois o status mudou.`);
        await supabase.from('financial_agreements').delete().eq('id', existingAgreement.id);
    }
    
    return updatedCase;
}

// Busca o histórico de status de um caso
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