// api employees route
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    await requirePermission("EMPLOYEES_VIEW")

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role")
    const isActive = searchParams.get("is_active")

    const supabase = await createAdminClient()
    let query = supabase
      .from("employees")
      .select("id, name, email, role, permissions, is_active, created_at, updated_at")
      .order("created_at", { ascending: false })

    if (role) {
      query = query.eq("role", role)
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }

    const { data: employees, error } = await query

    if (error) throw error

    return NextResponse.json({ employees })
  } catch (error) {
    console.error("[employees/GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission("EMPLOYEES_CREATE")

    const body = await request.json()
    const { name, email, role, permissions, password } = body

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Nome, email, cargo e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10)

    const supabase = await createAdminClient()

    // Verifica se o email já existe
    const { data: existingEmployee } = await supabase
      .from("employees")
      .select("id")
      .eq("email", email)
      .single()

    if (existingEmployee) {
      return NextResponse.json(
        { error: "Email já está em uso" },
        { status: 409 }
      )
    }

    const { data: employee, error } = await supabase
      .from("employees")
      .insert({
        name,
        email,
        role,
        permissions: permissions || [],
        password_hash: passwordHash,
        is_active: true,
      })
      .select("id, name, email, role, permissions, is_active, created_at")
      .single()

    if (error) throw error

    return NextResponse.json({ employee }, { status: 201 })
  } catch (error) {
    console.error("[employees/POST] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    )
  }
}
