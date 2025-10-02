// lib/services/petitionService.ts

import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";
import { z } from "zod";

/**
 * Tipos auxiliares
 */
export type PetitionStatus = "Em elaboração" | "Revisão" | "Protocolado" | string;

export interface CreatePetitionInput {
  case_id: string;
  title: string;
  content?: string | null;
  status?: PetitionStatus;
  employee_id?: string | number | null; // opcional: se ausente, tentaremos inferir pelo usuário
}

// Schema para validação dos dados de atualização
const UpdatePetitionSchema = z.object({
  title: z.string().optional(),
  content: z.string().nullish(),
  status: z.string().optional(),
  employee_id: z.union([z.string(), z.number()]).nullish(),
}).strict();


/**
 * Utilitário para resolver o employee_id a partir do usuário autenticado.
 * Se não encontrar, retorna null (não quebra criação, caso a coluna permita null).
 */
async function resolveEmployeeIdFromUser(user: AuthUser): Promise<string | number | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, auth_user_id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .single();

    if (error) return null;
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Lista geral de petições com possibilidade de expandir relações via cases -> entities e employees.
 * Mantemos a seleção resiliente (não falha se relações não existirem, desde que FKs estejam corretas).
 */
export async function getPetitions(user: AuthUser) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .select(
      `
        id,
        created_at,
        updated_at,
        title,
        status,
        case_id,
        employee_id,
        cases (
          id,
          title,
          entity_id,
          entities (*)
        ),
        employees (*)
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[petitionService.getPetitions] Erro:", error.message);
    throw new Error("Não foi possível carregar as petições.");
  }

  return data ?? [];
}

/**
 * Busca petições por ID do caso.
 */
export async function getPetitionsByCase(user: AuthUser, caseId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .select(
      `
        id,
        created_at,
        updated_at,
        title,
        status,
        case_id,
        employee_id,
        cases (
          id,
          title,
          entity_id,
          entities (*)
        ),
        employees (*)
      `
    )
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[petitionService.getPetitionsByCase] Erro:", error.message);
    throw new Error("Não foi possível carregar as petições do caso.");
  }

  return data ?? [];
}

/**
 * Busca petições por status.
 */
export async function getPetitionsByStatus(user: AuthUser, status: PetitionStatus) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .select(
      `
        id,
        created_at,
        updated_at,
        title,
        status,
        case_id,
        employee_id,
        cases (
          id,
          title,
          entity_id,
          entities (*)
        ),
        employees (*)
      `
    )
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[petitionService.getPetitionsByStatus] Erro:", error.message);
    throw new Error("Não foi possível carregar as petições pelo status.");
  }

  return data ?? [];
}

/**
 * Cria uma nova petição.
 * Caso employee_id não seja informado, tenta inferir pelo usuário autenticado.
 */
export async function createPetition(user: AuthUser, input: CreatePetitionInput) {
  const supabase = createAdminClient();

  const {
    case_id,
    title,
    content = null,
    status = "Em elaboração",
    employee_id,
  } = input;

  const effectiveEmployeeId =
    employee_id ?? (await resolveEmployeeIdFromUser(user));

  const { data, error } = await supabase
    .from("petitions")
    .insert([
      {
        case_id,
        title,
        content,
        status,
        employee_id: effectiveEmployeeId,
      },
    ])
    .select(
      `
        id,
        created_at,
        updated_at,
        title,
        status,
        case_id,
        employee_id,
        cases (
          id,
          title,
          entity_id,
          entities (*)
        ),
        employees (*)
      `
    )
    .single();

  if (error) {
    console.error("[petitionService.createPetition] Erro:", error.message);
    throw new Error("Não foi possível criar a petição.");
  }

  return data;
}

/**
 * Busca uma petição específica por ID.
 */
export async function getPetitionById(user: AuthUser, id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("petitions")
    .select(
      `
        id,
        created_at,
        updated_at,
        title,
        status,
        case_id,
        employee_id,
        cases (
          id,
          title,
          entity_id,
          entities (*)
        ),
        employees (*)
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    // Retorna null se não encontrar, em vez de lançar um erro
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`[petitionService.getPetitionById] Erro (${id}):`, error.message);
    throw new Error("Não foi possível carregar a petição.");
  }

  return data;
}

// --- FUNÇÕES ADICIONADAS ---

/**
 * Atualiza uma petição existente.
 */
export async function updatePetition(id: string, input: unknown, user: AuthUser) {
    const supabase = createAdminClient();
    const parsedData = UpdatePetitionSchema.parse(input);

    const { data, error } = await supabase
        .from("petitions")
        .update(parsedData)
        .eq("id", id)
        .select()
        .single();
    
    if (error) {
        console.error(`[petitionService.updatePetition] Erro ao atualizar petição ${id}:`, error.message);
        throw new Error("Não foi possível atualizar a petição.");
    }

    return data;
}

/**
 * Deleta uma petição.
 */
export async function deletePetition(id: string, user: AuthUser) {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from("petitions")
        .delete()
        .eq("id", id);
    
    if (error) {
        console.error(`[petitionService.deletePetition] Erro ao deletar petição ${id}:`, error.message);
        throw new Error("Não foi possível deletar a petição.");
    }

    return { message: "Petição deletada com sucesso." };
}