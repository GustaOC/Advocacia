// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/app/api/financial-agreements/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { FinancialService } from '@/lib/services/financialService'
import { z } from 'zod'

// Schema para validar os parâmetros da URL
const paramsSchema = z.object({
  id: z.string().uuid({ message: 'O ID fornecido é inválido.' }),
})

/**
 * Rota para buscar os detalhes de um acordo financeiro específico.
 * @param req NextRequest
 * @param params Contém o ID do acordo.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const validation = paramsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'ID do acordo inválido.' },
        { status: 400 },
      )
    }

    const agreement = await FinancialService.getAgreementWithDetails(
      validation.data.id,
    )

    if (!agreement) {
      return NextResponse.json(
        { message: 'Acordo não encontrado.' },
        { status: 404 },
      )
    }

    return NextResponse.json(agreement)
  } catch (error) {
    console.error(`Falha ao buscar acordo ${params.id}:`, error)
    return NextResponse.json(
      { message: 'Erro no servidor ao buscar detalhes do acordo.' },
      { status: 500 },
    )
  }
}

/**
 * Rota para atualizar parcialmente um acordo financeiro.
 * @param req NextRequest
 * @param params Contém o ID do acordo.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const validation = paramsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'ID do acordo inválido.' },
        { status: 400 },
      )
    }

    const body = await req.json()
    // TODO: Adicionar validação Zod para os campos do body, se necessário.

    const updatedAgreement = await FinancialService.updateFinancialAgreement(
      validation.data.id,
      body,
    )

    return NextResponse.json(updatedAgreement)
  } catch (error) {
    console.error(`Falha ao atualizar acordo ${params.id}:`, error)
    return NextResponse.json(
      { message: 'Erro no servidor ao atualizar o acordo.' },
      { status: 500 },
    )
  }
}

/**
 * Rota para deletar um acordo financeiro.
 * @param req NextRequest
 * @param params Contém o ID do acordo.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const validation = paramsSchema.safeParse(params)
    if (!validation.success) {
      return NextResponse.json(
        { message: 'ID do acordo inválido.' },
        { status: 400 },
      )
    }

    await FinancialService.deleteFinancialAgreement(validation.data.id)

    return NextResponse.json(
      { message: 'Acordo deletado com sucesso.' },
      { status: 200 },
    )
  } catch (error) {
    console.error(`Falha ao deletar acordo ${params.id}:`, error)
    return NextResponse.json(
      { message: 'Erro no servidor ao deletar o acordo.' },
      { status: 500 },
    )
  }
}