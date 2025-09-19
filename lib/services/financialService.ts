// lib/services/financialService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { AgreementSchema, AgreementUpdateSchema } from "@/lib/schemas";

/**
 * Busca todos os acordos financeiros, incluindo dados dos casos e entidades.
 */
export async function getFinancialAgreements() {
  const supabase = createAdminClient();
  // CORREÇÃO: Corrigido o nome da tabela de "financial_agagreements" para "financial_agreements"
  const { data, error } = await supabase
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
    console.error("Erro ao buscar acordos financeiros:", error.message);
    throw new Error("Não foi possível buscar os acordos financeiros.");
  }
  return data;
}

/**
 * Busca um acordo financeiro específico pelo ID.
 * @param id - O ID do acordo.
 */
export async function getFinancialAgreementById(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("financial_agreements")
    .select(`
      *,
      cases (*),
      entities (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
        return null;
    }
    console.error(`Erro ao buscar acordo ${id}:`, error.message);
    throw new Error("Não foi possível buscar o acordo financeiro.");
  }
  return data;
}

/**
 * Cria um novo acordo financeiro.
 * @param agreementData - Os dados do novo acordo.
 */
export async function createFinancialAgreement(agreementData: unknown) {
  const parsedData = AgreementSchema.parse(agreementData);
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from("financial_agreements")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar acordo financeiro:", error.message);
    throw new Error("Não foi possível criar o acordo financeiro.");
  }
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
    throw new Error("Não foi possível atualizar o acordo financeiro.");
  }
  return data;
}