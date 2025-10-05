// app/api/installments/by-month/route.ts - VERSÃO FINAL E DEFINITIVA
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

  // Abordagem mais simples e robusta: criar strings no formato AAAA-MM-DD
  const monthStart = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`;
  
  // Calcula o primeiro dia do mês seguinte para usar como limite superior exclusivo
  const nextMonthDate = new Date(yearNum, monthNum, 1);
  const nextMonthYear = nextMonthDate.getFullYear();
  const nextMonthMonth = nextMonthDate.getMonth() + 1;
  const nextMonthStart = `${nextMonthYear}-${String(nextMonthMonth).padStart(2, '0')}-01`;

  try {
    const { data: installments, error } = await supabase
      .from('financial_installments')
      // A consulta SELECT que foi validada pela rota /debug
      .select(`
        id,
        due_date,
        amount,
        status,
        agreement:financial_agreements (
          id,
          total_amount,
          number_of_installments,
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
      // Filtro de data que corresponde exatamente ao formato da base de dados
      .gte('due_date', monthStart)
      .lt('due_date', nextMonthStart)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      throw new Error(`Falha na consulta ao Supabase: ${error.message}`);
    }
    
    const validInstallments = installments?.filter(inst => inst.agreement) || [];

    return NextResponse.json(validInstallments);

  } catch (error: any) {
    console.error('Erro ao buscar parcelas:', error?.message || error);
    return NextResponse.json({ error: 'Falha ao buscar dados das parcelas.', details: error?.message }, { status: 500 });
  }
}