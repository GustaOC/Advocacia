// app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const res = NextResponse.json({ ok: true })
  const supabase = createSupabaseServerClient(req, res)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  // Cookies do Supabase foram escritos em 'res' via adapter
  return res
}
