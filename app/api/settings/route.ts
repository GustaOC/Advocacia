// app/api/settings/route.ts

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

export async function GET() {
  try {
    // CORREÇÃO: Chamada de permissão ajustada
    await requirePermission('settings:read')
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('settings').select('*')
    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
      return new Response(error.message, { status: 403 })
    }
    console.error('[SETTINGS GET]', error)
    return new Response(error.message, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    // CORREÇÃO: Chamada de permissão ajustada
    await requirePermission('settings:update')
    const settings = await req.json()
    const supabase = createSupabaseServerClient()

    const updates = settings.map((s: { id: string; value: any }) =>
      supabase.from('settings').update({ value: s.value }).eq('id', s.id)
    )

    const results = await Promise.all(updates)
    const error = results.find((r) => r.error)

    if (error) throw error.error

    return NextResponse.json({ message: 'Settings updated' })
  } catch (error: any) {
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
      return new Response(error.message, { status: 403 })
    }
    console.error('[SETTINGS PUT]', error)
    return new Response(error.message, { status: 500 })
  }
}