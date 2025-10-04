// app/api/tools/migrate-employees/route.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ZodError } from 'zod'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

// NOTE: Rota de ferramenta para migrar usuários da tabela 'employees' para 'auth.users'
export async function GET() {
  try {
    // CORREÇÃO: Adicionada verificação de variáveis de ambiente
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || !supabaseUrl) {
      throw new Error(
        'Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    const supabase = createAdminClient()
    const { data: employees, error: fetchError } = await supabase
      .from('employees')
      .select('id, name, email')

    if (fetchError) throw fetchError

    const results = []
    for (const employee of employees) {
      const { data: authUser, error: authError } =
        await supabase.auth.admin.createUser({
          email: employee.email,
          password: 'defaultpassword', // Senha padrão, usuário deve alterar
          email_confirm: true,
          user_metadata: { name: employee.name },
        })

      if (authError) {
        results.push({ email: employee.email, status: 'error', message: authError.message })
      } else {
        // Atualiza o ID do funcionário para corresponder ao ID de autenticação
        const { error: updateError } = await supabase
          .from('employees')
          .update({ id: authUser.user.id })
          .eq('email', employee.email)
        
        if (updateError) {
            results.push({ email: employee.email, status: 'error', message: `Failed to update employee ID: ${updateError.message}` })
        } else {
            results.push({ email: employee.email, status: 'success', userId: authUser.user.id })
        }
      }
    }

    return NextResponse.json({
      message: 'Migração concluída.',
      results,
    })
  } catch (error: any) {
    console.error('[MIGRATE EMPLOYEES]', error)
    if (error instanceof ZodError) {
      return new Response(JSON.stringify(error.issues), { status: 400 })
    }
    return new Response(error.message, { status: 500 })
  }
}