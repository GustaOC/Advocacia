// app/auth/update-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Verificar se há tokens de recuperação na URL
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    
    console.log('[UpdatePassword] Tokens encontrados:', { 
      accessToken: !!accessToken, 
      refreshToken: !!refreshToken 
    })

    // Se houver tokens, configurar a sessão
    if (accessToken && refreshToken) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    }
  }, [searchParams, supabase.auth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validações básicas
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    try {
      console.log('[UpdatePassword] Tentando atualizar senha...')
      
      // Atualizar senha usando Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        console.error('[UpdatePassword] Erro ao atualizar:', updateError)
        setError(`Erro ao atualizar senha: ${updateError.message}`)
        return
      }

      console.log('[UpdatePassword] Senha atualizada com sucesso!')
      setSuccess(true)

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push('/login?message=password-updated')
      }, 3000)

    } catch (error: any) {
      console.error('[UpdatePassword] Erro inesperado:', error)
      setError("Erro inesperado. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl">
          <CardContent className="p-10 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Senha Atualizada!</h2>
            <p className="text-slate-600 mb-6">
              Sua senha foi atualizada com sucesso. Você será redirecionado para a página de login.
            </p>
            <div className="animate-pulse">
              <div className="h-2 bg-slate-200 rounded-full mb-2"></div>
              <p className="text-sm text-slate-500">Redirecionando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4">
      <div className="w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 pt-8">
            <CardTitle className="text-2xl font-bold text-slate-800">
              Atualizar Senha
            </CardTitle>
            <CardDescription className="text-slate-600">
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nova Senha */}
              <div className="space-y-3">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Nova Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-xl bg-white/50 backdrop-blur-sm pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-slate-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
                  Confirmar Nova Senha
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite novamente sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-12 border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-xl bg-white/50 backdrop-blur-sm"
                />
              </div>

              {/* Erro */}
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Botão de submit */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white font-semibold text-base rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  "Atualizar Senha"
                )}
              </Button>

              {/* Link de voltar */}
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-slate-600 hover:text-slate-800"
                >
                  Voltar ao Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
