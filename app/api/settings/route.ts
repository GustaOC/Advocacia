import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requirePermission } from "@/lib/auth"

export async function GET() {
  try {
    await requirePermission("SETTINGS_VIEW")

    const supabase = await createAdminClient()
    const { data: settings, error } = await supabase.from("system_settings").select("*").order("key")

    if (error) throw error

    // Convert to key-value object
    const settingsObject =
      settings?.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value
          return acc
        },
        {} as Record<string, string>
      ) || {}

    return NextResponse.json({ settings: settingsObject })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requirePermission("SETTINGS_MANAGE")

    const { settings } = await request.json()

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object é obrigatório" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Update each setting
    const updates = Object.entries(settings).map(([key, value]) =>
      supabase.from("system_settings").upsert({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      })
    )

    await Promise.all(updates)

    return NextResponse.json({ message: "Configurações atualizadas com sucesso" })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
