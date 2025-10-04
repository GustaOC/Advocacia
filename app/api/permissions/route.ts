// app/api/permissions/route.ts

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

export async function GET() {
  try {
    // CORREÇÃO: A verificação de permissão agora é feita corretamente.
    await requirePermission('permissions:read')

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('permissions').select('*')

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    if (error.message === 'FORBIDDEN' || error.message === 'UNAUTHORIZED') {
      return new Response(error.message, { status: 403 })
    }
    console.error('[PERMISSIONS GET]', error)
    return new Response(error.message, { status: 500 })
  }
}