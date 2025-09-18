// lib/services/auditService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";

// Definindo os tipos de ação para padronização
export type AuditAction = 
  // Entidades
  | 'ENTITY_CREATE' | 'ENTITY_UPDATE' | 'ENTITY_DELETE'
  // Casos
  | 'CASE_CREATE' | 'CASE_UPDATE'
  // Documentos
  | 'DOCUMENT_UPLOAD' | 'DOCUMENT_DELETE'
  // Acordos Financeiros
  | 'AGREEMENT_CREATE' | 'AGREEMENT_UPDATE'
  // Petições
  | 'PETITION_CREATE' | 'PETITION_UPDATE'
  // Funcionários
  | 'EMPLOYEE_INVITE' | 'EMPLOYEE_UPDATE' | 'EMPLOYEE_DEACTIVATE';


/**
 * Registra um evento de auditoria no banco de dados.
 * @param action - O tipo de ação realizada.
 * @param user - O objeto do usuário que realizou a ação.
 * @param details - Um objeto JSON com detalhes relevantes sobre a ação.
 */
export async function logAudit(action: AuditAction, user: AuthUser, details: Record<string, any>) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        action,
        user_id: user.id,
        user_email: user.email,
        details,
      });

    if (error) {
      console.error(`[AuditService] Falha ao registrar log de auditoria para a ação "${action}":`, error.message);
    }
  } catch (error) {
    // Logamos o erro, mas não interrompemos a operação principal se o log falhar.
    console.error(`[AuditService] Erro inesperado ao tentar registrar log de auditoria:`, error);
  }
}