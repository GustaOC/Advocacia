// components/login-form.tsx - VERSÃO CORRIGIDA
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Card, CardHeader, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      console.log("[LoginForm] Iniciando login para:", email)
      
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json().catch(() => ({}))
      console.log("[LoginForm] Resposta da API:", { status: res.status, data })

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível entrar.")
      }

      // ✅ CORREÇÃO: Define cookies que o auth-guard espera
      if (typeof window !== "undefined") {
        document.cookie = "sb-auth-token-client=authenticated; path=/; max-age=604800"
        document.cookie = `user-info=${JSON.stringify({ email, id: data.user?.id || 'temp' })}; path=/; max-age=604800`
        sessionStorage.setItem("just-logged-in", "true")
        console.log("[LoginForm] ✅ Cookies e sessionStorage definidos")
      }

      console.log("[LoginForm] ✅ Login bem-sucedido, redirecionando...")
      
      // ✅ CORREÇÃO: Tempo maior para garantir que cookies sejam salvos
      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
      
    } catch (err: any) {
      console.error("[LoginForm] ❌ Erro no login:", err)
      setError(err?.message || "Erro ao entrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="space-y-1 text-center pb-8 pt-10">
        <div className="flex justify-center mb-4">
          <div className="relative w-48 h-16">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" priority />
          </div>
        </div>
        <CardDescription className="text-slate-600 text-base">
          Sistema de Gestão Jurídica
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-10">
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 border-slate-300 focus-visible:ring-slate-500 rounded-xl bg-white/60 backdrop-blur-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 border-slate-300 focus-visible:ring-slate-500 rounded-xl bg-white/60 backdrop-blur-sm pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-500"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-medium bg-slate-800 hover:bg-slate-900"
            disabled={loading}
          >
            {loading ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Entrando...</>) : "Acessar Sistema"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}