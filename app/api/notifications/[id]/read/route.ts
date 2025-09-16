import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("NOTIFICATIONS_UPDATE")

    const supabase = await createAdminClient()
    const { data: notification, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ notification })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
