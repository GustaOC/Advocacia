// app/api/auth/update-password/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Atualiza a senha de um usuário usando o Admin SDK do Supabase v2.
 * Este endpoint é para casos admin ou reset via link.
 */

const bodySchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  newPassword: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, userId, newPassword } = bodySchema.parse(body);

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email ou userId é obrigatório" }, 
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Se temos userId, usamos diretamente
    if (userId) {
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) {
        console.error("Erro ao atualizar senha por userId:", error);
        return NextResponse.json(
          { error: `Erro ao atualizar senha: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Senha atualizada com sucesso",
        user: { id: data.user.id, email: data.user.email }
      });
    }

    // Se temos email, primeiro buscamos o usuário
    if (email) {
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error("Erro ao listar usuários:", listError);
        return NextResponse.json(
          { error: "Erro interno ao buscar usuário" },
          { status: 500 }
        );
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        return NextResponse.json(
          { error: "Usuário não encontrado" },
          { status: 404 }
        );
      }

      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );

      if (error) {
        console.error("Erro ao atualizar senha por email:", error);
        return NextResponse.json(
          { error: `Erro ao atualizar senha: ${error.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true,
        message: "Senha atualizada com sucesso",
        user: { id: data.user.id, email: data.user.email }
      });
    }

  } catch (err: any) {
    console.error("API /api/auth/update-password error:", err);
    
    // Se for erro de validação do Zod
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: err.errors 
        }, 
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: err?.message || "Erro interno do servidor" }, 
      { status: 500 }
    );
  }
}