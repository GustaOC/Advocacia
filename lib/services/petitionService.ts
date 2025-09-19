// lib/services/petitionService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";
import { PetitionUpdateSchema } from "@/lib/schemas"; // Importando o schema de atualização
import { z } from "zod";

export async function getPetitions(user: AuthUser) {
  const supabase = createAdminClient();
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

/**
 * ADICIONADO: Atualiza uma petição existente.
 * @param id - O ID da petição a ser atualizada.
 * @param petitionData - Os novos dados para a petição.
 */
export async function updatePetition(id: string, petitionData: unknown) {
  const parsedData = PetitionUpdateSchema.parse(petitionData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .update(parsedData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar petição ${id}:`, error.message);
    throw new Error("Não foi possível atualizar a petição.");
  }

  return data;
}