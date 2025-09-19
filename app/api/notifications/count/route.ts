// app/api/notifications/count/route.ts - VERSÃO FINAL DE PRODUÇÃO
import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || user.id;

    const supabase = createAdminClient();
    
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[API Notifications Count] Erro Supabase:", error);
      throw error;
    }

    return NextResponse.json({ 
      count: count || 0,
    });

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    console.error("[API Notifications Count] Erro inesperado:", error);
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor", 
    }, { status: 500 });
  }
}