// app/api/auth/logout/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  const supabase = createSupabaseServerClient(req, res)
  await supabase.auth.signOut()
  return res
}
