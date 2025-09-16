// app/api/financial-agreements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-config'

// 📊 ESQUEMAS DE VALIDAÇÃO
const UpdateAgreementSchema = z.object({
  totalValue: z.coerce.number().min(0.01, 'Valor total deve ser maior que zero').optional(),
  entryValue: z.coerce.number().min(0, 'Valor de entrada não pode ser negativo').optional(),
  installments: z.coerce.number().min(1, 'Número de parcelas deve ser pelo menos 1').optional(),
  firstDueDate: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Data inválida')
    .refine((date) => new Date(date) > new Date(), 'Data deve ser futura')
    .optional(),
  agreementType: z.enum(['acordo_judicial', 'acordo_extrajudicial', 'parcelamento', 'quitacao', 'renegociacao']).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'suspended', 'defaulted']).optional(),
  description: z.string().optional().nullable(),
  paidInstallments: z.coerce.number().min(0, 'Parcelas pagas não podem ser negativas').optional(),
  interestRate: z.coerce.number().min(0, 'Taxa de juros não pode ser negativa').optional(),
  applyIPCA: z.boolean().optional()
}).refine(data => {
  if (data.entryValue !== undefined && data.totalValue !== undefined) {
    return data.entryValue <= data.totalValue
  }
  return true
}, {
  message: "Valor de entrada não pode ser maior que o valor total",
  path: ["entryValue"]
})

// 💰 CLASSE PARA CÁLCULOS FINANCEIROS
class FinancialCalculator {
  static calculateInstallments(totalValue: number, installments: number, entryValue: number = 0): {
    installmentValue: number
    remainingValue: number
    entryPercentage: number
  } {
    const remainingValue = totalValue - entryValue
    const installmentValue = remainingValue / installments
    const entryPercentage = entryValue > 0 ? (entryValue / totalValue) * 100 : 0
    
    return {
      installmentValue: Math.round(installmentValue * 100) / 100,
      remainingValue: Math.round(remainingValue * 100) / 100,
      entryPercentage: Math.round(entryPercentage * 100) / 100
    }
  }
}

