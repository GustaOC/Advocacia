import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação via JWT
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verificar permissão manualmente
    if (!user.permissions.includes("CASES_VIEW") && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get("is_active")

    const supabase = await createAdminClient()
    let query = supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true")
    }

    const { data: cases, error } = await query

    if (error) throw error

    return NextResponse.json({ cases })
  } catch (error) {
    console.error("[cases/GET] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação via JWT
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // Verificar permissão manualmente
    if (!user.permissions.includes("CASES_CREATE") && user.role !== "super_admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    // Verifica se já existe um caso com este nome
    const { data: existingCase } = await supabase
      .from("cases")
      .select("id")
      .eq("name", name)
      .single()

    if (existingCase) {
      return NextResponse.json(
        { error: "A case type with this name already exists" },
        { status: 409 }
      )
    }

    const { data: caseItem, error } = await supabase
      .from("cases")
      .insert({
        name,
        description: description || null,
        color: color || "#2C3E50",
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ case: caseItem }, { status: 201 })
  } catch (error) {
    console.error("[cases/POST] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    )
  }
}
