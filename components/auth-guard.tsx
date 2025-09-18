// components/auth-guard.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log("[AuthGuard] Sessão não encontrada. Redirecionando para login.");
        const redirectUrl = `/login?redirectedFrom=${encodeURIComponent(pathname)}`;
        router.replace(redirectUrl);
      } else {
        console.log("[AuthGuard] Sessão válida encontrada. Acesso permitido.");
        setIsLoading(false);
      }
    };

    checkSession();
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-4 text-slate-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}