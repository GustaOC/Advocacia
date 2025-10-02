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

    const body = await request.json().catch(() => ({} as any));
    const installmentId = params.id;

    // 1) Garante que a parcela existe e recupera seu valor para default
    const installment = await FinancialService.getInstallmentById(installmentId);
    if (!installment) {
      return NextResponse.json(
        { error: 'Parcela não encontrada.', installmentId },
        { status: 404 }
      );
    }

    // 2) Monta payload com defaults
    const rawAmount = body.amount_paid ?? installment.amount;
    const amountNumber = Number(rawAmount);

    const methodRaw: unknown = body.payment_method ?? 'PIX';
    const paymentMethod = typeof methodRaw === 'string' ? methodRaw.toUpperCase() : 'PIX';

    const dateRaw: unknown = body.payment_date ?? new Date();
    const paymentDate = dateRaw instanceof Date
      ? dateRaw.toISOString()
      : typeof dateRaw === 'string'
        ? dateRaw
        : new Date().toISOString();

    const paymentData = {
      installment_id: installmentId,
      amount_paid: isFinite(amountNumber) ? amountNumber : undefined,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      notes: typeof body.notes === 'string' ? body.notes : undefined,
    };

    // 3) Validação
    const parsed = PaymentSchema.safeParse(paymentData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Dados de pagamento inválidos',
          input: paymentData,
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    // 4) Executa operação
    const result = await FinancialService.recordPaymentForInstallment(
      parsed.data,
      user
    );
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Falha ao registrar pagamento:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      { error: 'Erro no servidor ao registrar pagamento.', details: message },
      { status: 500 }
    );
  }
}