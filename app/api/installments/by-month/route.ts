// app/api/installments/by-month/route.ts - VERSÃO FINALÍSSIMA
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
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

  const startDate = new Date(yearNum, monthNum - 1, 1).toISOString();
  const endDate = new Date(yearNum, monthNum, 0).toISOString();

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
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      throw new Error(`Falha na consulta ao Supabase: ${error.message}`);
    }

    return NextResponse.json(installments);

  } catch (error: any) {
    console.error('Erro ao buscar parcelas:', error.message);
    return NextResponse.json({ error: 'Falha ao buscar dados das parcelas.', details: error.message }, { status: 500 });
  }
}