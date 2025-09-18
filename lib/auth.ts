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

    // Verifica o cache primeiro
    const cachedEntry = userCache.get(authUser.id);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_DURATION_MS)) {
      return cachedEntry.user;
    }

    const admin = createAdminClient();
    const { data: employeeData, error: employeeError } = await admin
      .from("employees")
      .select(`
        permissions,
        roles ( name )
      `)
      .eq("id", authUser.id)
      .single();

    if (employeeError) {
      console.warn(`[Auth] Aviso ao buscar dados do funcionário para ${authUser.email}:`, employeeError.message);
      const basicUser: AuthUser = { id: authUser.id, email: authUser.email ?? "", role: 'user', permissions: [] };
      userCache.set(authUser.id, { user: basicUser, timestamp: Date.now() });
      return basicUser;
    }

    const user: AuthUser = {
      id: authUser.id,
      email: authUser.email ?? "",
      role: employeeData?.roles?.name || 'user',
      permissions: employeeData?.permissions || [],
    };

    // Armazena no cache
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

/**
 * Limpa o cache de um usuário específico. Útil após logout ou atualização de permissões.
 * @param userId - O ID do usuário a ser removido do cache.
 */
export function clearAuthCache(userId: string) {
  if (userCache.has(userId)) {
    userCache.delete(userId);
    console.log(`[Auth] Cache limpo para o usuário: ${userId}`);
  }
}