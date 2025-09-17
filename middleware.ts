// middleware.ts - VERSÃO CORRIGIDA
import { NextResponse, type NextRequest } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

// ✅ CORREÇÃO: Lista mais abrangente de rotas públicas
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/auth/callback",
  "/auth/update-password",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/me",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml"
])

// ✅ CORREÇÃO: Função mais robusta para verificar rotas públicas
function isPublicPath(pathname: string): boolean {
  // Rotas exatas
  if (PUBLIC_PATHS.has(pathname)) {
    console.log(`[Middleware] ✅ Rota pública exata: ${pathname}`)
    return true
  }
  
  // Arquivos Next.js
  if (pathname.startsWith("/_next/")) {
    return true
  }
  
  // Assets e arquivos estáticos
  if (pathname.startsWith("/assets/") || pathname.startsWith("/static/")) {
    return true
  }
  
  // ✅ CORREÇÃO: Regex mais específica para arquivos estáticos
  const staticFilePattern = /\.(?:png|jpe?g|gif|svg|ico|webp|woff2?|ttf|eot|css|js|map|txt|pdf|zip|json)$/i
  if (staticFilePattern.test(pathname)) {
    return true
  }
  
  // API routes de autenticação
  if (pathname.startsWith("/api/auth/")) {
    return true
  }
  
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const startTime = Date.now()
  
  console.log(`[Middleware] === VERIFICANDO: ${pathname} ===`)
  
  // ✅ CORREÇÃO: Verificação aprimorada de rotas públicas
  if (isPublicPath(pathname)) {
    console.log(`[Middleware] ✅ Rota pública permitida: ${pathname}`)
    return NextResponse.next()
  }

  try {
    // ✅ CORREÇÃO: Configuração adequada da resposta
    const res = NextResponse.next()
    
    // ✅ CORREÇÃO: Headers de segurança básicos
    res.headers.set('X-Content-Type-Options', 'nosniff')
    res.headers.set('X-Frame-Options', 'SAMEORIGIN')
    res.headers.set('X-XSS-Protection', '1; mode=block')
    
    const supabase = createSupabaseServerClient(req, res)
    
    console.log(`[Middleware] Verificando autenticação para: ${pathname}`)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    const processingTime = Date.now() - startTime
    console.log(`[Middleware] Verificação de auth concluída em ${processingTime}ms`)

    if (error) {
      console.warn(`[Middleware] ❌ Erro na verificação de auth:`, error.message)
      const url = new URL("/login", req.url)
      url.searchParams.set("redirectedFrom", pathname)
      url.searchParams.set("error", "auth_check_failed")
      console.log(`[Middleware] Redirecionando para: ${url.toString()}`)
      return NextResponse.redirect(url)
    }

    if (!user) {
      console.log(`[Middleware] ❌ Usuário não autenticado, redirecionando: ${pathname}`)
      const url = new URL("/login", req.url)
      url.searchParams.set("redirectedFrom", pathname)
      console.log(`[Middleware] Redirecionando para: ${url.toString()}`)
      return NextResponse.redirect(url)
    }

    console.log(`[Middleware] ✅ Usuário autenticado: ${user.email} - Permitindo acesso a: ${pathname}`)
    
    // ✅ CORREÇÃO: Adiciona informações úteis nos headers (para debug)
    if (process.env.NODE_ENV === 'development') {
      res.headers.set('X-User-Email', user.email || 'unknown')
      res.headers.set('X-Auth-Check-Time', `${processingTime}ms`)
    }
    
    return res

  } catch (unexpectedError) {
    console.error(`[Middleware] ❌ Erro inesperado:`, unexpectedError)
    
    // ✅ CORREÇÃO: Em caso de erro crítico, redireciona para login
    const url = new URL("/login", req.url)
    url.searchParams.set("redirectedFrom", pathname)
    url.searchParams.set("error", "middleware_error")
    
    return NextResponse.redirect(url)
  }
}

// ✅ CORREÇÃO: Configuração mais específica do matcher
export const config = { 
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api routes (except /api/auth routes, which need protection)
     * 2. /_next (Next.js internals)
     * 3. Static files (images, fonts, etc.)
     * 4. /favicon.ico, /robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|css|js|map|txt|pdf|zip|json)$).*)"
  ] 
}