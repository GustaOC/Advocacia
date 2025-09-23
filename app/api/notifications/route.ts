// app/api/notifications/route.ts 
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || user.id;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread_only") === "true";

    const supabase = createAdminClient();
      
    let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error("[API Notifications] Erro Supabase:", error);
      throw error;
    }

    return NextResponse.json({ 
      notifications: notifications || [],
      total: count || 0,
    });

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    console.error("[API Notifications] Erro inesperado:", error);
    return NextResponse.json({ 
      error: error.message || "Erro interno do servidor", 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { title, message, type = "info", target_user_id } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        type,
        user_id: target_user_id || user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(notification);
  } catch (error: any) {
     if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    console.error("[API Notifications] Erro ao criar notificação:", error);
    return NextResponse.json({ 
      error: error.message || "Erro ao criar notificação", 
    }, { status: 500 });
  }
}