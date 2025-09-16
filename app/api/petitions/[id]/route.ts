import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("PETITIONS_VIEW")

    const supabase = await createAdminClient()
    const { data: petition, error } = await supabase
      .from("petitions")
      .select(`
        *,
        created_by_employee:employees!created_by(name, email),
        assigned_to_employee:employees!assigned_to(name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ petition })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("PETITIONS_REVIEW")

    const { lawyer_notes, final_verdict, status } = await request.json()

    const supabase = await createAdminClient()

    // Update petition
    const { data: petition, error } = await supabase
      .from("petitions")
      .update({
        lawyer_notes,
        final_verdict,
        status: status || (final_verdict ? "reviewed" : "under_review"),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(`
        *,
        created_by_employee:employees!created_by(name, email),
        assigned_to_employee:employees!assigned_to(name, email)
      `)
      .single()

    if (error) throw error

    // Create notification for the employee who created the petition
    if (final_verdict) {
      const notificationMessage =
        final_verdict === "approved"
          ? `Sua petição "${petition.title}" foi aprovada!`
          : final_verdict === "corrections_needed"
            ? `Sua petição "${petition.title}" precisa de correções.`
            : `Sua petição "${petition.title}" foi rejeitada.`

      await supabase.from("notifications").insert({
        user_id: petition.created_by,
        title: "Petição Revisada",
        message: notificationMessage,
        type: final_verdict === "approved" ? "success" : final_verdict === "rejected" ? "error" : "warning",
        related_petition_id: petition.id,
      })
    }

    return NextResponse.json({ petition })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
