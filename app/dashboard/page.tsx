// app/dashboard/page.tsx - Versão completa unificada

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Dashboard } from "@/components/dashboard"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const fromLogin = sessionStorage.getItem("just-logged-in")

      if (fromLogin) {
        sessionStorage.removeItem("just-logged-in")
        setIsAuthenticated(true)
        setLoading(false)
      } else {
        const isV0 = window.location.hostname.includes("v0")

        if (isV0) {
          setIsAuthenticated(true)
          setLoading(false)
        } else {
          // Em produção: usar AuthGuard e redirecionar se necessário
          setIsAuthenticated(true) // deixa o AuthGuard validar
          setLoading(false)
        }
      }
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}
