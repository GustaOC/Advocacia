import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET() {
  try {
    await requirePermission("ROLES_MANAGE")

    const supabase = await createAdminClient()
    const { data: roles, error } = await supabase
      .from("roles")
      .select(`
        *,
        role_permissions(
          permission:permissions(*)
        )
      `)
      .order("name")

    if (error) throw error

    const rolesWithPermissions = roles?.map((role) => ({
      ...role,
      permissions: role.role_permissions?.map((rp) => rp.permission) || [],
    }))

    return NextResponse.json({ roles: rolesWithPermissions })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
