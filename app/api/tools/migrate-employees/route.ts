// app/api/tools/migrate-employees/route.ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createAdminClient()

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, email, role, permissions, is_active, name")
    .eq("is_active", true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: any[] = []

  for (const emp of employees || []) {
    try {
      const { error: createError } = await supabase.auth.admin.createUser({
        email: emp.email,
        email_confirm: true,
        user_metadata: {
          role: emp.role,
          permissions: emp.permissions || [],
          employee_id: emp.id,
          name: emp.name,
        },
      })

      if (createError) {
        if (createError.message.includes("duplicate key")) {
          // Usuário já existe → apenas envia reset
          await supabase.auth.resetPasswordForEmail(emp.email, {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
          })
          results.push({ email: emp.email, status: "já existia, reset enviado" })
          continue
        }

        results.push({ email: emp.email, status: "erro", message: createError.message })
        continue
      }

      // Usuário criado → envia reset
      await supabase.auth.resetPasswordForEmail(emp.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
      })
      results.push({ email: emp.email, status: "criado + reset enviado" })
    } catch (err: any) {
      results.push({ email: emp.email, status: "erro", message: err.message })
    }
  }

  return NextResponse.json({ results })
}
