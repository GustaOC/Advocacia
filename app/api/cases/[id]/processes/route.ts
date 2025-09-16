import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("CASES_VIEW")

    const caseId = parseInt(params.id)
    if (isNaN(caseId)) {
      return NextResponse.json({ error: "ID de caso inválido" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "100")

    const supabase = await createAdminClient()

    // Verifica se o caso existe
    const { data: caseExists, error: caseError } = await supabase
      .from("cases")
      .select("id, name")
      .eq("id", caseId)
      .single()

    if (caseError || !caseExists) {
      return NextResponse.json({ error: "Caso não encontrado" }, { status: 404 })
    }

    // Busca processos vinculados ao caso
    let query = supabase
      .from("processes")
      .select(`
        id,
        number,
        client_id,
        client_name,
        type,
        status,
        court,
        value,
        source,
        store,
        last_update,
        next_deadline,
        created_at,
        updated_at,
        case_id
      `)
      .eq("case_id", caseId)
      .order("last_update", { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq("status", status)
    }

    const { data: processes, error } = await query

    if (error) throw error

    return NextResponse.json({ 
      processes: processes || [],
      case: caseExists 
    })
  } catch (error) {
    console.error("[cases/[id]/processes/GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}
