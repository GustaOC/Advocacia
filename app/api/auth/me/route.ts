// app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { withRateLimit } from "@/lib/with-rate-limit";

async function GET_handler() {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });
    
  } catch (error: any) {
    console.error("[Me API] Erro:", error.message);
    return NextResponse.json({ error: "Erro interno ao buscar usuário." }, { status: 500 });
  }
}
export const GET = withRateLimit(GET_handler);