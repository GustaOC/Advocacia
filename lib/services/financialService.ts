// lib/services/financialService.ts - VERSÃO CORRIGIDA E COMPLETA
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AgreementSchema, AgreementUpdateSchema } from "@/lib/schemas";

/**
 * Busca todos os acordos financeiros, fazendo JOINs diretamente no banco de dados com casos e entidades.
 * Esta é uma abordagem mais eficiente e confiável.
 */
export async function getFinancialAgreements() {
  const supabase = createAdminClient();
  
  const { data: agreements, error } = await supabase
    .from("financial_agreements")
    .select(`
      *,
      cases (
        id,
        case_number,
        title
      ),
      entities (
        id,
        name,
        document
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar acordos financeiros com JOIN:", error);
    throw new Error("Não foi possível buscar os acordos financeiros.");
  }

  // A estrutura de dados já vem aninhada corretamente do Supabase
  return agreements || [];
}

/**
 * Busca um acordo financeiro específico pelo ID usando JOINs.
 * @param id - O ID do acordo.
 */
export async function getFinancialAgreementById(id: string) {
  const supabase = createAdminClient();
  
  const { data: agreement, error } = await supabase
      .from("financial_agreements")
      .select(`
        *,
        cases (*),
        entities (*)
      `)
      .eq("id", id)
      .single();

  if (error) {
    if (error.code === 'PGRST116') { // Nenhum registro encontrado
      return null;
    }
    console.error(`Erro ao buscar acordo ${id}:`, error);
    throw new Error("Não foi possível buscar o acordo financeiro.");
  }

  return agreement;
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
    console.error("Erro ao criar acordo financeiro:", error);
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
    console.error(`Erro ao atualizar acordo ${id}:`, error);
    throw new Error(`Erro ao atualizar acordo: ${error.message}`);
  }
  return data;
}