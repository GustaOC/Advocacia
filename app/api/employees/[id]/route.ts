//api employees id route
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("EMPLOYEES_VIEW")

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: employee, error } = await supabase
      .from("employees")
      .select("id, name, email, role, permissions, is_active, created_at, updated_at")
      .eq("id", id)
      .single()

    if (error || !employee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ employee })
  } catch (error) {
    console.error("[employees/[id]/GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("EMPLOYEES_EDIT")

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { name, email, role, permissions, password, is_active } = body

    const supabase = await createAdminClient()

    // Verifica se o funcionário existe
    const { data: existingEmployee, error: fetchError } = await supabase
      .from("employees")
      .select("id, email")
      .eq("id", id)
      .single()

    if (fetchError || !existingEmployee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    // Se mudou o email, verifica se não está em uso por outro funcionário
    if (email && email !== existingEmployee.email) {
      const { data: emailInUse } = await supabase
        .from("employees")
        .select("id")
        .eq("email", email)
        .neq("id", id)
        .single()

      if (emailInUse) {
        return NextResponse.json({ error: "Email já está em uso" }, { status: 409 })
      }
    }

    // Prepara dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (permissions) updateData.permissions = permissions
    if (typeof is_active === "boolean") updateData.is_active = is_active

    // Se enviou nova senha, faz o hash
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10)
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id)
      .select("id, name, email, role, permissions, is_active, created_at, updated_at")
      .single()

    if (error) throw error

    return NextResponse.json({ employee })
  } catch (error) {
    console.error("[employees/[id]/PUT] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requirePermission("EMPLOYEES_DELETE")

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Verifica se o funcionário existe
    const { data: existingEmployee, error: fetchError } = await supabase
      .from("employees")
      .select("id, name")
      .eq("id", id)
      .single()

    if (fetchError || !existingEmployee) {
      return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
    }

    // Em vez de deletar, desativa o funcionário (soft delete)
    const { data: employee, error } = await supabase
      .from("employees")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, name, email, is_active")
      .single()

    if (error) throw error

    return NextResponse.json({
      message: "Funcionário desativado com sucesso",
      employee,
    })
  } catch (error) {
    console.error("[employees/[id]/DELETE] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}
