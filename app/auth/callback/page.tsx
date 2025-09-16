"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function handleCallback() {
      try {
        const hash = window.location.hash

        if (hash.includes("access_token")) {
          const params = new URLSearchParams(hash.substring(1))
          const access_token = params.get("access_token")
          const refresh_token = params.get("refresh_token")

          if (access_token && refresh_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            })

            if (error) {
              console.error("[AuthCallback] Erro ao ativar sessão:", error)
              router.push("/login?error=session")
              return
            }

            console.log("[AuthCallback] Sessão criada:", data.session?.user.email)
            router.push("/dashboard")
            return
          }
        }

        // fallback caso não tenha hash
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log("[AuthCallback] Sessão existente:", session.user.email)
          router.push("/dashboard")
        } else {
          console.warn("[AuthCallback] Nenhuma sessão encontrada, redirecionando pro login")
          router.push("/login")
        }
      } catch (err) {
        console.error("[AuthCallback] Erro inesperado:", err)
        router.push("/login?error=unexpected")
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-slate-600">Validando login...</p>
    </div>
  )
}
