// app/api/employees/route.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
// CORREÇÃO: Não é mais necessário importar `getSessionUser` aqui, pois `requirePermission` já o utiliza.
import { requirePermission } from '@/lib/auth' 

export const dynamic = 'force-dynamic'

export async function GET() {
  // CORREÇÃO: A verificação de permissão já inclui a verificação de autenticação.
  // A chamada agora é feita com apenas um argumento.
  await requirePermission('users:read')

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('employees')
    .select('id, name, email, role, created_at, last_login')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Employees GET]', error)
    return new Response(error.message, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    // CORREÇÃO: A chamada agora é feita com apenas um argumento.
    await requirePermission('users:create')

    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role) {
      return new Response('Missing required fields', { status: 400 })
    }

    const supabase = createAdminClient()
    
    const {
      data: { users },
      error: listUsersError,
    } = await supabase.auth.admin.listUsers()

    if (listUsersError) {
      throw listUsersError
    }

    const existingUser = users.find((u) => u.email === email)

    if (existingUser) {
      return new Response('User with this email already exists', {
        status: 409,
      })
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    if (authError) throw authError

    const authUser = authData.user
    if (!authUser) throw new Error('Could not create user in auth')

    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .insert({
        id: authUser.id,
        name,
        email,
        role,
      })
      .select()
      .single()

    if (employeeError) throw employeeError

    return NextResponse.json(employeeData)
  } catch (error: any) {
    // Adiciona um tratamento de erro mais específico para permissão negada
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
        return new Response(error.message, { status: 403 })
    }
    console.error('[Employees POST]', error)
    return new Response(error.message, { status: 500 })
  }
}