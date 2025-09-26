// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/app/api/financial-agreements/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { FinancialService } from '@/lib/services/financialService'
import { EnhancedAgreementSchema } from '@/lib/schemas'
import { z } from 'zod'

/**
 * Rota para buscar uma lista paginada de acordos financeiros.
 * @param req NextRequest - A requisição pode conter query params 'page' e 'pageSize'.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)

    const agreements = await FinancialService.getFinancialAgreements(
      page,
      pageSize,
    )
    return NextResponse.json(agreements)
  } catch (error) {
    console.error('Falha ao buscar acordos financeiros:', error)
    return NextResponse.json(
      {
        message: 'Erro no servidor ao buscar acordos financeiros.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

/**
 * Rota para criar um novo acordo financeiro de forma transacional.
 * @param req NextRequest - A requisição deve conter no corpo os dados do acordo.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Valida o corpo da requisição usando o schema Zod
    const validationResult = EnhancedAgreementSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Dados inválidos.',
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    // Chama o serviço para criar o acordo de forma transacional
    const newAgreement = await FinancialService.createFinancialAgreement(
      validationResult.data,
    )

    return NextResponse.json(newAgreement, { status: 201 })
  } catch (error) {
    console.error('Falha ao criar acordo financeiro:', error)
    // Se o erro for uma instância de Error, podemos passar a mensagem
    if (error instanceof Error && error.message.includes('inválidos')) {
        return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: 'Erro no servidor ao criar acordo financeiro.',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}