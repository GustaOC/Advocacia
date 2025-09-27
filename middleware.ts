// middleware.ts - VERSÃO COMPLETA E CORRIGIDA

import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Lista de rotas que NÃO exigem autenticação
const PUBLIC_PATHS = [
  '/', // Landing page
  '/login',
  '/auth/callback',
  '/auth/update-password',
];

// Padrões de rotas de API que podem ser acessadas publicamente
const PUBLIC_API_PATTERNS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/callback',
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  // Permite acesso a arquivos estáticos e de imagem
  if (pathname.startsWith('/_next/') || pathname.includes('/favicon.ico') || pathname.endsWith('.png')) {
    return true;
  }
  for (const pattern of PUBLIC_API_PATTERNS) {
    if (pathname.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // ✅ CORREÇÃO: Aplicando os Headers de Segurança diretamente no middleware
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: i.postimg.cc;
    font-src 'self';
    connect-src 'self' https://*.supabase.co;
    frame-ancestors 'none';
    form-action 'self';
  `.replace(/\s{2,}/g, " ").trim();

  res.headers.set("Content-Security-Policy", cspHeader);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Se a rota for pública, permite o acesso sem verificar a sessão
  if (isPublic(pathname)) {
    return res;
  }

  try {
    const supabase = createSupabaseServerClient(req, res);
    
    // Verifica se há um usuário na sessão
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Se houver erro ou nenhum usuário, redireciona para a página de login
    if (error || !user) {
      console.warn(`[Middleware] Acesso negado para rota protegida: ${pathname}. Redirecionando para login.`);
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se o usuário estiver autenticado, permite o acesso
    return res;

  } catch (e) {
    console.error('[Middleware] Erro inesperado:', e);
    // Em caso de erro, redireciona para o login como medida de segurança
    const redirectUrl = new URL('/login?error=middleware_failed', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Configuração do matcher para definir quais rotas o middleware deve interceptar
export const config = {
  matcher: [
    /*
     * Faz o matching de todas as rotas, exceto as que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico (ícone do site)
     * O lookahead negativo `(?!...)` garante que essas rotas sejam ignoradas.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};