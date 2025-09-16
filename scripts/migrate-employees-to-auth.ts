import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase URL e Service Role Key são obrigatórios")
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function migrateEmployees() {
  console.log("🔎 Buscando funcionários ativos...")
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, email, role, permissions, is_active, name")
    .eq("is_active", true)

  if (error) {
    console.error("❌ Erro ao buscar employees:", error)
    return
  }

  if (!employees || employees.length === 0) {
    console.log("⚠️ Nenhum funcionário ativo encontrado")
    return
  }

  console.log(`👥 Encontrados ${employees.length} funcionários`)

  for (const emp of employees) {
    try {
      // Tenta criar usuário no Auth
      const { data: user, error: createError } =
        await supabase.auth.admin.createUser({
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
        // Se já existir, apenas dispara reset de senha
        if (createError.message.includes("duplicate key")) {
          console.log(`⚠️ Usuário já existe: ${emp.email}, enviando reset...`)
          await supabase.auth.resetPasswordForEmail(emp.email)
          continue
        }

        console.error(`❌ Erro ao criar usuário ${emp.email}:`, createError.message)
        continue
      }

      console.log(`✅ Usuário criado: ${emp.email}`)

      // Dispara e-mail de redefinição de senha
      await supabase.auth.resetPasswordForEmail(emp.email)
      console.log(`📩 Reset de senha enviado para ${emp.email}`)
    } catch (err) {
      console.error(`❌ Erro inesperado para ${emp.email}:`, err)
    }
  }

  console.log("🎉 Migração concluída")
}

migrateEmployees()
