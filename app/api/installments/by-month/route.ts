// app/api/installments/by-month/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { getSessionUser, requirePermission } from '@/lib/auth';
import { z } from 'zod';

/**
 * Validação forte dos parâmetros
 * - Aceita números ou strings numéricas (ex.: "10")
 * - Aplica limites e valores padrão (mês/ano atuais quando omitidos)
 */
const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Autorização
    await requirePermission('financial_view');

    // Garante AuthUser não-nulo (corrige o erro de tipagem)
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
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

    // Busca via service (normaliza TZ para evitar off-by-one de mês)
    const installments = await FinancialService.getInstallmentsByMonthYear(year, month, user);

    return NextResponse.json(installments, { status: 200 });
  } catch (error: any) {
    // Tratamento explícito de erro de auth
    if (error?.message === 'UNAUTHORIZED' || error?.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    console.error('[API /installments/by-month] Erro:', error);
    return NextResponse.json(
      { error: 'Erro no servidor ao buscar parcelas.', details: String(error?.message ?? error) },
      { status: 500 }
    );
  }
}
