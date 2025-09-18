// lib/auth.ts
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  permissions?: string[];
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Tenta buscar dados adicionais da tabela employees
    const admin = createAdminClient();
    const { data: employeeData, error: employeeError } = await admin
      .from("employees")
      .select(`
        permissions,
        roles ( name )
      `)
      .eq("id", user.id) // Busca pelo ID do usuário autenticado
      .single();

    if (employeeError) {
      console.warn("Aviso ao buscar dados do funcionário:", employeeError.message);
      // Retorna usuário básico se não encontrar na tabela employees
      return { id: user.id, email: user.email ?? "", role: 'user', permissions: [] };
    }

    return {
      id: user.id,
      email: user.email ?? "",
      role: employeeData?.roles?.name || 'user',
      permissions: employeeData?.permissions || [],
    };
  } catch (error) {
    console.error("Erro inesperado em getSessionUser:", error);
    return null;
  }
}

// Funções requireAuth e requirePermission continuam as mesmas
export async function requireAuth(): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requirePermission(permission: string): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role === "admin" || (user.permissions && user.permissions.includes(permission))) {
    return user;
  }
  throw new Error("FORBIDDEN");
}