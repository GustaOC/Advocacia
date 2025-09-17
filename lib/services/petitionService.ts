// lib/services/petitionService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { PetitionSchema, PetitionUpdateSchema } from "@/lib/schemas";

/**
 * Busca todas as petições, incluindo dados dos casos e funcionários associados.
 */
export async function getPetitions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("petitions")
    .select(`
      *,
      cases (id, title, case_number),
      created_by_employee:employees!created_by_employee_id (id, name, email),
      assigned_to_employee:employees!assigned_to_employee_id (id, name, email)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar petições:", error.message);
    throw new Error("Não foi possível buscar as petições.");
  }
  return data;
}

/**
 * Cria uma nova petição.
 * @param petitionData - Os dados da nova petição.
 */
export async function createPetition(petitionData: unknown) {
  const parsedData = PetitionSchema.parse(petitionData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar petição:", error.message);
    throw new Error("Não foi possível criar a petição.");
  }
  
  // Opcional: Criar uma notificação para o funcionário responsável
  await supabase.from('notifications').insert({
      user_id: parsedData.assigned_to_employee_id,
      title: 'Nova Petição Atribuída',
      message: `Você foi designado para revisar a petição: "${parsedData.title}"`,
      related_petition_id: data.id,
      created_by: parsedData.created_by_employee_id
  });

  return data;
}

/**
 * Atualiza uma petição existente.
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
  
  // Opcional: Notificar o criador sobre a mudança de status
  if (parsedData.status && data) {
    await supabase.from('notifications').insert({
        user_id: data.created_by_employee_id,
        title: `Status da Petição Alterado: ${parsedData.status}`,
        message: `O status da petição "${data.title}" foi atualizado para "${parsedData.status}".`,
        related_petition_id: data.id,
    });
  }

  return data;
}