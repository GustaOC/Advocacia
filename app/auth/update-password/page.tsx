// app/auth/update-password/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

function parseHashParams(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""))
  return {
    type: params.get("type"),
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
  }
}

export default function UpdatePasswordPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    async function ensureSession() {
      try {
        // 1) já tem sessão via cookies? (ex.: pós-login com require_password_update)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setLoading(false)
          return
        }

        // 2) link novo (PKCE): ?code=...
        const code = search.get("code")
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession({ code })
          if (error) throw error
          setLoading(false)
          return
        }

        // 3) link “clássico”: #access_token=...&refresh_token=...
        const { access_token, refresh_token } = parseHashParams(window.location.hash || "")
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) throw error
          setLoading(false)
          return
        }

        // sem sessão e sem tokens → erro
        setError("Sessão de autenticação ausente. Abra o link de redefinição enviado ao seu email ou faça login novamente.")
      } catch (err: any) {
        setError(err?.message || "Falha ao iniciar sessão para redefinir a senha.")
      } finally {
        setLoading(false)
      }
    }

    ensureSession()
  }, [search])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.")
      return
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setOk(true)
      // pequena pausa p/ garantir persistência e renovar sessão
      setTimeout(() => router.push("/dashboard"), 500)
    } catch (err: any) {
      setError(err?.message || "Erro ao atualizar a senha.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
        <CardHeader className="text-center pt-8">
          <h1 className="text-xl font-semibold">Redefinir senha</h1>
          <CardDescription>Defina uma nova senha para a sua conta.</CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {ok && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertDescription className="text-green-700 text-sm">
                    Senha atualizada com sucesso. Redirecionando...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar nova senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitting || loading}>
                {submitting ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Atualizando…</>) : "Atualizar senha"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
