// app/api/installments/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const QuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    const url = new URL(request.url);
    
    const parsed = QuerySchema.parse({
      year: url.searchParams.get('year'),
      month: url.searchParams.get('month'),
    });

    const now = new Date();
    const year = parsed.year ?? now.getUTCFullYear();
    const month = parsed.month ?? (now.getUTCMonth() + 1);

    console.log(`🐛 [DEBUG API] Executando debug para ${month}/${year}`);
    
    const debugData = await FinancialService.debugInstallments(year, month);

    return NextResponse.json({ 
      debug: true,
      year,
      month,
      data: debugData 
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ ERRO no debug:', error);
    return NextResponse.json(
      { error: 'Erro no debug', details: error.message },
      { status: 500 }
    );
  }
}