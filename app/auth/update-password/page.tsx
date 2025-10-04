"use client"

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

/**
 * Componente interno que contém a lógica do formulário.
 * Isso é necessário para que o uso do hook `useSearchParams`
 * seja envolvido pelo Suspense na página principal.
 */
function UpdatePasswordForm() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  // Captura o 'code' da URL, que é necessário para a troca de senha
  const code = searchParams.get('code')
  const apiClient = new ApiClient()

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const password = new FormData(event.currentTarget).get('password') as string

    // Verifica se a senha e o código existem
    if (!password) {
      toast({
        title: 'Erro',
        description: 'Por favor, digite sua nova senha.',
        variant: 'destructive',
      })
      return
    }

    if (!code) {
      toast({
        title: 'Erro de Verificação',
        description: 'Código de verificação não encontrado. Por favor, tente o processo de recuperação de senha novamente.',
        variant: 'destructive',
      })
      return
    }

    try {
      // Chama a API para definir a nova senha
      await apiClient.setPassword({ code, password })
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi atualizada. Você já pode fazer login com a nova senha.',
      })
      // Opcional: redirecionar o usuário para a página de login após o sucesso.
      // window.location.href = '/login';
    } catch (error: any) {
      toast({
        title: 'Falha ao atualizar a senha',
        description: error.message || 'Ocorreu um erro desconhecido.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Atualizar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Digite sua nova senha"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Atualizar Senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Página de atualização de senha.
 * O componente Suspense exibe um fallback (como um texto de "Carregando...")
 * enquanto o Next.js prepara o componente cliente que precisa ler os parâmetros da URL.
 */
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <UpdatePasswordForm />
    </Suspense>
  )
}