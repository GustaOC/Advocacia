// app/api/installments/by-month/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { getSessionUser, requirePermission } from '@/lib/auth';
import { z } from 'zod';

/**
 * Validação forte dos parâmetros
 */
const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando busca de parcelas do mês...');
    
    // Autorização
    await requirePermission('financial_view');
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 401 });
    }

    // Parse seguro dos parâmetros com fallback
    const url = new URL(request.url);
    const parsed = QuerySchema.parse({
      year: url.searchParams.get('year'),
      month: url.searchParams.get('month'),
    });

    const now = new Date();
    const year = parsed.year ?? now.getUTCFullYear();
    const month = parsed.month ?? (now.getUTCMonth() + 1);

    console.log(`📅 Buscando parcelas para ${month}/${year} - Usuário: ${user.id}`);

    // Buscar via service
    const installments = await FinancialService.getInstallmentsByMonthYear(year, month, user);

    console.log(`✅ Retornando ${installments.length} parcelas para o front-end`);

    return NextResponse.json(installments, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ ERRO em /api/installments/by-month:', error);
    
    // Tratamento explícito de erro de auth
    if (error?.message === 'UNAUTHORIZED' || error?.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    return NextResponse.json(
      { 
        error: 'Erro no servidor ao buscar parcelas.', 
        details: String(error?.message ?? error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}