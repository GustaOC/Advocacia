// app/api/notifications/count/route.ts

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = createSupabaseServerClient()
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      throw error
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (error: any) {
    console.error('[NOTIFICATIONS COUNT GET]', error)
    return new Response(error.message, { status: 500 })
  }
}