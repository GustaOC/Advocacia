import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionUser, requirePermission } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await requirePermission('READ_EMPLOYEE')

  const supabase = createAdminClient()
  const { data: employees, error } = await supabase
    .from('employees')
    .select('id, name, email')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(employees)
}