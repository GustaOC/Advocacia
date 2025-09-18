// app/api/auth/login/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withRateLimit } from "@/lib/with-rate-limit"; // Importa o HOF de rate limit

async function handler(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({ message: "Login bem-sucedido" });
    const supabase = createSupabaseServerClient(req, res);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("[Login API] Erro no Supabase:", error.message);
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu email e senha." },
        { status: 401 }
      );
    }

    // A resposta 'res' já contém os cookies de autenticação definidos pelo Supabase SSR
    return res;

  } catch (error: any) {
    console.error("[Login API] Erro inesperado:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro interno no servidor." },
      { status: 500 }
    );
  }
}

// Aplica o rate limit ao handler de login
export const POST = withRateLimit(handler);