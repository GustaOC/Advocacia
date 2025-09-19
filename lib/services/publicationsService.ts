// lib/services/publicationService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";

/**
 * Busca todas as publicações, incluindo dados do responsável.
 * No futuro, pode ser expandido para incluir dados do cliente e do processo.
 */
export async function getPublications(user: AuthUser) {
  const supabase = createAdminClient();
  
  // Nota: Esta consulta assume que tem uma tabela chamada 'publications'.
  // Se o nome for diferente, ajuste o .from() abaixo.
  const { data, error } = await supabase
    .from("publications")
    .select(`
      *,
      responsible:employees ( id, name )
    `)
    .order("date", { ascending: false });

  if (error) {
    console.error("Erro ao buscar publicações:", error.message);
    throw new Error("Não foi possível buscar as publicações.");
  }

  return data.map(p => ({
    ...p,
    // Calcula os dias até o prazo, se existir
    daysUntilDeadline: p.deadline
      ? Math.ceil((new Date(p.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null,
  }));
}