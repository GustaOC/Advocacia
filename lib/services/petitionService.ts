// lib/services/petitionService.ts 

import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";

export async function getPetitions(user: AuthUser) {
  const supabase = createAdminClient();

  // ✅ CORREÇÃO: A consulta agora busca 'entities' através da tabela 'cases', que é o caminho correto do relacionamento.
  // Isso resolve o erro "Could not find a relationship between 'petitions' and 'entities'".
  const { data, error } = await supabase
    .from("petitions")
    .select(`
      id,
      created_at,
      status,
      file_url,
      cases (
        id,
        title,
        case_number,
        entities (
          id,
          name
        )
      ),
      employees (
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

export async function getPetitionById(id: number, user: AuthUser) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("petitions")
    .select(`
      *,
      cases(*, entities(*)),
      employees(*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar petição ${id}:`, error.message);
    return null;
  }

  return data;
}

// Outras funções do serviço...