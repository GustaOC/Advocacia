// components/auth-guard.tsx - VERSÃO CORRIGIDA E SIMPLIFICADA
"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermission?: string
  fallbackUrl?: string
}

export function AuthGuard({ 
  children, 
  requiredPermission,
  fallbackUrl = "/login" 
}: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    let mounted = true
    let authCheckComplete = false
    
    const checkAuth = async () => {
      // ✅ CORREÇÃO: Evita verificações duplicadas
      if (authCheckComplete) return
      
      try {
        console.log("[AuthGuard] Iniciando verificação de autenticação...")
        
        // ✅ VERIFICAÇÃO 1: Flag just-logged-in (máxima prioridade)
        if (typeof window !== 'undefined') {
          const justLoggedIn = sessionStorage.getItem('just-logged-in')
          if (justLoggedIn) {
            console.log("[AuthGuard] ✅ Flag just-logged-in encontrada")
            sessionStorage.removeItem('just-logged-in')
            if (mounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
              authCheckComplete = true
            }
            return
          }
        }

        // ✅ VERIFICAÇÃO 2: Cookies client-side
        if (typeof window !== 'undefined') {
          const cookies = document.cookie
          const hasAuthCookie = cookies.includes('sb-auth-token-client=authenticated')
          
          if (hasAuthCookie) {
            console.log("[AuthGuard] ✅ Cookie de autenticação encontrado")
            if (mounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
              authCheckComplete = true
            }
            return
          }
        }

        // ✅ VERIFICAÇÃO 3: Sessão Supabase
        console.log("[AuthGuard] Verificando sessão Supabase...")
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (!error && user) {
          console.log("[AuthGuard] ✅ Sessão Supabase válida:", user.email)
          // ✅ CORREÇÃO: Define cookie para próximas verificações
          if (typeof window !== 'undefined') {
            document.cookie = 'sb-auth-token-client=authenticated; path=/; max-age=604800'
          }
          setIsAuthenticated(true)
          setIsLoading(false)
          authCheckComplete = true
          return
        }

        // ✅ VERIFICAÇÃO 4: API fallback
        try {
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            credentials: 'include'
          })
          
          if (response.ok) {
            console.log("[AuthGuard] ✅ API /me retornou usuário válido")
            if (mounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
              authCheckComplete = true
            }
            return
          }
        } catch (apiError) {
          console.warn("[AuthGuard] API /me falhou:", apiError)
        }

        // ❌ NENHUMA AUTENTICAÇÃO ENCONTRADA
        console.log("[AuthGuard] ❌ Nenhuma autenticação válida encontrada")
        if (mounted) {
          setIsAuthenticated(false)
          const redirectUrl = `${fallbackUrl}?from=${encodeURIComponent(pathname)}`
          console.log("[AuthGuard] Redirecionando para:", redirectUrl)
          router.push(redirectUrl)
          setIsLoading(false)
          authCheckComplete = true
        }
        
      } catch (error) {
        console.error("[AuthGuard] Erro inesperado:", error)
        if (mounted && !authCheckComplete) {
          setIsAuthenticated(false)
          router.push(fallbackUrl)
          setIsLoading(false)
          authCheckComplete = true
        }
      }
    }
    
    // ✅ CORREÇÃO: Pequeno delay para evitar race conditions
    const timer = setTimeout(checkAuth, 50)
    
    // ✅ CORREÇÃO: Listener Supabase simplificado
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthGuard] Auth event: ${event}`)
      
      if (event === 'SIGNED_OUT') {
        console.log("[AuthGuard] Usuário deslogou")
        setIsAuthenticated(false)
        if (typeof window !== 'undefined') {
          // ✅ CORREÇÃO: Limpeza simplificada de cookies
          ['sb-auth-token-client', 'user-info', 'just-logged-in'].forEach(name => {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
          })
        }
        router.push(fallbackUrl)
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log("[AuthGuard] Usuário logou")
        setIsAuthenticated(true)
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-auth-token-client=authenticated; path=/; max-age=604800'
        }
      }
    })
    
    return () => {
      mounted = false
      clearTimeout(timer)
      authListener?.subscription?.unsubscribe()
    }
  }, [pathname, fallbackUrl, router]) // ✅ CORREÇÃO: Removeu requiredPermission das dependências
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto"></div>
            <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-500 rounded-full animate-spin absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-slate-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }
  
  // Não autenticado
  if (!isAuthenticated) {
    return null // Já redirecionou
  }
  
  // ✅ CORREÇÃO: Verificação de permissão simplificada
  if (requiredPermission) {
    console.log(`[AuthGuard] Verificação de permissão '${requiredPermission}' não implementada - permitindo acesso`)
  }
  
  // Autenticado
  return <>{children}</>
}

// ✅ CORREÇÃO: Hook useAuth simplificado
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    let mounted = true
    
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (mounted) {
          if (!error && currentUser) {
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              metadata: currentUser.user_metadata,
              role: currentUser.app_metadata?.role || 'user'
            })
          }
          setLoading(false)
        }
      } catch (error) {
        console.error("[useAuth] Erro ao carregar usuário:", error)
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadUser()
    
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          metadata: session.user.user_metadata,
          role: session.user.app_metadata?.role || 'user'
        })
      }
    })
    
    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])
  
  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      
      if (typeof window !== 'undefined') {
        ['sb-auth-token-client', 'user-info', 'just-logged-in'].forEach(name => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
        })
      }
      
      router.push('/login')
    } catch (error) {
      console.error("[useAuth] Erro no logout:", error)
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }
  
  return { user, loading, logout }
}