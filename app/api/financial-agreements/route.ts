// app/api/financial-agreements/route.ts - VERSÃO CORRIGIDA COM GERAÇÃO AUTOMÁTICA DE PARCELAS (revisada)

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAgreementSchema } from '@/lib/schemas';
import { createAdminClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';

// Definição de um tipo para a estrutura de 'case_parties' para evitar erros de tipo 'any'
type CaseParty = {
  role: string;
  entities: {
    name: string;
    document: string;
    email: string | null;
    phone: string | null;
  } | null;
};

// Util: retorna 'YYYY-MM-DD' em UTC
function ymdUTC(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Util: cria Date UTC a partir de 'YYYY-MM-DD' (sem risco de fuso)
function fromYmdUTC(ymd: string) {
  // força meia-noite UTC
  return new Date(`${ymd}T00:00:00.000Z`);
}

// Util: clamp de fim de mês quando o dia original não existe no mês alvo
function addMonthsClampedUTC(base: Date, monthsToAdd: number) {
  const y = base.getUTCFullYear();
  const m = base.getUTCMonth() + monthsToAdd;
  const d = base.getUTCDate();

  // tenta mesma "day" no mês alvo
  let candidate = new Date(Date.UTC(y, m, d));

  // se transbordou (ex.: 31 → mês com 30 ou 28), cai para último dia do mês alvo
  const expectedMonth = ((m % 12) + 12) % 12;
  if (candidate.getUTCMonth() !== expectedMonth) {
    // último dia do mês alvo = dia 0 do mês seguinte
    candidate = new Date(Date.UTC(y, m + 1, 0));
  }
  return candidate;
}

/**
 * Função auxiliar para gerar parcelas automaticamente (UTC + ajuste de centavos)
 */
function generateInstallments(params: {
  agreementId: string;
  totalAmount: number;
  downPayment?: number;
  numberOfInstallments: number;
  startDate: string; // esperado 'YYYY-MM-DD'
  userId?: string | null;
}) {
  const {
    agreementId,
    totalAmount,
    downPayment = 0,
    numberOfInstallments,
    startDate,
    userId,
  } = params;

  const n = Math.max(1, Number(numberOfInstallments || 1));
  const baseAmount = Math.max(0, Number(totalAmount) - Number(downPayment || 0));
  if (baseAmount === 0) return [];

  // parcela base truncada em 2 casas, e última absorve a diferença
  const raw = Math.floor((baseAmount / n) * 100) / 100;
  const lastAdj = Number((baseAmount - raw * (n - 1)).toFixed(2));

  const base = fromYmdUTC(startDate);
  const out = Array.from({ length: n }).map((_, i) => {
    const due = addMonthsClampedUTC(base, i);
    const amount = i === n - 1 ? lastAdj : raw;

    return {
      agreement_id: agreementId,
      installment_number: i + 1,
      amount,
      due_date: ymdUTC(due), // YYYY-MM-DD
      status: 'PENDENTE' as const,
      created_by_user_id: userId ?? null,
    };
  });

  return out;
}

/**
 * Rota para buscar uma lista de acordos financeiros com todos os dados relacionados.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('financial_agreements')
      .select(`
        *,
        cases:case_id (
          case_number,
          title,
          status,
          case_parties (
            role,
            entities:entity_id (
              name,
              document,
              email,
              phone
            )
          )
        ),
        client_entities:debtor_id (
          name,
          document,
          email,
          phone
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar acordos financeiros:', error);
      return NextResponse.json(
        { message: 'Falha ao buscar dados dos acordos.', error: error.message },
        { status: 500 }
      );
    }

    const processedData = (data ?? []).map((agreement: any) => {
      const caseParties = (agreement.cases?.case_parties as CaseParty[]) || [];
      const executedParty = caseParties.find((p: CaseParty) => p.role === 'Executado');

      return {
        ...agreement,
        entities: agreement.client_entities || null,
        executed_entities: executedParty?.entities || null,
      };
    });

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Falha ao buscar acordos financeiros:', error);
    return NextResponse.json(
      {
        message: 'Erro no servidor ao buscar acordos financeiros.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * Rota para criar um novo acordo financeiro com geração automática de parcelas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validationResult = EnhancedAgreementSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Dados inválidos.',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const user = await getSessionUser();
    const supabase = createAdminClient();
    const payload = validationResult.data;

    // Cria o acordo
    const { data: insertedAgreement, error: insertErr } = await supabase
      .from('financial_agreements')
      .insert({
        case_id: payload.case_id,
        debtor_id: payload.debtor_id,
        creditor_id: payload.creditor_id,
        total_amount: Number(payload.total_amount),
        down_payment: Number(payload.down_payment ?? 0),
        number_of_installments: Number(payload.number_of_installments),
        start_date: payload.start_date,
        end_date: payload.end_date,
        status: payload.status,
        agreement_type: payload.agreement_type,
        notes: payload.notes ?? null,
      })
      .select('*')
      .single();

    if (insertErr || !insertedAgreement) {
      console.error('Erro ao criar acordo financeiro:', insertErr);
      return NextResponse.json(
        { message: 'Não foi possível criar o acordo financeiro.' },
        { status: 500 }
      );
    }

    // Monta as parcelas (payload → usa; senão, gera)
    let installmentsToInsert: Array<{
      agreement_id: string;
      installment_number: number;
      amount: number;
      due_date: string;
      status: string;
      created_by_user_id: string | null;
    }> = [];

    if (Array.isArray(payload.installments) && payload.installments.length > 0) {
      installmentsToInsert = payload.installments.map((it: any) => ({
        agreement_id: insertedAgreement.id,
        installment_number: Number(it.installment_number),
        amount: Number(it.amount),
        due_date: typeof it.due_date === 'string'
          ? it.due_date
          : ymdUTC(new Date(it.due_date)),
        status: it.status ?? 'PENDENTE',
        created_by_user_id: user?.id ?? null,
      }));
    } else {
      // fallback: gerar automaticamente
      const startStr =
        typeof payload.start_date === 'string' && payload.start_date
          ? payload.start_date
          : payload.start_date instanceof Date
            ? ymdUTC(payload.start_date)
            : ymdUTC(new Date()); // fallback: hoje (UTC)

      installmentsToInsert = generateInstallments({
        agreementId: insertedAgreement.id,
        totalAmount: Number(payload.total_amount),
        downPayment: Number(payload.down_payment ?? 0),
        numberOfInstallments: Number(payload.number_of_installments),
        startDate: startStr,
        userId: user?.id ?? null,
      });
    }

    if (installmentsToInsert.length > 0) {
      const { error: instErr, data: insertedInstallments } = await supabase
        .from('financial_installments')
        .insert(installmentsToInsert)
        .select('*');

      if (instErr) {
        console.error('Erro ao criar parcelas do acordo:', instErr);
        console.error('Dados das parcelas que falharam:', installmentsToInsert);

        // Não desfaz o acordo; adiciona um aviso nas notas
        await supabase
          .from('financial_agreements')
          .update({
            notes: `${payload.notes || ''} [AVISO: Erro ao gerar parcelas automaticamente. Por favor, adicione as parcelas manualmente.]`,
          })
          .eq('id', insertedAgreement.id);
      } else {
        console.log(`${insertedInstallments?.length || 0} parcelas criadas para o acordo ${insertedAgreement.id}`);
      }
    }

    return NextResponse.json(insertedAgreement, { status: 201 });
  } catch (error) {
    console.error('Falha ao criar acordo financeiro:', error);
    if (error instanceof Error && error.message.includes('inválidos')) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Erro no servidor ao criar acordo financeiro.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
