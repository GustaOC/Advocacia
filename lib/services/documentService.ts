// lib/services/documentService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { DocumentSchema } from "@/lib/schemas";
import { AuthUser } from "@/lib/auth";

const BUCKET_NAME = 'case-documents';

/**
 * Faz o upload de um arquivo para o Supabase Storage e salva seus metadados no banco de dados.
 */
export async function uploadDocument(file: File, details: { case_id: number; description?: string }, user: AuthUser) {
  if (!file) throw new Error("Nenhum arquivo fornecido.");
  if (!details.case_id) throw new Error("O ID do caso é obrigatório.");

  const supabase = createAdminClient();
  const fileExtension = file.name.split('.').pop();
  const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;
  const filePath = `public/case_${details.case_id}/${uniqueFileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file);

  if (uploadError) {
    console.error("Erro no upload para o Supabase Storage:", uploadError.message);
    throw new Error("Falha ao carregar o arquivo.");
  }

  const documentData = {
    case_id: details.case_id,
    employee_id: user.id,
    file_name: file.name,
    file_path: filePath,
    file_type: file.type,
    file_size: file.size,
    description: details.description,
  };

  const parsedData = DocumentSchema.parse(documentData);
  const { data: dbRecord, error: dbError } = await supabase
    .from("documents")
    .insert(parsedData)
    .select()
    .single();

  if (dbError) {
    console.error("Erro ao salvar metadados do documento:", dbError.message);
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw new Error("Não foi possível salvar as informações do documento.");
  }

  return dbRecord;
}

/**
 * Busca todos os documentos associados a um caso específico.
 * @param caseId - O ID do caso.
 */
export async function getDocumentsByCaseId(caseId: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('documents')
    .select(`
        id,
        file_name,
        file_path,
        file_size,
        file_type,
        description,
        created_at,
        employee:employees ( id, name )
    `)
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Erro ao buscar documentos para o caso ${caseId}:`, error.message);
    throw new Error('Não foi possível buscar os documentos.');
  }
  return data;
}

/**
 * Deleta um documento do banco de dados e do Storage.
 * @param documentId - O ID do documento a ser deletado.
 */
export async function deleteDocument(documentId: number) {
  const supabase = createAdminClient();

  // 1. Busca o caminho do arquivo no banco antes de deletar o registro
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', documentId)
    .single();

  if (fetchError || !doc) {
    console.error(`Erro ao buscar documento ${documentId} para exclusão:`, fetchError?.message);
    throw new Error("Documento não encontrado para exclusão.");
  }

  // 2. Deleta o registro do banco de dados
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    console.error(`Erro ao deletar registro do documento ${documentId}:`, dbError.message);
    throw new Error("Falha ao deletar o registro do documento.");
  }

  // 3. Deleta o arquivo do Supabase Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([doc.file_path]);
  
  if (storageError) {
    console.error(`Erro ao deletar arquivo do storage (${doc.file_path}):`, storageError.message);
    // Mesmo com erro no storage, o registro do DB foi removido, então consideramos sucesso parcial.
    // Em um sistema real, poderia haver uma fila de retentativas para arquivos órfãos.
  }

  return { message: "Documento excluído com sucesso." };
}