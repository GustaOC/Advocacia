// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/lib/services/financialService.ts

import { createSupabaseServerClient } from '../supabase/server'
import {
  EnhancedAgreement,
  EnhancedAgreementSchema,
  Installment,
  InstallmentSchema,
  Payment,
  PaymentSchema,
} from '../schemas'
import { z } from 'zod'

/**
 * Classe auxiliar dedicada a realizar cálculos financeiros.
 * Mantém a lógica de cálculo separada das interações com o banco de dados.
 */
class FinancialCalculator {
  /**
   * Calcula e gera um array de parcelas com base nos parâmetros de um acordo.
   * @param totalAmount - O valor total do acordo.
   * @param downPayment - O valor da entrada.
   * @param numberOfInstallments - O número de parcelas.
   * @param startDate - A data de início do acordo, usada como base para a primeira parcela.
   * @returns Um array de objetos de parcela, pronto para ser inserido no banco.
   */
  static calculateInstallments(
    totalAmount: number,
    downPayment: number,
    numberOfInstallments: number,
    startDate: Date,
  ): Omit<Installment, 'id' | 'agreement_id'>[] {
    const amountToFinance = totalAmount - downPayment
    if (amountToFinance < 0) {
      throw new Error('O valor financiado não pode ser negativo.')
    }
    if (numberOfInstallments <= 0) {
      throw new Error('O número de parcelas deve ser positivo.')
    }

    // Arredonda para 2 casas decimais para evitar problemas com ponto flutuante
    const installmentAmount = parseFloat(
      (amountToFinance / numberOfInstallments).toFixed(2),
    )
    const installments: Omit<Installment, 'id' | 'agreement_id'>[] = []
    let accumulatedAmount = 0

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(startDate)
      // Adiciona 'i' meses à data de início para o vencimento. Ex: 1ª parcela vence em 1 mês.
      dueDate.setMonth(dueDate.getMonth() + i)

      let currentInstallmentAmount = installmentAmount
      accumulatedAmount += installmentAmount

      // Lógica de ajuste para a última parcela
      // Garante que a soma das parcelas seja exatamente o valor financiado
      if (i === numberOfInstallments) {
        const difference = amountToFinance - accumulatedAmount
        currentInstallmentAmount += parseFloat(difference.toFixed(2))
      }

      installments.push({
        installment_number: i,
        amount: parseFloat(currentInstallmentAmount.toFixed(2)),
        due_date: dueDate,
        status: 'PENDENTE',
      })
    }

    return installments
  }
}

/**
 * Classe de serviço para gerenciar todas as operações de lógica de negócios
 * relacionadas a acordos financeiros, parcelas e pagamentos.
 */
export class FinancialService {
  /**
   * Gera um plano de parcelamento para um acordo.
   * Este método serve como um ponto de acesso público à lógica de cálculo.
   * @param agreementData - Dados parciais do acordo contendo os valores para o cálculo.
   * @returns Um array de objetos de parcela.
   */
  static generateInstallmentPlan(
    agreementData: Pick<
      EnhancedAgreement,
      'total_amount' | 'down_payment' | 'number_of_installments' | 'start_date'
    >,
  ): Omit<Installment, 'id' | 'agreement_id'>[] {
    return FinancialCalculator.calculateInstallments(
      agreementData.total_amount,
      agreementData.down_payment ?? 0,
      agreementData.number_of_installments,
      agreementData.start_date,
    )
  }

  /**
   * Cria um novo acordo financeiro e suas parcelas de forma transacional.
   * Se as parcelas não forem fornecidas, elas são calculadas automaticamente.
   * @param agreementData - Os dados do acordo, validados pelo schema Zod.
   * @returns O acordo recém-criado.
   * @throws Lança um erro se a validação dos dados falhar ou se a operação no banco de dados falhar.
   */
  static async createFinancialAgreement(
    agreementData: EnhancedAgreement,
  ): Promise<EnhancedAgreement> {
    const supabase = await createSupabaseServerClient()

    // 1. Validação rigorosa dos dados de entrada
    const validationResult = EnhancedAgreementSchema.safeParse(agreementData)
    if (!validationResult.success) {
      console.error(
        'Erro de validação ao criar acordo:',
        validationResult.error.flatten(),
      )
      throw new Error('Dados do acordo inválidos.')
    }

    const validatedData = validationResult.data

    // 2. Geração automática de parcelas se não forem fornecidas
    if (!validatedData.installments || validatedData.installments.length === 0) {
      validatedData.installments = this.generateInstallmentPlan(validatedData)
    }

    const { installments, ...agreement } = validatedData

    // 3. Chama a função PostgreSQL para garantir a atomicidade
    const { data, error } = await supabase.rpc(
      'create_agreement_with_installments',
      {
        agreement_data: agreement,
        installments_data: installments || [],
      },
    )

    if (error) {
      console.error('Erro na RPC ao criar acordo financeiro:', error)
      throw new Error(
        'Não foi possível criar o acordo. A operação foi revertida.',
      )
    }

    return data as EnhancedAgreement
  }

