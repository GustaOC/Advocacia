// app/api/installments/by-month/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

// Validação dos parâmetros de consulta
const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO']).optional(), // opcional
});

// Util: cria intervalo [firstDay, nextMonth) em UTC para o mês/ano
function monthRangeUTC(year: number, month1to12: number) {
  const firstDay = new Date(Date.UTC(year, month1to12 - 1, 1, 0, 0, 0));
  const nextMonth = new Date(Date.UTC(year, month1to12, 1, 0, 0, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  return { firstDayISO: iso(firstDay), nextMonthISO: iso(nextMonth) };
}

/**
 * GET /api/installments/by-month?year=YYYY&month=MM[&status=PENDENTE|PAGO|ATRASADO]
 * Lista as parcelas cujo vencimento cai dentro do mês/ano informados.
 * - Se parâmetros não forem enviados, usa o mês/ano atuais (UTC).
 * - Ordena por due_date asc, depois installment_number.
 * - Retorna dados da parcela e um "embed" do acordo relacionado (útil para exibição).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      year: url.searchParams.get('year'),
      month: url.searchParams.get('month'),
      status: url.searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Parâmetros inválidos.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = parsed.data.year ?? now.getUTCFullYear();
    const month = parsed.data.month ?? now.getUTCMonth() + 1;
    const { firstDayISO, nextMonthISO } = monthRangeUTC(year, month);

    // Monta a query base por intervalo de datas
    let query = supabase
      .from('financial_installments')
      .select(
        `
        *,
        agreement:agreement_id (
          id,
          case_id,
          debtor_id,
          creditor_id,
          total_amount,
          down_payment,
          number_of_installments,
          start_date,
          end_date,
          status,
          agreement_type,
          notes
        )
      `
      )
      .gte('due_date', firstDayISO)
      .lt('due_date', nextMonthISO)
      .order('due_date', { ascending: true })
      .order('installment_number', { ascending: true });

    // Filtro opcional por status
    if (parsed.data.status) {
      query = query.eq('status', parsed.data.status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /installments/by-month] Erro ao consultar parcelas:', error);
      return NextResponse.json(
        { message: 'Falha ao buscar parcelas do mês.', error: error.message },
        { status: 500 }
      );
    }

    // Resposta direta dos registros encontrados
    return NextResponse.json({
      year,
      month,
      range: { from: firstDayISO, toExclusive: nextMonthISO },
      installments: data ?? [],
    });
  } catch (error) {
    console.error('[GET /installments/by-month] Erro inesperado:', error);
    return NextResponse.json(
      {
        message: 'Erro no servidor ao buscar parcelas do mês.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
