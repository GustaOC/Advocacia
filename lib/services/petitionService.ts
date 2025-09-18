// lib/services/petitionService.ts - VERSÃO CORRIGIDA

import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";

/**
 * Busca todas as petições com informações do cliente e do caso associado.
 */
export async function getPetitions(user: AuthUser) {
  const supabase = createAdminClient();

  // ✅ CORREÇÃO: A consulta agora especifica explicitamente as colunas da tabela 'cases',
  // evitando o erro 'cases_1.title does not exist'.
  const { data, error } = await supabase
    .from("petitions")
    .select(`
      id,
      created_at,
      status,
      file_url,
      case:cases (
        id,
        title,
        case_number
      ),
      client:entities (
        id,
        name
      ),
      author:employees (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar petições:", error.message);
    throw new Error("Não foi possível buscar as petições.");
  }
  
  return data;
}

/**
 * Busca uma petição específica pelo ID.
 */
export async function getPetitionById(id: number, user: AuthUser) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("petitions")
    .select(`
      *,
      case:cases(*),
      client:entities(*),
      author:employees(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar petição ${id}:`, error.message);
    return null;
  }

  return data;
}

// Adicione outras funções relacionadas a petições aqui (create, update, delete) se necessário.