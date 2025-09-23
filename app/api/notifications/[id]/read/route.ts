// app/api/notifications/[id]/read/route.ts 
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAuth } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log(`[API Notification Read] === MARCANDO NOTIFICAÇÃO ${params.id} COMO LIDA ===`)

    // ✅ CORREÇÃO: Verificação de autenticação
    const user = await requireAuth()
    console.log(`[API Notification Read] Usuário autenticado: ${user.email}`)

    // ✅ CORREÇÃO: Validação do ID
    const notificationId = params.id
    if (!notificationId || notificationId.trim() === '') {
      console.warn("[API Notification Read] ❌ ID da notificação não fornecido")
      return NextResponse.json(
        { error: "ID da notificação é obrigatório", success: false }, 
        { status: 400 }
      )
    }

    // ✅ CORREÇÃO: Validação numérica do ID (assumindo que notifications usa ID numérico)
    const numericId = parseInt(notificationId)
    if (isNaN(numericId) || numericId <= 0) {
      console.warn(`[API Notification Read] ❌ ID inválido: ${notificationId}`)
      return NextResponse.json(
        { error: "ID da notificação deve ser um número válido", success: false }, 
        { status: 400 }
      )
    }

    console.log(`[API Notification Read] Processando notificação ID: ${numericId}`)

    // ✅ CORREÇÃO: Modo desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("[API Notification Read] Modo desenvolvimento - simulando marcação como lida")
      
      return NextResponse.json({
        notification: {
          id: numericId,
          is_read: true,
          updated_at: new Date().toISOString(),
          updated_by: user.id
        },
        success: true,
        message: "Executando em modo desenvolvimento"
      })
    }

    // ✅ CORREÇÃO: Produção - Remove await desnecessário
    try {
      const supabase = createAdminClient()
      
      console.log("[API Notification Read] Verificando se notificação existe...")
      
      // ✅ CORREÇÃO: Verificar se a notificação existe e pertence ao usuário
      const { data: existingNotification, error: checkError } = await supabase
        .from("notifications")
        .select("id, user_id, is_read")
        .eq("id", numericId)
        .single()

      if (checkError) {
        console.error("[API Notification Read] Erro ao verificar notificação:", checkError)
        
        if (checkError.code === 'PGRST116') { // No rows found
          return NextResponse.json(
            { error: "Notificação não encontrada", success: false }, 
            { status: 404 }
          )
        }
        
        throw checkError
      }

      // ✅ CORREÇÃO: Verificar se o usuário tem permissão para marcar esta notificação
      if (existingNotification.user_id !== user.id && user.role !== 'admin') {
        console.warn(`[API Notification Read] ❌ Usuário ${user.email} tentou marcar notificação de outro usuário`)
        return NextResponse.json(
          { error: "Você não tem permissão para marcar esta notificação", success: false }, 
          { status: 403 }
        )
      }

      // ✅ CORREÇÃO: Verificar se já está marcada como lida
      if (existingNotification.is_read) {
        console.log(`[API Notification Read] ℹ️  Notificação ${numericId} já estava marcada como lida`)
        return NextResponse.json({ 
          notification: existingNotification,
          success: true,
          message: "Notificação já estava marcada como lida"
        })
      }

      console.log("[API Notification Read] Atualizando notificação...")
      
      // ✅ CORREÇÃO: Atualizar com informações de auditoria
      const { data: notification, error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true,
          read_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", numericId)
        .select()
        .single()

      if (error) {
        console.error("[API Notification Read] Erro ao atualizar:", error)
        throw error
      }

      console.log(`[API Notification Read] ✅ Notificação ${numericId} marcada como lida`)

      return NextResponse.json({ 
        notification,
        success: true,
        message: "Notificação marcada como lida com sucesso"
      })

    } catch (supabaseError: any) {
      console.error("[API Notification Read] Erro Supabase:", supabaseError)
      
      // ✅ CORREÇÃO: Error handling específico
      let errorMessage = "Erro ao marcar notificação como lida"
      let statusCode = 500
      
      if (supabaseError.message?.includes("duplicate key")) {
        errorMessage = "Conflito ao atualizar notificação"
        statusCode = 409
      } else if (supabaseError.message?.includes("permission")) {
        errorMessage = "Sem permissão para atualizar notificação"
        statusCode = 403
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: supabaseError.message,
        success: false 
      }, { status: statusCode })
    }

  } catch (authError: any) {
    console.error("[API Notification Read] Erro de autenticação:", authError)
    
    if (authError.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Não autorizado", success: false }, 
        { status: 401 }
      )
    } else if (authError.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Sem permissão para esta operação", success: false }, 
        { status: 403 }
      )
    }
    
    return NextResponse.json({ 
      error: authError.message || "Erro interno do servidor", 
      success: false 
    }, { status: 500 })
  }
}