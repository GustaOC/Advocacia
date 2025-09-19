// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Lista de rotas públicas que não exigem autenticação
const PUBLIC_PATHS = [
  '/', // Landing page
  '/login',
  '/auth/callback',
  '/auth/update-password', // Rota para redefinição de senha
];

// Padrões de arquivos e rotas de API que devem ser ignorados pelo middleware de autenticação.
// A API de login precisa ser pública.
const PUBLIC_FILE_AND_API_PATTERNS = [
  /\.(png|jpg|jpeg|svg|gif|ico|js|css)$/, // Arquivos estáticos com extensões comuns
  /^\/_next\//,                             // Arquivos internos do Next.js
  /^\/api\/auth\/login/,                    // API de Login
];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  for (const pattern of PUBLIC_FILE_AND_API_PATTERNS) {
    if (pattern.test(pathname)) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Se a rota for pública, permite o acesso sem verificar a sessão.
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  try {
    const res = NextResponse.next();
    const supabase = createSupabaseServerClient(req, res);
    
    // Verifica se há um usuário na sessão.
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Se houver erro ou nenhum usuário, redireciona para a página de login.
    if (error || !user) {
      console.log(`[Middleware] Acesso negado para ${pathname}. Redirecionando para login.`);
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se o usuário estiver autenticado, permite o acesso.
    return res;

  } catch (e) {
    console.error('[Middleware] Erro inesperado:', e);
    // Em caso de erro, redireciona para o login como medida de segurança.
    const redirectUrl = new URL('/login?error=middleware_failed', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Configuração do matcher para definir quais rotas o middleware deve interceptar.
export const config = {
  matcher: [
    /*
     * Faz o matching de todas as rotas, exceto as que começam com:
     * - _next/static (arquivos estáticos)
     * - _next/image (imagens otimizadas)
     * - favicon.ico (ícone do site)
     * O lookahead negativo `(?!...)` garante que essas rotas sejam ignoradas
     * ANTES que o middleware seja executado, otimizando o desempenho.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};