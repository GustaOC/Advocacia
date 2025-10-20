// app/api/installments/debug/route.ts

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic' // CORREÇÃO APLICADA

// NOTE: Rota de depuração para testar a lógica de atualização de parcelas
export async function GET(request: Request) {
  try {
    const user = await getSessionUser()
    if (!user || user.role !== 'admin') {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const agreementId = searchParams.get('agreement_id')

    if (!agreementId) {
      return new Response('Missing agreement_id', { status: 400 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.rpc('update_installments_for_agreement', {
      p_agreement_id: parseInt(agreementId),
    })

    if (error) {
      console.error('ERRO no debug:', error)
      return new Response(`Erro ao atualizar parcelas: ${error.message}`, {
        status: 500,
      })
    }

    return NextResponse.json({
      message: 'Função update_installments_for_agreement executada com sucesso.',
    })
  } catch (error: any) {
    console.error('ERRO no debug:', error)
    return new Response(`Erro inesperado: ${error.message}`, {
      status: 500,
    })
  }
}