// app/api/installments/by-month/route.ts - VERSÃO FINALÍSSIMA (corrigida)
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = cookies(); // mantido caso seja usado por middlewares/autenticação
  const supabase = createSupabaseServerClient(); 

  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'Ano e mês são obrigatórios' }, { status: 400 });
  }

  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  if (isNaN(yearNum) || isNaN(monthNum)) {
    return NextResponse.json({ error: 'Ano e mês devem ser números válidos' }, { status: 400 });
  }

  // ---- CORREÇÃO DE BORDA/UTC ----
  // Janela correta: [1º dia 00:00 UTC, 1º dia do mês seguinte 00:00 UTC)
  const monthStartUTC = new Date(Date.UTC(yearNum, monthNum - 1, 1, 0, 0, 0, 0)).toISOString();
  const nextMonthStartUTC = new Date(Date.UTC(yearNum, monthNum, 1, 0, 0, 0, 0)).toISOString();

  try {
    const { data: installments, error } = await supabase
      .from('financial_installments')
      .select(`
        *,
        agreement:financial_agreements (
          *,
          debtor:entities!fk_financial_agreements_debtor (id, name), 
          cases (
            case_number,
            case_parties (
              role,
              entities (id, name)
            )
          )
        )
      `)
      .gte('due_date', monthStartUTC)   // >= início do mês
      .lt('due_date', nextMonthStartUTC) // < início do mês seguinte (exclusivo)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      throw new Error(`Falha na consulta ao Supabase: ${error.message}`);
    }

    return NextResponse.json(installments);

  } catch (error: any) {
    console.error('Erro ao buscar parcelas:', error?.message || error);
    return NextResponse.json({ error: 'Falha ao buscar dados das parcelas.', details: error?.message }, { status: 500 });
  }
}
