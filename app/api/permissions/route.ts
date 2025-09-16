import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET() {
  try {
    await requirePermission("ROLES_MANAGE")

    const supabase = await createAdminClient()
    const { data: permissions, error } = await supabase.from("permissions").select("*").order("code")

    if (error) throw error

    return NextResponse.json({ permissions })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
