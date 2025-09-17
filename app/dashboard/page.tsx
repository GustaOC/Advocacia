// app/dashboard/page.tsx - VERSÃO CORRIGIDA

"use client"

import { useEffect, useState } from "react"
import { Dashboard } from "@/components/dashboard" // ✅ CORREÇÃO: Import nomeado
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log("[DashboardPage] Inicializando...")
    setIsClient(true)
    
    const checkInitialAuth = () => {
      try {
        if (typeof window !== "undefined") {
          const fromLogin = sessionStorage.getItem("just-logged-in")
          if (fromLogin) {
            console.log("[DashboardPage] ✅ Usuário acabou de fazer login")
            sessionStorage.removeItem("just-logged-in")
          }
          
          const isV0 = window.location.hostname.includes("v0") || 
                       window.location.hostname.includes("localhost")
          if (isV0) {
            console.log("[DashboardPage] ✅ Ambiente de desenvolvimento detectado")
          }
        }
        
        console.log("[DashboardPage] Verificação inicial concluída")
      } catch (error) {
        console.warn("[DashboardPage] Erro na verificação inicial:", error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(checkInitialAuth, 100)
    
    return () => clearTimeout(timer)
  }, [])

  if (!isClient || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto"></div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-slate-600 font-medium">Carregando dashboard...</p>
          <p className="text-slate-500 text-sm">Verificando autenticação e carregando módulos</p>
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