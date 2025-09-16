// app/api/clients/route.ts
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

const ClientSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(8).max(20).optional().nullable(),
  document: z.string().min(5).max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

export async function GET() {
  await requirePermission("CLIENTS_READ").catch(() => {})
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission("CLIENTS_CREATE")
    const body = await req.json()
    const parsed = ClientSchema.parse(body)
    const supabase = createAdminClient()
    const { data, error } = await supabase.from("clients").insert(parsed).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    if (e && typeof e === "object" && "issues" in e) {
      return NextResponse.json(
        { error: "Validação falhou", issues: e.issues },
        { status: 400 }
      )
    }

    if (e instanceof Error) {
      if (e.message === "FORBIDDEN" || e.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: e.message }, { status: 403 })
      }
      return NextResponse.json({ error: e.message || "Erro interno" }, { status: 500 })
    }

    // fallback genérico
    return NextResponse.json({ error: "Erro interno desconhecido" }, { status: 500 })
  }
}
