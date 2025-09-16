// lib/auth.ts
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server"

export interface AuthUser {
  id: string
  email: string
  role?: string
  permissions?: string[]
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Enriquecer (opcional) com 'employees' se existir
  try {
    const admin = createAdminClient()
    const { data } = await admin.from("employees").select("role, permissions").eq("email", user.email).maybeSingle()
    return { id: user.id, email: user.email ?? "", role: data?.role, permissions: (data?.permissions as any) ?? [] }
  } catch {
    return { id: user.id, email: user.email ?? "" }
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const u = await getSessionUser()
  if (!u) throw new Error("UNAUTHORIZED")
  return u
}

export async function requirePermission(perm: string) {
  const u = await requireAuth()
  const perms = (u.permissions ?? []) as string[]
  if (u.role === "admin") return u
  if (!perms.includes(perm)) throw new Error("FORBIDDEN")
  return u
}
