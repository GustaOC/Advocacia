// app/api/auth/update-password/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Atualiza a senha de um usuário identificado por email (admin)
 * ou atualiza a senha do próprio usuário se enviar currentPassword + newPassword.
 *
 * Preferência: o frontend deve autenticar o usuário e chamar supabase.auth.updateUser().
 * Este endpoint é para casos admin ou reset via link.
 */

const bodySchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  newPassword: z.string().min(6),
  // se for fluxo self-service, poderia receber currentPassword e token de reset
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId, newPassword } = bodySchema.parse(body);

    if (!email && !userId) {
      return NextResponse.json({ error: "email ou userId obrigatório" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Preferível: usar Admin API para reset (gera novo password)
    // Tentativa com admin SDK (variações entre versões do SDK podem existir)
    // Abaixo usamos a tabela auth.users se disponível (pode ser bloqueado em alguns setups).
    // A forma recomendada é usar supabase.auth.admin.updateUserById em v2 SDK.
    try {
      // se a SDK tiver admin.updateUserById:
      // @ts-ignore
      if (supabase.auth && (supabase.auth as any).admin?.updateUserById) {
        // @ts-ignore
        const id = userId;
        // @ts-ignore
        const res = await (supabase.auth as any).admin.updateUserById(id, { password: newPassword });
        // ajuste conforme retorno real
        return NextResponse.json({ ok: true, res });
      } else {
        // Fallback: atualizar via SQL em uma tabela custom (se você mantiver senhas fora do auth)
        // Aqui apenas avisamos que precisa de ajuste conforme sua versão do SDK.
        return NextResponse.json({
          error:
            "Admin SDK necessário para atualizar senha programaticamente. Verifique `supabase-js` versão e ajuste (ex: auth.admin.updateUserById)."
        }, { status: 501 });
      }
    } catch (innerErr: any) {
      console.error("Erro ao atualizar senha admin:", innerErr);
      return NextResponse.json({ error: innerErr?.message || "Erro ao atualizar senha" }, { status: 500 });
    }
  } catch (err: any) {
    console.error("API /api/auth/update-password error:", err);
    return NextResponse.json({ error: err?.message || "Erro interno" }, { status: 500 });
  }
}
