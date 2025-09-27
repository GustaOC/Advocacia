// app/api/installments/by-month/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { getSessionUser, requirePermission } from '@/lib/auth';
import { z } from 'zod';

// Schema para validar os parâmetros da query
const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function GET(request: NextRequest) {
  try {
    // Garante que o usuário esteja autenticado
    await requirePermission('financial_view'); // Assumindo que existe uma permissão para ver dados financeiros

    const { searchParams } = new URL(request.url);

    // Valida os parâmetros de ano e mês
    const validationResult = QuerySchema.safeParse({
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Parâmetros de ano e mês inválidos ou ausentes.', issues: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { year, month } = validationResult.data;

    // Chama o nosso novo método no serviço
    const installments = await FinancialService.getInstallmentsByMonthYear(year, month);

    return NextResponse.json(installments);

  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }
    
    console.error(`[API /installments/by-month] Erro:`, error);
    return NextResponse.json(
      { error: 'Erro no servidor ao buscar parcelas.', details: error.message }, 
      { status: 500 }
    );
  }
}