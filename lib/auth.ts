// lib/auth.ts - VERSÃO FINAL CORRIGIDA E COMPLETA

import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

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
    
    const { data: employee, error: employeeError } = await admin
      .from("employees")
      .select("id, role_id")
      .eq("id", authUser.id)
      .single();

    if (employeeError || !employee) {
      console.warn(`[Auth] Usuário ${authUser.email} autenticado, mas não encontrado na tabela 'employees'. Assumindo perfil básico sem permissões.`);
      const basicUser: AuthUser = {
        id: authUser.id,
        email: authUser.email ?? "",
        role: 'user',
        permissions: [],
      };
      userCache.set(authUser.id, { user: basicUser, timestamp: Date.now() });
      return basicUser;
    }

    let roleName = 'user';
    let permissions: Permission[] = [];

    if (employee.role_id) {
        // ✅ CORREÇÃO CRÍTICA: A sintaxe da consulta foi ajustada para buscar as permissões corretamente.
        // A consulta agora junta 'roles' -> 'role_permissions' -> 'permissions' e pega a coluna 'code'.
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
        console.error(`[Auth] Falha crítica ao buscar permissões para role_id ${employee.role_id}:`, roleError.message);
      } else if (roleData) {
        roleName = roleData.name;
        // O mapeamento dos resultados também foi ajustado para a nova estrutura da consulta.
        permissions = roleData.role_permissions.map((rp: any) => rp.permissions.code as Permission).filter(Boolean);
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
  console.error(`[Auth] Acesso negado para o usuário ${user.email}. Permissão necessária: '${permission}'. Permissões do usuário: [${user.permissions?.join(', ')}]`);
  throw new Error("FORBIDDEN");
}

export function clearAuthCache(userId: string) {
  if (userCache.has(userId)) {
    userCache.delete(userId);
    console.log(`[Auth] Cache limpo para o usuário: ${userId}`);
  }
}