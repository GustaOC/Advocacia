// lib/services/auditService.ts - VERSÃO ATUALIZADA

import { createAdminClient } from '../supabase/server'
import { AuthUser } from '../auth'

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'CASE_CREATE'
  | 'CASE_UPDATE'
  | 'CASE_DELETE'
  | 'ENTITY_CREATE'
  | 'ENTITY_UPDATE'
  | 'ENTITY_DELETE'
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_DELETE'
  | 'PETITION_CREATE'
  | 'PETITION_UPDATE'
  | 'PETITION_DELETE'  // ✅ ADICIONADO
  | 'TEMPLATE_CREATE'
  | 'TEMPLATE_UPDATE'
  | 'TEMPLATE_DELETE'
  | 'USER_PASSWORD_CHANGE'
  | 'USER_PROFILE_UPDATE'
  | 'PAYMENT_RECORDED'

export async function logAudit(
  action: AuditAction,
  user: AuthUser,
  details: Record<string, any>,
) {
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_email: user.email,
      action,
      details,
    })

    if (error) {
      console.error('Error logging audit event:', error)
    }
  } catch (err) {
    console.error('Failed to log audit event:', err)
  }
}