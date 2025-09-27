// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/lib/services/financialService.ts

import { createAdminClient, createSupabaseServerClient } from '../supabase/server'
import {
  EnhancedAgreement,
  EnhancedAgreementSchema,
  Installment,
  Payment,
  PaymentSchema,
} from '../schemas'
import { z } from 'zod'
import { AuthUser } from '@/lib/auth'
import { logAudit } from './auditService'


/**
 * Classe auxiliar dedicada a realizar cálculos financeiros.
 */
class FinancialCalculator {
  /**
   * Calcula e gera um array de parcelas com base nos parâmetros de um acordo.
   */
  static calculateInstallments(
    totalAmount: number,
    downPayment: number,
    numberOfInstallments: number,
    startDate: Date,
  ): Omit<Installment, 'id' | 'agreement_id' | 'created_at' | 'updated_at'>[] {
    const amountToFinance = totalAmount - downPayment
    if (amountToFinance < 0) {
      throw new Error('O valor financiado não pode ser negativo.')
    }
    if (numberOfInstallments <= 0) {
      throw new Error('O número de parcelas deve ser positivo.')
    }

    const installmentAmount = parseFloat(
      (amountToFinance / numberOfInstallments).toFixed(2),
    )
    const installments: Omit<Installment, 'id' | 'agreement_id' | 'created_at' | 'updated_at'>[] = []
    let accumulatedAmount = 0

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(startDate)
      dueDate.setMonth(dueDate.getMonth() + i)

      let currentInstallmentAmount = installmentAmount
      accumulatedAmount += installmentAmount

      if (i === numberOfInstallments) {
        const difference = amountToFinance - accumulatedAmount
        currentInstallmentAmount += parseFloat(difference.toFixed(2))
      }

      installments.push({
        installment_number: i,
        amount: parseFloat(currentInstallmentAmount.toFixed(2)),
        // *** CORREÇÃO APLICADA AQUI ***
        // Revertido para o tipo correto `Date`, conforme o schema.
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
   */
  static generateInstallmentPlan(
    agreementData: Pick<
      EnhancedAgreement,
      'total_amount' | 'down_payment' | 'number_of_installments' | 'start_date'
    >,
  ): Omit<Installment, 'id' | 'agreement_id' | 'created_at' | 'updated_at'>[] {
    return FinancialCalculator.calculateInstallments(
      agreementData.total_amount,
      agreementData.down_payment ?? 0,
      agreementData.number_of_installments,
      agreementData.start_date,
    )
  }

  /**
   * Cria um novo acordo financeiro e suas parcelas de forma transacional.
   */
  static async createFinancialAgreement(
    agreementData: EnhancedAgreement,
  ): Promise<EnhancedAgreement> {
    const supabase = await createSupabaseServerClient()

    const validationResult = EnhancedAgreementSchema.safeParse(agreementData)
    if (!validationResult.success) {
      console.error(
        'Erro de validação ao criar acordo:',
        validationResult.error.flatten(),
      )
      throw new Error('Dados do acordo inválidos.')
    }

    const validatedData = validationResult.data

    if (!validatedData.installments || validatedData.installments.length === 0) {
      validatedData.installments = this.generateInstallmentPlan(validatedData)
    }

    const { installments, ...agreement } = validatedData

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
   * Busca todos os acordos financeiros com informações essenciais para a listagem.
   */
  static async getFinancialAgreements(
    page = 1,
    pageSize = 10,
  ): Promise<any[]> {
    const supabase = await createSupabaseServerClient()
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error } = await supabase
      .from('financial_agreements')
      .select(
        `
        *,
        cases:case_id (
          id,
          case_number,
          title
        ),
        entities:debtor_id (
          id,
          name,
          document
        ),
        executed_entity:creditor_id (
          id,
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
   */
  static async getAgreementWithDetails(
    id: string,
  ): Promise<any | null> {
    const supabase = await createSupabaseServerClient()
    
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
        return null
      }
      console.error(`Erro ao buscar detalhes do acordo ${id}:`, error)
      throw new Error('Não foi possível buscar os detalhes do acordo.')
    }

    return data
  }

  /**
   * Atualiza um acordo financeiro existente.
   */
  static async updateFinancialAgreement(
    id: string,
    updates: Partial<EnhancedAgreement>,
  ): Promise<EnhancedAgreement> {
    const supabase = await createSupabaseServerClient()
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
   * Deleta um acordo financeiro.
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

  // ============================================================================
  // === NOVAS FUNÇÕES ADICIONADAS PARA GESTÃO DE PARCELAS ======================
  // ============================================================================

  /**
   * Busca todas as parcelas associadas a um acordo específico.
   */
  static async getInstallmentsByAgreementId(agreementId: number): Promise<Installment[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('financial_installments')
      .select('*')
      .eq('agreement_id', agreementId)
      .order('installment_number', { ascending: true });

    if (error) {
      console.error(`Erro ao buscar parcelas para o acordo ${agreementId}:`, error);
      throw new Error('Não foi possível buscar as parcelas.');
    }
    // Garante que o tipo de retorno corresponda a `Installment[]`
    return (data || []).map(item => ({...item, due_date: new Date(item.due_date)}));
  }

  /**
   * Registra o pagamento de uma parcela e atualiza seu status.
   */
  static async recordPaymentForInstallment(paymentData: z.infer<typeof PaymentSchema>, user: AuthUser) {
    const supabase = createAdminClient();
    const { installment_id, amount_paid, payment_date, payment_method, notes } = paymentData;

    const { data: newPayment, error: paymentError } = await supabase
      .from('financial_payments')
      .insert({
        installment_id,
        amount_paid,
        payment_date,
        payment_method,
        notes,
        recorded_by_user_id: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Erro ao registrar pagamento:', paymentError);
      throw new Error('Não foi possível registrar o pagamento.');
    }

    const { error: updateError } = await supabase
      .from('financial_installments')
      .update({ status: 'PAGA' })
      .eq('id', installment_id);

    if (updateError) {
      await supabase.from('financial_payments').delete().eq('id', newPayment.id);
      console.error('Erro ao atualizar status da parcela (pagamento desfeito):', updateError);
      throw new Error('O pagamento foi registrado, mas falhou ao atualizar a parcela. A operação foi desfeita.');
    }

    await logAudit('PAYMENT_RECORDED', user, {
      paymentId: newPayment.id,
      installmentId: installment_id,
      amount: amount_paid,
    });

    return newPayment;
  }
}