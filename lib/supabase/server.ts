// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr"
import type { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js"

/**
 * Client SSR que lê e escreve cookies (Set-Cookie) corretamente.
 */
export function createSupabaseServerClient(req?: NextRequest, res?: NextResponse) {
  const cookieStore = cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error("Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      set(name, value, options) {
        if (res) {
          res!.cookies.set({ name, value, ...(options as any) })
        } else {
          cookieStore.set(name, value, options as any)
        }
      },
      remove(name, options) {
        if (res) {
          res!.cookies.set({ name, value: "", ...(options as any), expires: new Date(0) })
        } else {
          cookieStore.set(name, "", { ...(options as any), expires: new Date(0) })
        }
      },
    },
  })
}

/**
 * Admin client – usar SOMENTE no servidor (Route Handlers / Server Actions).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } })
}
