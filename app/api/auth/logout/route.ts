// app/api/auth/logout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearAuthCache } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({ message: "Logout realizado com sucesso" });
    const supabase = createSupabaseServerClient(req, res);
    
    // Pega o usuário antes de deslogar para limpar o cache específico dele
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.auth.signOut();

    if (user) {
      clearAuthCache(user.id); // Limpa o cache do usuário deslogado
    }

    return res;

  } catch (error: any) {
    console.error("[Logout API] Erro:", error.message);
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 });
  }
}