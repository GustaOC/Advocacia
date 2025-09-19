// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr"
import { env } from "@/lib/env"; // Importando as variáveis de ambiente validadas

export function createClient() {
  // Usando as variáveis validadas do objeto 'env'
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Variáveis de ambiente do Supabase não configuradas.");
  }
  
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}