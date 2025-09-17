// lib/auth.ts - VERSÃO CORRIGIDA
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server"

export interface AuthUser {
  id: string
  email: string
  role?: string
  permissions?: string[]
}

// ✅ CORREÇÃO: Cache simples para evitar verificações repetidas
const userCache = new Map<string, { user: AuthUser; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

function getCachedUser(userId: string): AuthUser | null {
  const cached = userCache.get(userId)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Auth] ✅ Usuário encontrado em cache: ${cached.user.email}`)
    return cached.user
  }
  return null
}

function setCachedUser(user: AuthUser): void {
  userCache.set(user.id, { user, timestamp: Date.now() })
}

function clearUserCache(userId?: string): void {
  if (userId) {
    userCache.delete(userId)
  } else {
    userCache.clear()
  }
}

// ✅ CORREÇÃO: Função principal melhorada
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    console.log("[Auth] Verificando sessão do usuário...")
    
    const supabase = createSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.warn("[Auth] ❌ Erro na verificação de sessão:", error.message)
      return null
    }
    
    if (!user) {
      console.log("[Auth] ❌ Nenhum usuário na sessão")
      return null
    }

    console.log(`[Auth] ✅ Usuário base encontrado: ${user.email}`)

    // ✅ CORREÇÃO: Verificar cache primeiro
    const cachedUser = getCachedUser(user.id)
    if (cachedUser) {
      return cachedUser
    }

    // ✅ CORREÇÃO: Enriquecimento opcional com dados de employees
    let authUser: AuthUser = {
      id: user.id,
      email: user.email ?? "",
      role: 'user',
      permissions: []
    }

    try {
      console.log("[Auth] Buscando dados adicionais do usuário...")
      const admin = createAdminClient()
      
      const { data: employeeData, error: employeeError } = await admin
        .from("employees")
        .select("role, permissions")
        .eq("email", user.email)
        .maybeSingle()

      if (employeeError) {
        console.warn("[Auth] ⚠️  Erro ao buscar dados de employee (continuando com dados básicos):", employeeError.message)
      } else if (employeeData) {
        console.log(`[Auth] ✅ Dados de employee encontrados:`, { role: employeeData.role })
        authUser.role = employeeData.role || 'user'
        authUser.permissions = Array.isArray(employeeData.permissions) 
          ? employeeData.permissions 
          : []
      } else {
        console.log("[Auth] ℹ️  Usuário não encontrado na tabela employees (usando dados básicos)")
      }

    } catch (enrichmentError) {
      console.warn("[Auth] ⚠️  Erro no enriquecimento de dados (continuando com dados básicos):", enrichmentError)
    }

    // ✅ CORREÇÃO: Cache o resultado
    setCachedUser(authUser)
    
    console.log(`[Auth] ✅ Sessão do usuário verificada:`, {
      email: authUser.email,
      role: authUser.role,
      permissions: authUser.permissions?.length || 0
    })
    
    return authUser

  } catch (error) {
    console.error("[Auth] ❌ Erro inesperado na verificação de sessão:", error)
    return null
  }
}

// ✅ CORREÇÃO: Função com melhor error handling
export async function requireAuth(): Promise<AuthUser> {
  console.log("[Auth] Verificando autenticação obrigatória...")
  
  const user = await getSessionUser()
  
  if (!user) {
    console.error("[Auth] ❌ Acesso negado: usuário não autenticado")
    throw new Error("UNAUTHORIZED")
  }
  
  console.log(`[Auth] ✅ Autenticação confirmada para: ${user.email}`)
  return user
}

// ✅ CORREÇÃO: Verificação de permissão melhorada
export async function requirePermission(permission: string): Promise<AuthUser> {
  console.log(`[Auth] Verificando permissão obrigatória: ${permission}`)
  
  const user = await requireAuth()
  
  // Admin sempre tem todas as permissões
  if (user.role === "admin") {
    console.log(`[Auth] ✅ Permissão '${permission}' concedida (admin): ${user.email}`)
    return user
  }
  
  const userPermissions = (user.permissions ?? []) as string[]
  
  if (!userPermissions.includes(permission)) {
    console.error(`[Auth] ❌ Permissão '${permission}' negada para: ${user.email}`, {
      userRole: user.role,
      userPermissions
    })
    throw new Error("FORBIDDEN")
  }
  
  console.log(`[Auth] ✅ Permissão '${permission}' concedida para: ${user.email}`)
  return user
}

// ✅ CORREÇÃO: Função auxiliar para verificar role específica
export async function requireRole(role: string): Promise<AuthUser> {
  console.log(`[Auth] Verificando role obrigatória: ${role}`)
  
  const user = await requireAuth()
  
  if (user.role !== role && user.role !== "admin") {
    console.error(`[Auth] ❌ Role '${role}' negada para: ${user.email} (role atual: ${user.role})`)
    throw new Error("FORBIDDEN")
  }
  
  console.log(`[Auth] ✅ Role '${role}' confirmada para: ${user.email}`)
  return user
}

// ✅ CORREÇÃO: Função para logout (limpa cache)
export function clearAuthCache(userId?: string): void {
  console.log("[Auth] Limpando cache de autenticação", userId ? `para usuário: ${userId}` : "(todos)")
  clearUserCache(userId)
}

// ✅ CORREÇÃO: Função para debug (apenas em desenvolvimento)
export function getAuthCacheStats(): { size: number; entries: string[] } {
  if (process.env.NODE_ENV !== 'development') {
    return { size: 0, entries: [] }
  }
  
  return {
    size: userCache.size,
    entries: Array.from(userCache.keys())
  }
}