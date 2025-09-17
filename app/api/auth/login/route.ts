// app/api/auth/login/route.ts - VERSÃO CORRIGIDA
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    console.log("[API Login] === INICIANDO PROCESSO DE LOGIN ===")
    
    // ✅ CORREÇÃO: Validação de entrada
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error("[API Login] ❌ Erro ao parsear JSON:", parseError)
      return NextResponse.json(
        { error: "Dados inválidos", details: "JSON malformado" }, 
        { status: 400 }
      )
    }

    const { email, password } = body

    // ✅ CORREÇÃO: Validação dos campos obrigatórios
    if (!email || !password) {
      console.warn("[API Login] ❌ Campos obrigatórios faltando:", { email: !!email, password: !!password })
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" }, 
        { status: 400 }
      )
    }

    // ✅ CORREÇÃO: Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.warn("[API Login] ❌ Email inválido:", email)
      return NextResponse.json(
        { error: "Formato de email inválido" }, 
        { status: 400 }
      )
    }

    console.log("[API Login] Tentativa de login para:", email)

    // ✅ CORREÇÃO: Configuração adequada da resposta
    const res = NextResponse.json({ 
      ok: true, 
      message: "Login realizado com sucesso",
      timestamp: new Date().toISOString()
    })
    
    const supabase = createSupabaseServerClient(req, res)

    // ✅ CORREÇÃO: Tentativa de login com Supabase
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    })

    if (error) {
      console.error("[API Login] ❌ Erro do Supabase:", {
        message: error.message,
        status: error.status,
        name: error.name
      })
      
      // ✅ CORREÇÃO: Mensagens de erro mais específicas
      let userMessage = "Erro ao fazer login"
      
      if (error.message.includes("Invalid login credentials")) {
        userMessage = "Email ou senha incorretos"
      } else if (error.message.includes("Email not confirmed")) {
        userMessage = "Email não confirmado"
      } else if (error.message.includes("Too many requests")) {
        userMessage = "Muitas tentativas. Tente novamente em alguns minutos"
      }
      
      return NextResponse.json(
        { error: userMessage, code: error.name }, 
        { status: 401 }
      )
    }

    // ✅ CORREÇÃO: Verificação adicional de dados
    if (!data.user) {
      console.error("[API Login] ❌ Login aparentemente bem-sucedido mas sem dados do usuário")
      return NextResponse.json(
        { error: "Erro interno de autenticação" }, 
        { status: 500 }
      )
    }

    console.log("[API Login] ✅ Login bem-sucedido para:", {
      email: data.user.email,
      id: data.user.id,
      confirmed: data.user.email_confirmed_at ? "Sim" : "Não"
    })

    // ✅ CORREÇÃO: Resposta mais informativa
    const response = NextResponse.json({
      ok: true,
      message: "Login realizado com sucesso",
      user: {
        id: data.user.id,
        email: data.user.email,
        confirmed: !!data.user.email_confirmed_at
      },
      timestamp: new Date().toISOString()
    })

    // ✅ CORREÇÃO: Headers de segurança
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')

    console.log("[API Login] ✅ Resposta enviada com cookies configurados")
    return response

  } catch (unexpectedError) {
    console.error("[API Login] ❌ Erro inesperado:", unexpectedError)
    
    return NextResponse.json(
      { 
        error: "Erro interno do servidor", 
        message: "Tente novamente em alguns instantes",
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}