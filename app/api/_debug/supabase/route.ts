// app/api/_debug/supabase/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const envStatus = {
    NEXT_PUBLIC_SUPABASE_URL: !!url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!anon,
    SUPABASE_SERVICE_ROLE_KEY: !!service,
  };

  // Resultado padrão
  const result: any = {
    env: envStatus,
    notes: [],
  };

  // Checagem básica de reachability com timeout curto
  try {
    if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL ausente");
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    result.http_ping = { ok: res.ok, status: res.status };
  } catch (err: any) {
    result.http_ping = { ok: false, error: err?.message ?? String(err) };
  }

  // Checagem de banco via client admin (se disponível)
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("entities").select("id").limit(1);
    if (error) throw error;
    result.db_ping = { ok: true, rows: (data ?? []).length };
  } catch (err: any) {
    result.db_ping = { ok: false, error: err?.message ?? String(err) };
    result.notes.push("Se falhou aqui, verifique SUPABASE_SERVICE_ROLE_KEY e as regras de rede.");
  }

  return NextResponse.json(result);
}