  /**
   * Busca todos os acordos financeiros com informações básicas para listagem.
   * Inclui paginação.
   *
   * @param page - O número da página para a paginação.
   * @param pageSize - O número de itens por página.
   * @returns Uma lista de acordos financeiros.
   * @throws Lança um erro se a consulta ao banco de dados falhar.
   */
  static async getFinancialAgreements(
    page = 1,
    pageSize = 10,
  ): Promise<any[]> {
    const supabase = await createSupabaseServerClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // ✅ CORREÇÃO APLICADA AQUI
    const { data, error } = await supabase
      .from('financial_agreements')
      .select(
        `
        id,
        total_amount,
        status,
        start_date,
        number_of_installments,
        cases (
          case_number
        ),
        debtor:entities!debtor_id (
          name
        )
      `,
      )
      .range(from, to)
      .order('start_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar acordos financeiros:', error)
      throw new Error('Não foi possível buscar os acordos.')
    }

    return data
  }

  /**
   * Busca um único acordo financeiro pelo seu ID com todos os detalhes.
   *
   * @param id - O UUID do acordo a ser buscado.
   * @returns O acordo financeiro com suas parcelas e pagamentos.
   * @throws Lança um erro se o acordo não for encontrado ou se a consulta falhar.
   */
  static async getAgreementWithDetails(
    id: string,
  ): Promise<any | null> {
    const supabase = await createSupabaseServerClient()
    
    // ✅ CORREÇÃO APLICADA AQUI
    const { data, error } = await supabase
      .from('financial_agreements')
      .select(
        `
        *,
        cases (*),
        debtor:entities!debtor_id (*),
        creditor:entities!creditor_id (*),
        installments (
          *,
          payments (*)
        )
      `,
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Código para 'not found'
        return null
      }
      console.error(`Erro ao buscar detalhes do acordo ${id}:`, error)
      throw new Error('Não foi possível buscar os detalhes do acordo.')
    }

    return data
  }

  /**
   * Atualiza um acordo financeiro existente.
   *
   * @param id - O UUID do acordo a ser atualizado.
   * @param updates - Um objeto com os campos a serem atualizados.
   * @returns O acordo atualizado.
   * @throws Lança um erro se a atualização falhar.
   */
  static async updateFinancialAgreement(
    id: string,
    updates: Partial<EnhancedAgreement>,
  ): Promise<EnhancedAgreement> {
    const supabase = await createSupabaseServerClient()

    // Impede a atualização de campos sensíveis ou relacionamentos por este método
    const { installments, case_id, debtor_id, creditor_id, ...safeUpdates } = updates

    const { data, error } = await supabase
      .from('financial_agreements')
      .update(safeUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error(`Erro ao atualizar o acordo ${id}:`, error)
      throw new Error('Não foi possível atualizar o acordo.')
    }

    return data as EnhancedAgreement
  }

  /**
   * Registra um pagamento para uma parcela específica.
   * Esta operação também deve ser transacional para garantir consistência.
   *
   * @param paymentData - Os dados do pagamento.
   * @returns O registro do pagamento criado.
   * @throws Lança um erro se a operação falhar.
   */
  static async recordPayment(paymentData: Payment): Promise<Payment> {
    const supabase = await createSupabaseServerClient()

    const validationResult = PaymentSchema.safeParse(paymentData)
    if (!validationResult.success) {
      console.error(
        'Erro de validação ao registrar pagamento:',
        validationResult.error.flatten(),
      )
      throw new Error('Dados do pagamento inválidos.')
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(validationResult.data)
      .select()
      .single()

    if (paymentError) {
      console.error('Erro ao inserir pagamento:', paymentError)
      throw new Error('Não foi possível registrar o pagamento.')
    }

    const { error: installmentError } = await supabase
      .from('installments')
      .update({ status: 'PAGA' })
      .eq('id', paymentData.installment_id)

    if (installmentError) {
      console.error('Erro ao atualizar status da parcela:', installmentError)
      throw new Error(
        'Pagamento registrado, mas falha ao atualizar status da parcela.',
      )
    }

    return payment as Payment
  }

  /**
   * Deleta um acordo financeiro e todas as suas dependências (parcelas, pagamentos).
   * Requer `ON DELETE CASCADE` configurado nas chaves estrangeiras do banco de dados.
   *
   * @param id - O UUID do acordo a ser deletado.
   * @returns Verdadeiro se a exclusão for bem-sucedida.
   * @throws Lança um erro se a exclusão falhar.
   */
  static async deleteFinancialAgreement(id: string): Promise<boolean> {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.from('financial_agreements').delete().eq('id', id)

    if (error) {
      console.error(`Erro ao deletar o acordo ${id}:`, error)
      throw new Error('Não foi possível deletar o acordo.')
    }

    return true
  }
}