// lib/auth.ts
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

// Cache simples em memória para os dados do usuário
const userCache = new Map<string, { user: AuthUser, timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  permissions?: string[];
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return null;
    }

    const cachedEntry = userCache.get(authUser.id);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
      return cachedEntry.user;
    }

    const admin = createAdminClient();
    
    // ✅ CORREÇÃO: Etapa 1 - Buscar o funcionário e sua role_id
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id, role_id")
      .eq("id", authUser.id)
      .single();

    if (employeeError) {
      console.warn(`[Auth] Falha ao buscar funcionário para ${authUser.email}:`, employeeError.message);
      const basicUser: AuthUser = { id: authUser.id, email: authUser.email ?? "", role: 'user', permissions: [] };
      userCache.set(authUser.id, { user: basicUser, timestamp: Date.now() });
      return basicUser;
    }

    let roleName = 'user';
    let permissions: string[] = [];

    // ✅ CORREÇÃO: Etapa 2 - Se houver uma role_id, buscar os detalhes da função e suas permissões
    if (employee.role_id) {
      const { data: roleData, error: roleError } = await admin
        .from("roles")
        .select(`
          name,
          role_permissions (
            permissions ( code )
          )
        `)
        .eq("id", employee.role_id)
        .single();

      if (roleError) {
        console.warn(`[Auth] Falha ao buscar detalhes da role_id ${employee.role_id}:`, roleError.message);
      } else {
        roleName = roleData.name;
        permissions = roleData.role_permissions.map((rp: any) => rp.permissions.code);
      }
    }

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email ?? "",
      role: roleName,
      permissions: permissions,
    };

    userCache.set(user.id, { user, timestamp: Date.now() });

    return user;
  } catch (error) {
    console.error("[Auth] Erro inesperado em getSessionUser:", error);
    return null;
  }
}

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

export function clearAuthCache(userId: string) {
  if (userCache.has(userId)) {
    userCache.delete(userId);
    console.log(`[Auth] Cache limpo para o usuário: ${userId}`);
  }
}