// lib/supabase-config.ts
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Função simplificada para criar cliente no browser
export function createBrowserSupabaseClient() {
  // No v0, usamos fetch diretamente para as APIs
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            // Esta função será substituída por chamadas fetch diretas
            return { data: null, error: null }
          }
        })
      })
    })
  }
}
