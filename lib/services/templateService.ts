// lib/services/templateService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";
import { z } from "zod";
import { getCaseById } from "./caseService"; // Importar serviço de casos

// Schema para criação e atualização de templates
export const TemplateSchema = z.object({
  title: z.string().min(3, "O título é obrigatório."),
  description: z.string().optional().nullable(),
  content: z.string().min(10, "O conteúdo do template é obrigatório."),
  category: z.string().optional().nullable(),
});

// Schema para a requisição de geração de documento
export const GenerateDocumentSchema = z.object({
  templateId: z.number().int().positive(),
  caseId: z.number().int().positive(),
});

/**
 * Busca todos os templates de documentos.
 */
export async function getTemplates() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select(`
      id,
      title,
      description,
      category,
      created_at,
      created_by_user:employees ( name )
    `)
    .order("title", { ascending: true });

  if (error) {
    console.error("Erro ao buscar templates:", error.message);
    throw new Error("Não foi possível buscar os modelos de documento.");
  }
  return data;
}

/**
 * Busca um template específico pelo ID.
 */
export async function getTemplateById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Erro ao buscar template ${id}:`, error.message);
    throw new Error("Não foi possível encontrar o modelo de documento.");
  }
  return data;
}


/**
 * Cria um novo template de documento.
 */
export async function createTemplate(templateData: unknown, user: AuthUser) {
  const parsedData = TemplateSchema.parse(templateData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("document_templates")
    .insert({ ...parsedData, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar template:", error.message);
    throw new Error("Não foi possível criar o modelo de documento.");
  }
  return data;
}

/**
 * Atualiza um template de documento.
 */
export async function updateTemplate(id: number, templateData: unknown) {
  const parsedData = TemplateSchema.partial().parse(templateData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("document_templates")
    .update({ ...parsedData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error(`Erro ao atualizar template ${id}:`, error.message);
    throw new Error("Não foi possível atualizar o modelo de documento.");
  }
  return data;
}

/**
 * Deleta um template de documento.
 */
export async function deleteTemplate(id: number) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("document_templates").delete().eq("id", id);

  if (error) {
    console.error(`Erro ao deletar template ${id}:`, error.message);
    throw new Error("Não foi possível deletar o modelo de documento.");
  }
  return { message: "Modelo excluído com sucesso." };
}

/**
 * Gera um documento a partir de um template e um caso.
 * @param templateId - O ID do modelo de documento.
 * @param caseId - O ID do caso para usar os dados.
 * @returns O conteúdo do documento com as variáveis preenchidas.
 */
export async function generateDocument(templateId: number, caseId: number) {
  const [template, caseData] = await Promise.all([
    getTemplateById(templateId),
    getCaseById(String(caseId)),
  ]);

  if (!template || !caseData) {
    throw new Error("Modelo ou caso não encontrado.");
  }

  let content = template.content;

  const data = {
    processo: {
      numero: caseData.case_number || 'N/A',
      titulo: caseData.title || 'N/A',
      valor: caseData.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(caseData.value) : 'N/A',
      tribunal: caseData.court || 'N/A',
    },
    cliente: caseData.case_parties.find((p: any) => p.role === 'Cliente')?.entities || {},
    parte_contraria: caseData.case_parties.find((p: any) => p.role === 'Parte Contrária')?.entities || {},
    data_atual: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    cidade_escritorio: "Campo Grande/MS",
  };

  const regex = /{{\s*([\w.]+)\s*}}/g;

  // ✅ CORREÇÃO: Adicionadas as tipagens para os parâmetros `match` e `key`.
  content = content.replace(regex, (match: string, key: string) => {
    const keys = key.split('.');
    let value: any = data;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return match; 
      }
    }
    return String(value);
  });

  return { generatedContent: content, documentTitle: `${template.title} - ${caseData.title}` };
}