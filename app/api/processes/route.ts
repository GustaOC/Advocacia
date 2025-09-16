import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requirePermission("PROCESSES_VIEW")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const caseId = searchParams.get("case_id")
    const search = searchParams.get("search")
    const court = searchParams.get("court")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")

    const supabase = await createAdminClient()
    
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
      .order("last_update", { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq("status", status)
    }

    if (caseId) {
      query = query.eq("case_id", parseInt(caseId))
    }

    if (court) {
      query = query.eq("court", court)
    }

    if (search) {
      query = query.or(`number.ilike."%${search}%",client_name.ilike."%${search}%",type.ilike."%${search}%"`)
    }

    const { data: processes, error } = await query

    if (error) throw error

    // Buscar total de registros para paginação
    let countQuery = supabase
      .from("processes")
      .select("id", { count: "exact", head: true })

    if (status) countQuery = countQuery.eq("status", status)
    if (caseId) countQuery = countQuery.eq("case_id", parseInt(caseId))
    if (court) countQuery = countQuery.eq("court", court)
    if (search) countQuery = countQuery.or(`number.ilike."%${search}%",client_name.ilike."%${search}%",type.ilike."%${search}%"`)

    const { count, error: countError } = await countQuery

    if (countError) console.error("Error getting count:", countError)

    return NextResponse.json({ 
      processes: processes || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error("[processes/GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("PROCESSES_CREATE")

    const body = await request.json()
    const {
      number,
      client_id,
      client_name,
      type,
      court,
      value,
      source,
      store,
      next_deadline,
      case_id
    } = body

    if (!number || !client_name || !type) {
      return NextResponse.json(
        { error: "Número do processo, nome do cliente e tipo são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verifica se o processo já existe
    const { data: existingProcess } = await supabase
      .from("processes")
      .select("id")
      .eq("number", number)
      .single()

    if (existingProcess) {
      return NextResponse.json(
        { error: "Processo com este número já existe" },
        { status: 409 }
      )
    }

    const { data: process, error } = await supabase
      .from("processes")
      .insert({
        number,
        client_id: client_id ? parseInt(client_id) : null,
        client_name,
        type,
        status: "Em andamento",
        court: court || null,
        value: value ? parseFloat(value) : null,
        source: source || null,
        store: store || null,
        last_update: new Date().toISOString(),
        next_deadline: next_deadline || null,
        case_id: case_id ? parseInt(case_id) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ process }, { status: 201 })
  } catch (error) {
    console.error("[processes/POST] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("PROCESSES_EDIT")

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID do processo é obrigatório" },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verifica se o processo existe
    const { data: existingProcess, error: fetchError } = await supabase
      .from("processes")
      .select("id")
      .eq("id", parseInt(id))
      .single()

    if (fetchError || !existingProcess) {
      return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 })
    }

    // Prepara dados para atualização
    const finalUpdateData = {
      ...updateData,
      updated_at: new Date().toISOString(),
      last_update: new Date().toISOString(),
    }

    // Remove campos undefined
    Object.keys(finalUpdateData).forEach(key => 
      finalUpdateData[key] === undefined && delete finalUpdateData[key]
    )

    const { data: process, error } = await supabase
      .from("processes")
      .update(finalUpdateData)
      .eq("id", parseInt(id))
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ process })
  } catch (error) {
    console.error("[processes/PUT] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}
