// app/api/installments/debug/route.ts - Rota de teste para diagnóstico
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  try {
    console.log('A executar a consulta de diagnóstico...');
    const { data, error } = await supabase
      .from('financial_installments')
      .select(`
        id,
        due_date,
        amount,
        status,
        agreement:financial_agreements (
          id,
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
      .limit(5); // Apenas as primeiras 5 para teste

    if (error) {
      console.error('Erro na consulta de diagnóstico:', error);
      return NextResponse.json({ error: 'Erro na consulta de diagnóstico', details: error.message }, { status: 500 });
    }

    console.log('Dados encontrados:', data);
    return NextResponse.json({
      message: 'Consulta de diagnóstico executada com sucesso.',
      count: data?.length || 0,
      data: data,
    });

  } catch (error: any) {
    console.error('Erro fatal na rota de diagnóstico:', error);
    return NextResponse.json({ error: 'Erro fatal na rota de diagnóstico.', details: error?.message }, { status: 500 });
  }
}