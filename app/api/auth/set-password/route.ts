// app/api/auth/set-password/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    if (!password) return NextResponse.json({ error: "Nova senha é obrigatória." }, { status: 400 })

    const res = NextResponse.json({ ok: true })
    const supabase = createSupabaseServerClient(req, res)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: res.headers })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Erro interno" }, { status: 500 })
  }
}
