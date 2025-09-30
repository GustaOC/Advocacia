// app/api/financial-agreements/route.ts - VERSÃO FINAL CORRIGIDA

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

/**
 * Rota para buscar uma lista de acordos financeiros com todos os dados relacionados.
 * @param req NextRequest
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    // CORREÇÃO: Removi a coluna 'court' da consulta, pois ela não existe na sua tabela 'cases'.
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

    // Processa os dados para extrair a entidade "Executado" e formatar a resposta
    const processedData = data.map(agreement => {
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
      { status: 500 },
    );
  }
}

/**
 * Rota para criar um novo acordo financeiro de forma transacional.
 * @param req NextRequest
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
        { status: 400 },
      );
    }

    const user = await getSessionUser();
    const supabase = createAdminClient();

    const payload = validationResult.data;

    // Inserir o acordo financeiro principal
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

    // Se vierem parcelas (opcional), inserir na tabela de parcelas
    if (Array.isArray(payload.installments) && payload.installments.length > 0) {
      const installmentsRows = payload.installments.map((it) => ({
        agreement_id: insertedAgreement.id,
        installment_number: Number(it.installment_number),
        amount: Number(it.amount),
        due_date: it.due_date,
        status: it.status,
        created_by_user_id: user?.id ?? null,
      }));

      const { error: instErr } = await supabase
        .from('financial_installments')
        .insert(installmentsRows);

      if (instErr) {
        console.error('Erro ao criar parcelas do acordo:', instErr);
        // Não desfaz o acordo; apenas registra erro e segue
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
      { status: 500 },
    );
  }
}
