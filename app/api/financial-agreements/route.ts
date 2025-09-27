// app/api/financial-agreements/route.ts - VERSÃO FINAL CORRIGIDA

import { NextRequest, NextResponse } from 'next/server';
import { FinancialService } from '@/lib/services/financialService';
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

    const newAgreement = await FinancialService.createFinancialAgreement(
      validationResult.data,
    );

    return NextResponse.json(newAgreement, { status: 201 });
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