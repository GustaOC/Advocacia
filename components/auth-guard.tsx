// components/auth-guard.tsx - VERSÃO CORRIGIDA SEM LOOP
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
    
    const checkAuth = async () => {
      try {
        console.log("[AuthGuard] Iniciando verificação de autenticação...")
        
        // PRIMEIRA VERIFICAÇÃO: Flag just-logged-in (mais alta prioridade)
        if (typeof window !== 'undefined') {
          const justLoggedIn = sessionStorage.getItem('just-logged-in')
          if (justLoggedIn) {
            console.log("[AuthGuard] ✅ Flag just-logged-in encontrada - usuário acabou de fazer login")
            sessionStorage.removeItem('just-logged-in')
            if (mounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
            }
            return
          }
        }

        // SEGUNDA VERIFICAÇÃO: Cookies de client-side (definidos pelo login-form)
        if (typeof window !== 'undefined') {
          const cookies = document.cookie
          console.log("[AuthGuard] Verificando cookies client-side...")
          
          // Verifica os cookies que o login-form define
          const hasClientAuthCookie = cookies.includes('sb-auth-token-client=authenticated')
          const hasJustLoggedInCookie = cookies.includes('just-logged-in=true')
          
          if (hasClientAuthCookie || hasJustLoggedInCookie) {
            console.log("[AuthGuard] ✅ Cookies client-side válidos encontrados", {
              hasClientAuthCookie,
              hasJustLoggedInCookie
            })
            if (mounted) {
              setIsAuthenticated(true)
              setIsLoading(false)
            }
            return
          }
        }

        // TERCEIRA VERIFICAÇÃO: Sessão Supabase
        console.log("[AuthGuard] Verificando sessão Supabase...")
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (!error && user) {
          console.log("[AuthGuard] ✅ Sessão Supabase válida encontrada:", user.email)
          setIsAuthenticated(true)
          setIsLoading(false)
          return
        }

        // QUARTA VERIFICAÇÃO: Verificar se há dados do usuário no middleware
        // (O middleware já verificou e permitiu acesso, então deve estar autenticado)
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        })
        
        if (response.ok) {
          console.log("[AuthGuard] ✅ API /me retornou usuário válido")
          if (mounted) {
            setIsAuthenticated(true)
            setIsLoading(false)
          }
          return
        }

        // NENHUMA AUTENTICAÇÃO ENCONTRADA
        console.log("[AuthGuard] ❌ Nenhuma autenticação válida encontrada")
        if (mounted) {
          setIsAuthenticated(false)
          const redirectUrl = `${fallbackUrl}?from=${encodeURIComponent(pathname)}`
          console.log("[AuthGuard] Redirecionando para:", redirectUrl)
          router.push(redirectUrl)
          setIsLoading(false)
        }
        
      } catch (error) {
        console.error("[AuthGuard] Erro inesperado na verificação:", error)
        if (mounted) {
          setIsAuthenticated(false)
          router.push(fallbackUrl)
          setIsLoading(false)
        }
      }
    }
    
    // Executa verificação
    checkAuth()
    
    // Configura listener para mudanças de autenticação Supabase
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthGuard] Auth event: ${event}`)
      
      if (event === 'SIGNED_OUT') {
        console.log("[AuthGuard] Usuário deslogou")
        setIsAuthenticated(false)
        // Limpar todos os cookies de autenticação
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-auth-token-client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
          document.cookie = 'user-info=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
          document.cookie = 'just-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
        }
        router.push(fallbackUrl)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log("[AuthGuard] Usuário logou ou token renovado")
        setIsAuthenticated(true)
        // Define cookie de cliente para compatibilidade
        if (typeof window !== 'undefined') {
          document.cookie = 'sb-auth-token-client=authenticated; path=/; max-age=604800'
        }
      }
    })
    
    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [pathname, requiredPermission, fallbackUrl, router])
  
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
  
  // Verificação de permissão (se necessário)
  if (requiredPermission) {
    // Implementar verificação de permissão aqui se necessário
    // Por enquanto, sempre permite se autenticado
  }
  
  // Autenticado e com permissão
  return <>{children}</>
}

// Hook useAuth atualizado
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
  useEffect(() => {
    let mounted = true
    
    const loadUser = async () => {
      try {
        // Primeira tentativa: Supabase
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
          } else {
            // Segunda tentativa: API /me
            try {
              const response = await fetch('/api/auth/me', { 
                credentials: 'include' 
              })
              
              if (response.ok) {
                const userData = await response.json()
                setUser({
                  id: userData.user.id,
                  email: userData.user.email,
                  role: userData.user.role,
                  metadata: {}
                })
              }
            } catch (apiError) {
              console.warn("[useAuth] API /me falhou:", apiError)
            }
          }
        }
      } catch (error) {
        console.error("[useAuth] Erro ao carregar usuário:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    
    loadUser()
    
    // Listener para mudanças
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
      
      // Limpar todos os cookies
      if (typeof window !== 'undefined') {
        const cookiesToClear = [
          'sb-auth-token-client',
          'user-info', 
          'sb-access-token',
          'sb-refresh-token',
          'just-logged-in'
        ]
        
        cookiesToClear.forEach(cookieName => {
          document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`
        })
      }
      
      router.push('/login')
    } catch (error) {
      console.error("[useAuth] Erro no logout:", error)
      // Force redirect mesmo se houver erro
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }
  
  return { user, loading, logout }
}
