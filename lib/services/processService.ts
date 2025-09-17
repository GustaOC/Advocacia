// lib/services/processService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

// Usaremos os schemas de Caso, pois representam um processo.
import { CaseSchema, CaseUpdateSchema } from "@/lib/schemas";

/**
 * Busca processos com filtros e paginação.
 */
export async function getProcesses(filters: { status?: string; search?: string }) {
    const supabase = createAdminClient();
    let query = supabase
        .from("cases") // A tabela de processos chama-se 'cases'
        .select(`
            *,
            case_parties (
                role,
                entities (id, name)
            )
        `)
        .order("created_at", { ascending: false });

    if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }

    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,case_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao buscar processos:", error.message);
        throw new Error("Não foi possível buscar os processos.");
    }
    return data;
}

/**
 * Busca a timeline de um processo específico.
 * @param processId - O ID do processo (caso).
 */
export async function getProcessTimeline(processId: number) {
    // Nota: A sua tabela de timeline não foi criada no último script SQL.
    // Esta função está preparada para quando ela for criada.
    // Por enquanto, retornará um array vazio.
    return []; 
}