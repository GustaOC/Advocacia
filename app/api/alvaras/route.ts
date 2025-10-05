// app/api/alvaras/route.ts - VERSÃO CORRIGIDA

import { NextResponse } from 'next/server';
// CORREÇÃO: Importações para autenticação via Supabase Auth Helpers
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { FinancialService } from '@/lib/services/financialService';
import { AuthUser } from '@/lib/auth'; // Apenas para a tipagem do usuário

/**
 * GET /api/alvaras
 * Busca e retorna uma lista de todos os acordos que são considerados alvarás.
 */
export async function GET() {
  try {
    // CORREÇÃO: Método padrão para obter o usuário em rotas de API
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    const user = session?.user as AuthUser | null;

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Chama o service para buscar os dados dos alvarás no banco
    const alvaras = await FinancialService.getAlvaras(user);

    // 3. Retorna os dados em formato JSON
    return NextResponse.json(alvaras);

  } catch (error) {
    console.error('❌ Erro ao buscar alvarás:', error);
    const errorMessage = error instanceof Error ? error.message : 'Um erro inesperado ocorreu';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}