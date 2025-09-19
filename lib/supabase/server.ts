// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { env } from "@/lib/env"; // Importando as variáveis de ambiente validadas

/**
 * Cria um cliente Supabase para uso em Server Components, Route Handlers, etc.,
 * que lê e escreve cookies corretamente.
 */
export function createSupabaseServerClient(req?: NextRequest, res?: NextResponse) {
  const cookieStore = cookies();

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Variáveis de ambiente do Supabase não configuradas.");
  }

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
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
 * Cria um cliente Admin do Supabase com a Service Role Key.
 * Usar SOMENTE no servidor (Route Handlers / Server Actions).
 */
export function createAdminClient() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Variáveis de ambiente do Supabase para admin não configuradas.");
  }
  
  return createSupabaseAdmin(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { 
    auth: { persistSession: false } 
  });
}