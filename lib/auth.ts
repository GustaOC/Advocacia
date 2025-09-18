// lib/auth.ts - VERSÃO CORRIGIDA

import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

// Cache simples em memória para os dados do usuário para otimizar performance
const userCache = new Map<string, { user: AuthUser, timestamp: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos

export type Permission = string;

export interface Role {
  id: number;
  name: string;
  permissions: Permission[];
}

export interface AuthUser {
  id: string;
  email: string;
  role?: string;
  permissions?: Permission[];
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
    
    // ✅ CORREÇÃO PRINCIPAL: Alterado de 'auth_id' para 'id'.
    // A tabela 'employees' deve usar o UUID do 'auth.users' como sua chave primária ('id').
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id, role_id")
      .eq("id", authUser.id) // A busca agora é pelo 'id' do funcionário, que é o mesmo do usuário.
      .single();

    if (employeeError) {
      console.warn(`[Auth] Funcionário não encontrado para o usuário ${authUser.email}. Verifique se existe um registro correspondente na tabela 'employees'.`, employeeError.message);
      const basicUser: AuthUser = { id: authUser.id, email: authUser.email ?? "", role: 'user', permissions: [] };
      userCache.set(authUser.id, { user: basicUser, timestamp: Date.now() });
      return basicUser;
    }

    let roleName = 'user';
    let permissions: Permission[] = [];

    if (employee.role_id) {
      const { data: roleData, error: roleError } = await admin
        .from("roles")
        .select(`
          name,
          role_permissions (
            permission
          )
        `)
        .eq("id", employee.role_id)
        .single();

      if (roleError) {
        console.warn(`[Auth] Falha ao buscar detalhes da role_id ${employee.role_id}:`, roleError.message);
      } else if (roleData) {
        roleName = roleData.name;
        permissions = roleData.role_permissions.map((rp: any) => rp.permission as Permission);
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

export async function requirePermission(permission: Permission): Promise<AuthUser> {
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