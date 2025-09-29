// lib/services/documentService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
// ❌ removido: import { DocumentSchema } from "@/lib/schemas";
// ❌ removido: import { AuthUser } from "@/lib/auth";

const BUCKET_NAME = "case-documents";

/** ===== Tipos mínimos usados aqui ===== */
export type DbDocument = {
  id: number;
  case_id: number;
  // demais colunas variam no seu schema (file_name, file_path, url, description, etc.)
  [key: string]: any;
};

/** Lista documentos por caso (seleciona * para evitar colunas inexistentes) */
export async function getDocumentsByCaseId(caseId: number): Promise<DbDocument[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")              // ✅ sem citar colunas que podem não existir no seu schema
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Erro ao buscar documentos para o caso ${caseId}:`, error);
    throw new Error("Não foi possível buscar os documentos.");
  }
  return (data as DbDocument[]) ?? [];
}

/** Criação simples (metadados já devem ter sido validados na rota) */
const CreateDocSchema = z.object({
  case_id: z.coerce.number(),
  // deixe os demais metadados livres, pois o schema varia
}).passthrough();

export async function createDocument(input: Record<string, any>): Promise<DbDocument> {
  const supabase = createAdminClient();
  const parsed = CreateDocSchema.parse(input);

  const { data, error } = await supabase
    .from("documents")
    .insert([parsed])
    .select("*")
    .single();

  if (error || !data) {
    console.error("Erro ao criar documento:", error);
    throw new Error("Não foi possível criar o documento.");
  }
  return data as DbDocument;
}

/** Exclusão por ID */
export async function deleteDocument(documentId: number): Promise<boolean> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    console.error("Erro ao excluir documento:", error);
    throw new Error("Não foi possível excluir o documento.");
  }
  return true;
}
