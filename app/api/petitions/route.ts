import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await requirePermission("PETITIONS_VIEW")

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const assignedTo = searchParams.get("assigned_to")

    const supabase = await createAdminClient()
    let query = supabase
      .from("petitions")
      .select(`
        *,
        created_by_employee:employees!created_by(name, email),
        assigned_to_employee:employees!assigned_to(name, email)
      `)
      .order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    if (assignedTo) {
      query = query.eq("assigned_to", assignedTo)
    }

    const { data: petitions, error } = await query

    if (error) throw error

    return NextResponse.json({ petitions })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("PETITIONS_CREATE")

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const deadline = formData.get("deadline") as string
    const assignedTo = formData.get("assigned_to") as string
    const createdBy = formData.get("created_by") as string
    const file = formData.get("file") as File

    if (!title || !deadline || !assignedTo || !createdBy || !file) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 })
    }

    // Simulate file upload (in real implementation, upload to storage)
    const fileName = `petition_${Date.now()}_${file.name}`
    const filePath = `/uploads/petitions/${fileName}`

    const supabase = await createAdminClient()
    const { data: petition, error } = await supabase
      .from("petitions")
      .insert({
        title,
        description,
        file_path: filePath,
        file_name: fileName,
        deadline,
        assigned_to: Number.parseInt(assignedTo),
        created_by: Number.parseInt(createdBy),
        status: "pending",
      })
      .select(`
        *,
        created_by_employee:employees!created_by(name, email),
        assigned_to_employee:employees!assigned_to(name, email)
      `)
      .single()

    if (error) throw error

    // Create notification for assigned lawyer
    await supabase.from("notifications").insert({
      user_id: Number.parseInt(assignedTo),
      title: "Nova Petição Atribuída",
      message: `Você recebeu uma nova petição para revisão: "${title}"`,
      type: "info",
      related_petition_id: petition.id,
    })

    return NextResponse.json({ petition })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
