// app/api/alvaras/route.ts - VERSÃO CORRIGIDA PARA USAR MÉTODOS ESTÁTICOS

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { FinancialService } from '@/lib/services/financialService'; // Importa a classe
import { AuthUser } from '@/lib/auth'; // Importação necessária para o _authUser

/**
 * GET /api/alvaras
 * Busca e retorna uma lista de todos os acordos que são considerados alvarás.
 */
export async function GET(req: NextRequest) {
  const res = new NextResponse();
  const supabase = createSupabaseServerClient(req, res);

  try {
    // 1. Obter o usuário da sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // 2. ✅ CORREÇÃO: Chamar o método estático diretamente na classe
    // Não criamos uma instância com 'new', chamamos 'FinancialService.getAlvaras(...)'
    const alvaras = await FinancialService.getAlvaras(user as AuthUser);

    // 3. Retornar os dados com sucesso
    return NextResponse.json(alvaras);

  } catch (error) {
    console.error('❌ Erro inesperado em /api/alvaras:', error);
    const errorMessage = error instanceof Error ? error.message : 'Um erro inesperado ocorreu';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}