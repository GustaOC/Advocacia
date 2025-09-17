// app/api/notifications/count/route.ts - VERSÃO CORRIGIDA
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[API Notifications Count] === CONTANDO NOTIFICAÇÕES NÃO LIDAS ===")

    // ✅ CORREÇÃO: Verificação de autenticação primeiro
    const user = await requireAuth()
    console.log(`[API Notifications Count] Usuário autenticado: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id") || user.id

    // ✅ CORREÇÃO: Validação básica de UUID se fornecido
    if (searchParams.get("user_id")) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(userId)) {
        console.warn(`[API Notifications Count] ❌ UUID inválido: ${userId}`)
        return NextResponse.json(
          { error: "user_id deve ser um UUID válido", success: false }, 
          { status: 400 }
        )
      }
    }

    console.log(`[API Notifications Count] Contando notificações para: ${userId}`)

    // ✅ CORREÇÃO: Modo desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("[API Notifications Count] Modo desenvolvimento - retornando contagem mock")
      
      // Simula algumas notificações não lidas
      const mockCount = Math.floor(Math.random() * 5) // 0-4 notificações
      
      return NextResponse.json({ 
        count: mockCount,
        success: true,
        message: "Executando em modo desenvolvimento"
      })
    }

    // ✅ CORREÇÃO: Produção - Remove await desnecessário
    try {
      const supabase = createAdminClient()
      
      console.log("[API Notifications Count] Executando consulta no Supabase...")
      
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_read", false)

      if (error) {
        console.error("[API Notifications Count] Erro Supabase:", error)
        throw error
      }

      console.log(`[API Notifications Count] ✅ ${count || 0} notificações não lidas encontradas`)

      return NextResponse.json({ 
        count: count || 0,
        success: true
      })

    } catch (supabaseError: any) {
      console.error("[API Notifications Count] Erro na consulta Supabase:", supabaseError)
      
      // ✅ CORREÇÃO: Fallback em caso de erro do Supabase
      return NextResponse.json({ 
        count: 0,
        success: false,
        error: "Erro ao acessar banco de dados",
        fallback: true
      }, { status: 500 })
    }

  } catch (authError: any) {
    console.error("[API Notifications Count] Erro de autenticação:", authError)
    
    // ✅ CORREÇÃO: Error handling específico para auth
    if (authError.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Não autorizado", success: false }, 
        { status: 401 }
      )
    }
    
    return NextResponse.json({ 
      error: authError.message || "Erro interno do servidor", 
      success: false 
    }, { status: 500 })
  }
}