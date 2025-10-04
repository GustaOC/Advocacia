// app/api/profile/route.ts

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

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('[PROFILE GET]', error)
    return new Response(error.message, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { name } = await req.json()
    if (!name) {
      return new Response('Missing name', { status: 400 })
    }

    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('employees')
      .update({ name })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('[PROFILE PUT]', error)
    return new Response(error.message, { status: 500 })
  }
}