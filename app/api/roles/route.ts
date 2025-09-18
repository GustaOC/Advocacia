import { NextResponse } from 'next/server'
import { getSessionUser, requirePermission } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { Role, Permission } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await requirePermission('READ_ROLE')

  const supabase = createAdminClient()
  const { data: roles, error } = await supabase.from('roles').select('*, role_permissions(permission)')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const formattedRoles: Role[] = roles.map((role: any) => ({
    id: role.id,
    name: role.name,
    permissions: role.role_permissions.map((rp: any) => rp.permission as Permission),
  }))

  return NextResponse.json(formattedRoles)
}