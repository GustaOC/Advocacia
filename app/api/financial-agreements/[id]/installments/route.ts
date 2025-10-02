// app/api/financial-agreements/[id]/installments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const agreementId = parseInt(params.id, 10);
    if (isNaN(agreementId)) {
      return NextResponse.json({ error: 'ID do acordo inválido.' }, { status: 400 });
    }

    const installments = await FinancialService.getInstallmentsByAgreement(params.id);
    return NextResponse.json(installments);

  } catch (error) {
    console.error('Falha ao buscar parcelas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro no servidor ao buscar parcelas.', details: errorMessage }, { status: 500 });
  }
}