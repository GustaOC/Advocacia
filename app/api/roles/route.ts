// app/api/roles/route.ts

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

export async function GET() {
  try {
    // CORREÇÃO: Chamada de permissão ajustada
    await requirePermission('roles:read')
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('roles').select('*, permissions:role_permissions(permission_id)')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
      return new Response(error.message, { status: 403 })
    }
    console.error('[ROLES GET]', error)
    return new Response(error.message, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    // CORREÇÃO: Chamada de permissão ajustada
    await requirePermission('roles:create')
    const { name, permissions } = await req.json()

    if (!name || !permissions) {
      return new Response('Missing required fields', { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { data: role, error } = await supabase
      .from('roles')
      .insert({ name })
      .select()
      .single()

    if (error) throw error

    const { error: permissionsError } = await supabase
      .from('role_permissions')
      .insert(
        permissions.map((p: number) => ({
          role_id: role.id,
          permission_id: p,
        })),
      )

    if (permissionsError) throw permissionsError

    return NextResponse.json(role)
  } catch (error: any) {
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
        return new Response(error.message, { status: 403 })
    }
    console.error('[ROLES POST]', error)
    return new Response(error.message, { status: 500 })
  }
}