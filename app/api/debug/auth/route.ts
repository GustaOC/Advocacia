import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieStore = cookies()
  const sbAccessToken = cookieStore.get('sb-access-token')?.value
  const sbRefreshToken = cookieStore.get('sb-refresh-token')?.value
  const clientAuthCookie = cookieStore.get('client-auth-cookie')?.value

  let authData = null
  let employee = null

  if (sbAccessToken) {
    const supabase = createAdminClient()
    const { data } = await supabase.auth.getUser(sbAccessToken)
    authData = data
    if (data.user) {
      const { data: employeeData } = await supabase
        .from('employees')
        .select('*')
        .eq('auth_id', data.user.id)
        .single()
      employee = employeeData
    }
  }

  return NextResponse.json({
    success: true,
    debug: {
      allCookiesCount: cookieStore.getAll().length,
      authCookies: {
        sbAccessToken,
        sbRefreshToken,
        clientAuthCookie,
      },
      authData,
      employee,
    },
  })
}