// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

/**
 * Client SSR que lê e escreve cookies (Set-Cookie) corretamente.
 * CORRIGIDO para usar o novo adapter com getAll, setAll e remove.
 */
export function createSupabaseServerClient(req?: NextRequest, res?: NextResponse) {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
            cookiesToSet.forEach(({ name, value, options }) => {
                if(res) {
                    res.cookies.set(name, value, options);
                } else {
                    cookieStore.set(name, value, options);
                }
            });
        } catch {
          // O método `setAll` pode ser chamado em Server Components,
          // onde a modificação de cookies não é permitida. Ignoramos o erro.
        }
      },
    },
  });
}

/**
 * Admin client – usar SOMENTE no servidor (Route Handlers / Server Actions).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase envs: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createSupabaseAdmin(url, serviceKey, { auth: { persistSession: false } });
}