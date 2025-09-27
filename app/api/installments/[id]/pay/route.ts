// app/api/installments/[id]/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { PaymentSchema } from '@/lib/schemas';
import { getSessionUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const installmentId = params.id;
    const body = await request.json();

    const paymentData = {
      ...body,
      installment_id: installmentId,
    };
    
    const validationResult = PaymentSchema.safeParse(paymentData);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Dados de pagamento inválidos.', details: validationResult.error.flatten() }, { status: 400 });
    }

    const newPayment = await FinancialService.recordPaymentForInstallment(validationResult.data, user);
    return NextResponse.json(newPayment, { status: 201 });

  } catch (error) {
    console.error('Falha ao registrar pagamento:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro no servidor ao registrar pagamento.', details: errorMessage }, { status: 500 });
  }
}