// 🔍 GET - Obter acordo financeiro específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' }, 
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const includeHistory = searchParams.get('include_history') === 'true'

    // Buscar acordo
    const { data: agreement, error: agreementError } = await supabase
      .from('financial_agreements')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone,
          document
        )
      `)
      .eq('id', id)
      .single()

    if (agreementError || !agreement) {
      return NextResponse.json(
        { error: 'Acordo não encontrado' }, 
        { status: 404 }
      )
    }

    // Buscar histórico se solicitado
    let history = null
    if (includeHistory) {
      const { data: historyData, error: historyError } = await supabase
        .from('agreement_history')
        .select('*')
        .eq('agreement_id', id)
        .order('created_at', { ascending: false })
      
      if (!historyError) {
        history = historyData
      }
    }

    return NextResponse.json({
      agreement,
      history
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// ✏️ PUT - Atualizar acordo financeiro
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' }, 
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = UpdateAgreementSchema.parse(body)

    const supabase = createServerSupabaseClient()

    // Verificar se acordo existe
    const { data: existingAgreement, error: fetchError } = await supabase
      .from('financial_agreements')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingAgreement) {
      return NextResponse.json(
        { error: 'Acordo não encontrado' }, 
        { status: 404 }
      )
    }

    // Validar regras de negócio
    if (existingAgreement.status === 'completed') {
      return NextResponse.json(
        { error: 'Não é possível alterar um acordo finalizado' }, 
        { status: 400 }
      )
    }

    // Validar parcelas pagas
    if (validatedData.paidInstallments !== undefined) {
      const installments = validatedData.installments || existingAgreement.installments
      if (validatedData.paidInstallments > installments) {
        return NextResponse.json(
          { error: 'Parcelas pagas não podem exceder o total de parcelas' },
          { status: 400 }
        )
      }
    }

    // Calcular valores se necessário
    let calculations = null
    if (validatedData.totalValue !== undefined || 
        validatedData.installments !== undefined || 
        validatedData.entryValue !== undefined) {
      
      const totalValue = validatedData.totalValue ?? existingAgreement.total_value
      const installments = validatedData.installments ?? existingAgreement.installments
      const entryValue = validatedData.entryValue ?? existingAgreement.entry_value
      
      calculations = FinancialCalculator.calculateInstallments(
        totalValue, 
        installments, 
        entryValue
      )
    }

    // Preparar campos para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Mapear campos do schema para colunas do banco
    if (validatedData.totalValue !== undefined) updateData.total_value = validatedData.totalValue
    if (validatedData.entryValue !== undefined) updateData.entry_value = validatedData.entryValue
    if (validatedData.installments !== undefined) updateData.installments = validatedData.installments
    if (validatedData.firstDueDate !== undefined) updateData.first_due_date = new Date(validatedData.firstDueDate).toISOString()
    if (validatedData.agreementType !== undefined) updateData.agreement_type = validatedData.agreementType
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.paidInstallments !== undefined) updateData.paid_installments = validatedData.paidInstallments
    if (validatedData.interestRate !== undefined) updateData.interest_rate = validatedData.interestRate
    if (validatedData.applyIPCA !== undefined) updateData.apply_ipca = validatedData.applyIPCA

    // Adicionar cálculos se houver
    if (calculations) {
      updateData.installment_value = calculations.installmentValue
      updateData.remaining_value = calculations.remainingValue
    }

    // Atualizar status para completed se todas as parcelas foram pagas
    if (validatedData.paidInstallments !== undefined) {
      const totalInstallments = validatedData.installments || existingAgreement.installments
      if (validatedData.paidInstallments === totalInstallments) {
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
      }
    }

    // Executar atualização
    const { data: updatedAgreement, error: updateError } = await supabase
      .from('financial_agreements')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `)
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar acordo', details: updateError.message },
        { status: 500 }
      )
    }

    // Registrar no histórico se houver mudanças significativas
    if (Object.keys(updateData).length > 1) { // Mais que apenas updated_at
      await supabase
        .from('agreement_history')
        .insert({
          agreement_id: id,
          action: 'update',
          details: JSON.stringify(updateData),
          changed_by: 'system' // Em uma aplicação real, usar ID do usuário autenticado
        })
    }

    return NextResponse.json({
      message: 'Acordo atualizado com sucesso',
      agreement: updatedAgreement,
      ...(calculations && { calculations })
    })

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// 🗑️ DELETE - Excluir acordo financeiro
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: 'ID inválido' }, 
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const confirm = searchParams.get('confirm') === 'true'

    // Verificar se o acordo existe
    const { data: existingAgreement, error: fetchError } = await supabase
      .from('financial_agreements')
      .select(`
        *,
        clients:client_id (name)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingAgreement) {
      return NextResponse.json(
        { error: 'Acordo não encontrado' }, 
        { status: 404 }
      )
    }

    // Verificar se há parcelas pagas e confirmar exclusão
    if (existingAgreement.paid_installments > 0 && !confirm) {
      return NextResponse.json(
        {
          error: 'Confirmação necessária',
          message: `Este acordo tem ${existingAgreement.paid_installments} parcela(s) paga(s). Para confirmar a exclusão, adicione ?confirm=true à URL.`,
          agreement: existingAgreement
        },
        { status: 400 }
      )
    }

    // Registrar ação no histórico antes de excluir
    await supabase
      .from('agreement_history')
      .insert({
        agreement_id: id,
        action: 'delete',
        details: JSON.stringify(existingAgreement),
        changed_by: 'system'
      })

    // Excluir acordo
    const { error: deleteError } = await supabase
      .from('financial_agreements')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Erro ao excluir acordo', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Acordo excluído com sucesso',
      deleted_agreement: existingAgreement
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}
