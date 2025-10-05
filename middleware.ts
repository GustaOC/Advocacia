import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

/**
 * Verifica se um determinado caminho (pathname) é público.
 */
function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  // Permite acesso a arquivos estáticos e de imagem do Next.js
  if (pathname.startsWith('/_next/') || pathname.includes('/favicon.ico')) {
    return true;
  }
  for (const pattern of PUBLIC_API_PATTERNS) {
    if (pathname.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Inicia uma resposta que será modificada ao longo do middleware
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // ✅ CORREÇÃO PRINCIPAL: Criação do cliente Supabase usando @supabase/ssr
  // Isso garante que os cookies sejam lidos e escritos no formato correto.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // A cada `set`, precisamos recriar a resposta para garantir que os
          // cookies sejam passados corretamente para a próxima etapa.
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // É crucial chamar getSession() (ou getUser()) para que o Supabase
  // atualize o cookie de sessão se ele estiver expirado.
  const { data: { session } } = await supabase.auth.getSession();

  // Adiciona os cabeçalhos de segurança em todas as respostas
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
  
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");

  // Se a rota for pública, retorna a resposta permitindo o acesso.
  if (isPublic(pathname)) {
    return response;
  }

  // Se a sessão não existir (usuário não logado) e a rota for protegida,
  // redireciona para a página de login.
  if (!session) {
    console.warn(`[Middleware] Acesso negado para rota protegida: ${pathname}. Redirecionando para login.`);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se o usuário estiver autenticado, permite o acesso à rota protegida.
  return response;
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