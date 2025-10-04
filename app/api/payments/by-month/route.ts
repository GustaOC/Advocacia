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

  const startDate = new Date(Date.UTC(yearNum, monthNum - 1, 1)).toISOString();
  const endDate = new Date(Date.UTC(yearNum, monthNum, 0, 23, 59, 59, 999)).toISOString();

  try {
    const { data: payments, error } = await supabase
      .from('financial_payments')
      .select(`
        id,
        payment_date,
        amount_paid,
        payment_method,
        installment:financial_installments (
          installment_number,
          agreement:financial_agreements (
            cases (
              case_number
            ),
            debtor:entities!fk_financial_agreements_debtor (id, name)
          )
        )
      `)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: true });

    if (error) {
      console.error('Erro detalhado do Supabase ao buscar pagamentos:', error);
      throw new Error(`Falha na consulta ao Supabase: ${error.message}`);
    }

    // Formata os dados para um formato mais simples para o frontend
    const formattedData = payments.map(p => {
      const installment = Array.isArray(p.installment) ? p.installment[0] : p.installment;
      const agreement = installment ? (Array.isArray(installment.agreement) ? installment.agreement[0] : installment.agreement) : null;
      const debtor = agreement ? (Array.isArray(agreement.debtor) ? agreement.debtor[0] : agreement.debtor) : null;
      const caseInfo = agreement ? (Array.isArray(agreement.cases) ? agreement.cases[0] : agreement.cases) : null;

      return {
        id: p.id,
        payment_date: p.payment_date,
        amount_paid: p.amount_paid,
        payment_method: p.payment_method,
        installment_number: installment?.installment_number,
        client_name: debtor?.name,
        case_number: caseInfo?.case_number,
      };
    });

    return NextResponse.json(formattedData);

  } catch (error: any) {
    console.error('Erro ao buscar pagamentos recebidos:', error.message);
    return NextResponse.json({ error: 'Falha ao buscar dados dos pagamentos.', details: error.message }, { status: 500 });
  }
}