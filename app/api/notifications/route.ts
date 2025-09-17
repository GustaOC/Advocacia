// app/api/notifications/route.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("[API Notifications] === INICIANDO BUSCA DE NOTIFICAÇÕES ===")

    // ✅ CORREÇÃO: Verificação de autenticação
    const user = await requireAuth()
    console.log(`[API Notifications] Usuário autenticado: ${user.email}`)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id") || user.id
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")
    const unreadOnly = searchParams.get("unread_only") === "true"

    console.log(`[API Notifications] Parâmetros:`, { userId, limit, offset, unreadOnly })

    // ✅ CORREÇÃO: Modo desenvolvimento com mock data
    if (process.env.NODE_ENV === 'development') {
      console.log("[API Notifications] Modo desenvolvimento - retornando dados mock")
      
      const mockNotifications = [
        {
          id: 1,
          title: "Nova mensagem recebida",
          message: "Você tem uma nova mensagem no sistema",
          type: "info",
          is_read: false,
          created_at: new Date().toISOString(),
          user_id: userId
        },
        {
          id: 2,
          title: "Reunião agendada",
          message: "Reunião marcada para amanhã às 14:00",
          type: "calendar",
          is_read: unreadOnly ? false : true,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          user_id: userId
        }
      ]

      const filteredNotifications = unreadOnly 
        ? mockNotifications.filter(n => !n.is_read)
        : mockNotifications

      return NextResponse.json({ 
        notifications: filteredNotifications.slice(offset, offset + limit),
        total: filteredNotifications.length,
        count: mockNotifications.filter(n => !n.is_read).length,
        success: true,
        message: "Executando em modo desenvolvimento"
      })
    }

    // ✅ CORREÇÃO: Produção com Supabase
    try {
      const supabase = createAdminClient() // Remove await desnecessário
      
      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (unreadOnly) {
        query = query.eq("is_read", false)
      }

      const { data: notifications, error, count } = await query

      if (error) {
        console.error("[API Notifications] Erro Supabase:", error)
        throw error
      }

      console.log(`[API Notifications] ✅ ${notifications?.length || 0} notificações encontradas`)

      return NextResponse.json({ 
        notifications: notifications || [],
        total: count || 0,
        success: true
      })

    } catch (supabaseError) {
      console.error("[API Notifications] Erro na consulta Supabase:", supabaseError)
      
      // ✅ CORREÇÃO: Fallback em caso de erro
      return NextResponse.json({ 
        notifications: [],
        total: 0,
        success: false,
        error: "Erro ao buscar notificações",
        fallback: true
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("[API Notifications] Erro inesperado:", error)
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor", 
      success: false 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[API Notifications] === CRIANDO NOVA NOTIFICAÇÃO ===")

    const user = await requireAuth()
    const body = await request.json()

    const { title, message, type = "info", target_user_id } = body

    // ✅ CORREÇÃO: Validação de entrada
    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios", success: false },
        { status: 400 }
      )
    }

    // Modo desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("[API Notifications] Modo desenvolvimento - simulando criação")
      return NextResponse.json({
        notification: {
          id: Date.now(),
          title,
          message,
          type,
          is_read: false,
          created_at: new Date().toISOString(),
          user_id: target_user_id || user.id
        },
        success: true,
        message: "Notificação criada em modo desenvolvimento"
      })
    }

    // Produção
    const supabase = createAdminClient()
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type,
        user_id: target_user_id || user.id,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    console.log(`[API Notifications] ✅ Notificação criada: ${notification.id}`)

    return NextResponse.json({ 
      notification,
      success: true 
    })

  } catch (error: any) {
    console.error("[API Notifications] Erro ao criar notificação:", error)
    return NextResponse.json({ 
      error: error.message || "Erro ao criar notificação", 
      success: false 
    }, { status: 500 })
  }
}