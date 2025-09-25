// lib/services/financialService.ts - VERSÃO CORRIGIDA
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AgreementSchema, AgreementUpdateSchema } from "@/lib/schemas";

/**
 * Busca todos os acordos financeiros, fazendo JOINs manuais com casos e entidades.
 */
export async function getFinancialAgreements() {
  const supabase = createAdminClient();
  
  try {
    // ✅ CORREÇÃO: Primeira busca - dados dos acordos
    const { data: agreements, error: agreementsError } = await supabase
      .from("financial_agreements")
      .select('*')
      .order("created_at", { ascending: false });

    if (agreementsError) {
      console.error("Erro ao buscar acordos:", agreementsError.message);
      throw new Error("Não foi possível buscar os acordos financeiros.");
    }

    if (!agreements || agreements.length === 0) {
      return [];
    }

    // ✅ CORREÇÃO: Buscar dados dos casos relacionados
    const caseIds = [...new Set(agreements.map(a => a.case_id))];
    const { data: cases, error: casesError } = await supabase
      .from("cases")
      .select('id, case_number, title')
      .in('id', caseIds);

    if (casesError) {
      console.error("Erro ao buscar casos:", casesError.message);
      throw new Error("Não foi possível buscar os dados dos casos.");
    }

    // ✅ CORREÇÃO: Buscar dados das entidades relacionadas
    const entityIds = [...new Set(agreements.map(a => a.client_entity_id))];
    const { data: entities, error: entitiesError } = await supabase
      .from("entities")
      .select('id, name, document')
      .in('id', entityIds);

    if (entitiesError) {
      console.error("Erro ao buscar entidades:", entitiesError.message);
      throw new Error("Não foi possível buscar os dados das entidades.");
    }

    // ✅ CORREÇÃO: Combinar os dados manualmente
    const agreementsWithRelations = agreements.map(agreement => {
      const relatedCase = cases?.find(c => c.id === agreement.case_id) || {
        id: agreement.case_id,
        case_number: null,
        title: 'Caso não encontrado'
      };
      
      const relatedEntity = entities?.find(e => e.id === agreement.client_entity_id) || {
        id: agreement.client_entity_id,
        name: 'Cliente não encontrado',
        document: null
      };

      return {
        ...agreement,
        cases: relatedCase,
        entities: relatedEntity
      };
    });

    console.log(`✅ Retornando ${agreementsWithRelations.length} acordos com relacionamentos`);
    return agreementsWithRelations;
    
  } catch (error: any) {
    console.error("Erro geral ao buscar acordos:", error);
    throw new Error(error.message || "Erro desconhecido ao buscar acordos financeiros.");
  }
}

/**
 * Busca um acordo financeiro específico pelo ID.
 * @param id - O ID do acordo.
 */
export async function getFinancialAgreementById(id: string) {
  const supabase = createAdminClient();
  
  try {
    // ✅ CORREÇÃO: Buscar acordo específico
    const { data: agreement, error: agreementError } = await supabase
      .from("financial_agreements")
      .select('*')
      .eq("id", id)
      .single();

    if (agreementError) {
      if (agreementError.code === 'PGRST116') {
        return null;
      }
      console.error(`Erro ao buscar acordo ${id}:`, agreementError.message);
      throw new Error("Não foi possível buscar o acordo financeiro.");
    }

    // ✅ CORREÇÃO: Buscar dados do caso relacionado
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select('*')
      .eq('id', agreement.case_id)
      .single();

    if (caseError && caseError.code !== 'PGRST116') {
      console.error("Erro ao buscar caso:", caseError.message);
    }

    // ✅ CORREÇÃO: Buscar dados da entidade relacionada
    const { data: entityData, error: entityError } = await supabase
      .from("entities")
      .select('*')
      .eq('id', agreement.client_entity_id)
      .single();

    if (entityError && entityError.code !== 'PGRST116') {
      console.error("Erro ao buscar entidade:", entityError.message);
    }

    return {
      ...agreement,
      cases: caseData || { id: agreement.case_id, case_number: null, title: 'Caso não encontrado' },
      entities: entityData || { id: agreement.client_entity_id, name: 'Cliente não encontrado', document: null }
    };
    
  } catch (error: any) {
    console.error(`Erro geral ao buscar acordo ${id}:`, error);
    throw new Error(error.message || "Erro desconhecido ao buscar acordo financeiro.");
  }
}

/**
 * Cria um novo acordo financeiro.
 * @param agreementData - Os dados do novo acordo.
 */
export async function createFinancialAgreement(agreementData: unknown) {
  const parsedData = AgreementSchema.parse(agreementData);
  const supabase = createAdminClient();
  
  console.log("📝 Criando acordo financeiro:", parsedData);
  
  const { data, error } = await supabase
    .from("financial_agreements")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar acordo financeiro:", error.message);
    throw new Error(`Erro ao criar acordo: ${error.message}`);
  }
  
  console.log("✅ Acordo criado com sucesso:", data);
  return data;
}

/**
 * Atualiza um acordo financeiro.
 * @param id - O ID do acordo a ser atualizado.
 * @param agreementData - Os novos dados para o acordo.
 */
export async function updateFinancialAgreement(id: string, agreementData: unknown) {
  const parsedData = AgreementUpdateSchema.parse(agreementData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("financial_agreements")
    .update(parsedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar acordo ${id}:`, error.message);
    throw new Error(`Erro ao atualizar acordo: ${error.message}`);
  }
  return data;
}