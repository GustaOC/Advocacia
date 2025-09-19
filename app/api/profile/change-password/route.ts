import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get current password hash
    const { data: employee, error: fetchError } = await supabase
      .from("employees")
      .select("password_hash")
      .eq("id", user.id)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, employee.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from("employees")
      .update({ password_hash: newPasswordHash })
      .eq("id", user.id)

    if (updateError) throw updateError

    return NextResponse.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
