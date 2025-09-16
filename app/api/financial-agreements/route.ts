// app/api/financial-agreements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-config'

// 📊 ESQUEMAS DE VALIDAÇÃO
const FinancialAgreementSchema = z.object({
  clientId: z.coerce.number().min(1, 'ID do cliente é obrigatório'),
  processNumber: z.string().optional().nullable(),
  totalValue: z.coerce.number().min(0.01, 'Valor total deve ser maior que zero'),
  entryValue: z.coerce.number().min(0, 'Valor de entrada não pode ser negativo').optional().default(0),
  installments: z.coerce.number().min(1, 'Número de parcelas deve ser pelo menos 1'),
  firstDueDate: z.string().refine((date) => {
    const dateObj = new Date(date)
    return !isNaN(dateObj.getTime()) && dateObj > new Date()
  }, 'Data inválida ou deve ser futura'),
  agreementType: z.enum(['acordo_judicial', 'acordo_extrajudicial', 'parcelamento', 'quitacao', 'renegociacao']),
  status: z.enum(['active', 'completed', 'cancelled', 'suspended', 'defaulted']).default('active'),
  description: z.string().optional().nullable(),
  interestRate: z.coerce.number().min(0).default(0),
  applyIPCA: z.boolean().default(true),
}).refine(data => data.entryValue <= data.totalValue, {
  message: "Valor de entrada não pode ser maior que o valor total",
  path: ["entryValue"]
})

// 💰 CLASSE PARA CÁLCULOS FINANCEIROS COM IPCA
class FinancialCalculator {
  private static IPCA_API_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados'

  static async getIPCAData(startDate: Date, endDate: Date = new Date()): Promise<number> {
    try {
      const formattedStart = startDate.toLocaleDateString('pt-BR')
      const formattedEnd = endDate.toLocaleDateString('pt-BR')
      
      const response = await fetch(
        `${this.IPCA_API_URL}?dataInicial=${formattedStart}&dataFinal=${formattedEnd}&formato=json`
      )
      
      if (!response.ok) throw new Error(`Erro na API: ${response.status}`)
      
      const data = await response.json()
      return data.reduce((acc: number, item: any) => acc + parseFloat(item.valor), 0) / 100
      
    } catch (error) {
      // Fallback para IPCA médio mensal
      const months = this.getMonthsDifference(startDate, endDate)
      return months * 0.0045 // 0.45% ao mês
    }
  }

  private static getMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth())
  }

  static calculateInstallments(totalValue: number, installments: number, entryValue: number = 0): {
    installmentValue: number
    remainingValue: number
    entryPercentage: number
  } {
    const remainingValue = totalValue - entryValue
    const installmentValue = remainingValue / installments
    
    return {
      installmentValue: Math.round(installmentValue * 100) / 100,
      remainingValue: Math.round(remainingValue * 100) / 100,
      entryPercentage: entryValue > 0 ? Math.round((entryValue / totalValue) * 10000) / 100 : 0
    }
  }
}

// 🔍 GET - Listar acordos financeiros
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const agreementType = searchParams.get('agreementType')
    const search = searchParams.get('search')
    
    let query = supabase
      .from('financial_agreements')
      .select(`
        *,
        clients:client_id (
          id,
          name,
          email,
          phone
        )
      `, { count: 'exact' })
    
    if (status) query = query.eq('status', status)
    if (clientId) query = query.eq('client_id', clientId)
    if (agreementType) query = query.eq('agreement_type', agreementType)
    if (search) {
      query = query.or(`process_number.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    const { data: agreements, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)
    
    if (error) throw error

    return NextResponse.json({
      agreements: agreements || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: count ? page * limit < count : false
      }
    })
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao buscar acordos', details: error.message },
      { status: 500 }
    )
  }
}

// ➕ POST - Criar novo acordo financeiro
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = FinancialAgreementSchema.parse(body)
    
    const supabase = createServerSupabaseClient()
    
    // Verificar se cliente existe
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', validatedData.clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    // Verificar número de processo único
    if (validatedData.processNumber) {
      const { data: existingAgreement } = await supabase
        .from('financial_agreements')
        .select('id')
        .eq('process_number', validatedData.processNumber)
        .single()

      if (existingAgreement) {
        return NextResponse.json(
          { error: 'Número de processo já existe' },
          { status: 400 }
        )
      }
    }

    const calculations = FinancialCalculator.calculateInstallments(
      validatedData.totalValue,
      validatedData.installments,
      validatedData.entryValue
    )

    const agreementData = {
      client_id: validatedData.clientId,
      process_number: validatedData.processNumber,
      total_value: validatedData.totalValue,
      entry_value: validatedData.entryValue,
      installments: validatedData.installments,
      installment_value: calculations.installmentValue,
      remaining_value: calculations.remainingValue,
      first_due_date: new Date(validatedData.firstDueDate).toISOString(),
      agreement_type: validatedData.agreementType,
      status: validatedData.status,
      description: validatedData.description,
      interest_rate: validatedData.interestRate,
      apply_ipca: validatedData.applyIPCA,
      ipca_base_date: new Date().toISOString(),
    }

    const { data: agreement, error: insertError } = await supabase
      .from('financial_agreements')
      .insert(agreementData)
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

    if (insertError) throw insertError

    return NextResponse.json({
      message: 'Acordo criado com sucesso',
      agreement,
      calculations
    }, { status: 201 })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
