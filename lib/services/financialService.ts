// lib/services/financialService.ts - VERSÃO COMPLETAMENTE EXPANDIDA
import { createAdminClient } from "@/lib/supabase/server";
import { EnhancedAgreementSchema, EnhancedAgreementUpdateSchema, RenegotiationSchema } from "@/lib/schemas";

/**
 * Busca todos os acordos financeiros com informações expandidas e JOINs completos.
 * Inclui dados calculados como parcelas pagas, valor em atraso, etc.
 */
export async function getFinancialAgreements() {
  const supabase = createAdminClient();
  
  const { data: agreements, error } = await supabase
    .from("financial_agreements")
    .select(`
      *,
      cases (
        id,
        case_number,
        title,
        status,
        court,
        priority
      ),
      client_entities:entities!client_entity_id (
        id,
        name,
        document,
        email,
        phone
      ),
      executed_entities:entities!executed_entity_id (
        id,
        name,
        document,
        email,
        phone
      ),
      guarantor_entities:entities!guarantor_entity_id (
        id,
        name,
        document,
        email,
        phone
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar acordos financeiros expandidos:", error);
    throw new Error("Não foi possível buscar os acordos financeiros.");
  }

  // Calcular informações adicionais para cada acordo
  const enrichedAgreements = await Promise.all(
    (agreements || []).map(async (agreement) => {
      const calculatedData = await calculateAgreementData(agreement.id);
      return {
        ...agreement,
        ...calculatedData
      };
    })
  );

  return enrichedAgreements;
}

/**
 * Calcula dados dinâmicos de um acordo (parcelas pagas, em atraso, próximo vencimento, etc.)
 */
async function calculateAgreementData(agreementId: number) {
  const supabase = createAdminClient();
  
  // Buscar dados do acordo e installments relacionadas
  const { data: agreement } = await supabase
    .from("financial_agreements")
    .select("*")
    .eq("id", agreementId)
    .single();

  if (!agreement) {
    return {
      paid_installments: 0,
      overdue_installments: 0,
      next_due_date: null,
      remaining_balance: 0,
      paid_amount: 0,
      overdue_amount: 0,
      days_overdue: 0,
      completion_percentage: 0
    };
  }

  // Buscar histórico de pagamentos (assumindo uma tabela de installments)
  const { data: installments } = await supabase
    .from("agreement_installments")
    .select("*")
    .eq("agreement_id", agreementId)
    .order("due_date", { ascending: true });

  const now = new Date();
  const paidInstallments = (installments || []).filter(i => i.status === 'paid').length;
  const overdueInstallments = (installments || []).filter(i => 
    i.status === 'pending' && new Date(i.due_date) < now
  ).length;
  
  const paidAmount = (installments || [])
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0);
    
  const overdueAmount = (installments || [])
    .filter(i => i.status === 'pending' && new Date(i.due_date) < now)
    .reduce((sum, i) => sum + i.amount, 0);

  const nextInstallment = (installments || [])
    .find(i => i.status === 'pending');
    
  const nextDueDate = nextInstallment ? nextInstallment.due_date : null;
  
  const daysOverdue = nextInstallment && new Date(nextInstallment.due_date) < now 
    ? Math.floor((now.getTime() - new Date(nextInstallment.due_date).getTime()) / (1000 * 3600 * 24))
    : 0;

  const completionPercentage = agreement.total_value > 0 
    ? Math.round((paidAmount / agreement.total_value) * 100) 
    : 0;

  const remainingBalance = agreement.total_value - paidAmount;

  return {
    paid_installments: paidInstallments,
    overdue_installments: overdueInstallments,
    next_due_date: nextDueDate,
    remaining_balance: remainingBalance,
    paid_amount: paidAmount,
    overdue_amount: overdueAmount,
    days_overdue: daysOverdue,
    completion_percentage: completionPercentage
  };
}

/**
 * Busca um acordo financeiro específico com todas as informações expandidas
 */
export async function getFinancialAgreementById(id: string) {
  const supabase = createAdminClient();
  
  const { data: agreement, error } = await supabase
    .from("financial_agreements")
    .select(`
      *,
      cases (
        id,
        case_number,
        title,
        status,
        court,
        priority
      ),
      client_entities:entities!client_entity_id (
        id,
        name,
        document,
        email,
        phone,
        address
      ),
      executed_entities:entities!executed_entity_id (
        id,
        name,
        document,
        email,
        phone,
        address
      ),
      guarantor_entities:entities!guarantor_entity_id (
        id,
        name,
        document,
        email,
        phone,
        address
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`Erro ao buscar acordo ${id}:`, error);
    throw new Error("Não foi possível buscar o acordo financeiro.");
  }

  // Adicionar dados calculados
  const calculatedData = await calculateAgreementData(parseInt(id));
  
  return {
    ...agreement,
    ...calculatedData
  };
}

/**
 * Cria um novo acordo financeiro expandido
 */
export async function createFinancialAgreement(agreementData: unknown) {
  const parsedData = EnhancedAgreementSchema.parse(agreementData);
  const supabase = createAdminClient();
  
  console.log("📝 Criando acordo financeiro expandido:", parsedData);
  
  // Iniciar transação
  const { data: agreement, error: agreementError } = await supabase
    .from("financial_agreements")
    .insert(parsedData)
    .select()
    .single();

  if (agreementError) {
    console.error("Erro ao criar acordo financeiro:", agreementError);
    throw new Error(`Erro ao criar acordo: ${agreementError.message}`);
  }

  // Criar as parcelas automaticamente
  await createAgreementInstallments(agreement.id, agreement);
  
  console.log("✅ Acordo e parcelas criados com sucesso:", agreement);
  return agreement;
}

/**
 * Cria as parcelas de um acordo automaticamente
 */
async function createAgreementInstallments(agreementId: number, agreement: any) {
  const supabase = createAdminClient();
  
  const installments = [];
  const firstDueDate = new Date(agreement.first_due_date);
  
  for (let i = 0; i < agreement.installments; i++) {
    const dueDate = new Date(firstDueDate);
    
    // Calcular data de vencimento baseada no intervalo
    switch (agreement.installment_interval) {
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + i);
        break;
      case 'biweekly':
        dueDate.setDate(dueDate.getDate() + (i * 14));
        break;
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + (i * 7));
        break;
      case 'custom':
        dueDate.setMonth(dueDate.getMonth() + i); // Default para mensal
        break;
    }
    
    installments.push({
      agreement_id: agreementId,
      installment_number: i + 1,
      due_date: dueDate.toISOString().split('T')[0],
      amount: agreement.installment_value,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }
  
  const { error } = await supabase
    .from("agreement_installments")
    .insert(installments);
    
  if (error) {
    console.error("Erro ao criar parcelas do acordo:", error);
    throw new Error("Erro ao criar as parcelas do acordo");
  }
}

/**
 * Atualiza um acordo financeiro
 */
export async function updateFinancialAgreement(id: string, agreementData: unknown) {
  const parsedData = EnhancedAgreementUpdateSchema.parse(agreementData);
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("financial_agreements")
    .update({
      ...parsedData,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar acordo ${id}:`, error);
    throw new Error(`Erro ao atualizar acordo: ${error.message}`);
  }
  
  // Se o número de parcelas mudou, recriar as parcelas
  if (parsedData.installments || parsedData.installment_value || parsedData.first_due_date) {
    await recreateAgreementInstallments(parseInt(id), data);
  }
  
  return data;
}

/**
 * Recria as parcelas quando o acordo é modificado
 */
async function recreateAgreementInstallments(agreementId: number, agreement: any) {
  const supabase = createAdminClient();
  
  // Deletar parcelas existentes que não foram pagas
  await supabase
    .from("agreement_installments")
    .delete()
    .eq("agreement_id", agreementId)
    .neq("status", "paid");
    
  // Criar novas parcelas
  await createAgreementInstallments(agreementId, agreement);
}

/**
 * Renegocia um acordo financeiro
 */
export async function renegotiateFinancialAgreement(id: string, renegotiationData: unknown) {
  const parsedData = RenegotiationSchema.parse(renegotiationData);
  const supabase = createAdminClient();
  
  // Buscar acordo atual
  const { data: currentAgreement } = await supabase
    .from("financial_agreements")
    .select("*")
    .eq("id", id)
    .single();
    
  if (!currentAgreement) {
    throw new Error("Acordo não encontrado para renegociação");
  }
  
  // Calcular novos valores
  const newTotalValue = parsedData.new_total_value || currentAgreement.total_value;
  const newInstallments = parsedData.new_installments || currentAgreement.installments;
  const newEntryValue = parsedData.new_entry_value || currentAgreement.entry_value;
  const newInstallmentValue = parsedData.new_installment_value || 
    (newTotalValue - newEntryValue) / newInstallments;
  
  // Atualizar acordo
  const { data: updatedAgreement, error } = await supabase
    .from("financial_agreements")
    .update({
      total_value: newTotalValue,
      entry_value: newEntryValue,
      installments: newInstallments,
      installment_value: newInstallmentValue,
      first_due_date: parsedData.new_first_due_date,
      status: 'renegotiated',
      renegotiation_count: currentAgreement.renegotiation_count + 1,
      notes: `${currentAgreement.notes || ''}\n\n[RENEGOCIAÇÃO ${new Date().toLocaleDateString('pt-BR')}]: ${parsedData.renegotiation_reason}`,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error(`Erro ao renegociar acordo ${id}:`, error);
    throw new Error(`Erro ao renegociar acordo: ${error.message}`);
  }
  
  // Registrar histórico da renegociação
  await supabase
    .from("agreement_renegotiation_history")
    .insert({
      agreement_id: parseInt(id),
      previous_total_value: currentAgreement.total_value,
      new_total_value: newTotalValue,
      previous_installments: currentAgreement.installments,
      new_installments: newInstallments,
      reason: parsedData.renegotiation_reason,
      discount_applied: parsedData.discount_applied,
      additional_fees: parsedData.additional_fees,
      renegotiated_at: new Date().toISOString()
    });
  
  // Recriar parcelas
  await recreateAgreementInstallments(parseInt(id), updatedAgreement);
  
  return updatedAgreement;
}

/**
 * Registra o pagamento de uma parcela
 */
export async function recordInstallmentPayment(installmentId: number, paymentData: {
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  late_fee_paid?: number;
  interest_paid?: number;
}) {
  const supabase = createAdminClient();
  
  // Atualizar status da parcela
  const { error: installmentError } = await supabase
    .from("agreement_installments")
    .update({
      status: 'paid',
      paid_date: paymentData.payment_date,
      amount_paid: paymentData.amount_paid,
      late_fee_paid: paymentData.late_fee_paid || 0,
      interest_paid: paymentData.interest_paid || 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", installmentId);
    
  if (installmentError) {
    throw new Error(`Erro ao registrar pagamento: ${installmentError.message}`);
  }
  
  // Registrar no histórico de pagamentos
  await supabase
    .from("payment_history")
    .insert({
      installment_id: installmentId,
      amount: paymentData.amount_paid,
      payment_date: paymentData.payment_date,
      payment_method: paymentData.payment_method,
      reference: paymentData.payment_reference,
      late_fee: paymentData.late_fee_paid || 0,
      interest: paymentData.interest_paid || 0,
      created_at: new Date().toISOString()
    });
    
  // Verificar se o acordo foi completado
  await checkAgreementCompletion(installmentId);
}

/**
 * Verifica se um acordo foi completado (todas as parcelas pagas)
 */
async function checkAgreementCompletion(installmentId: number) {
  const supabase = createAdminClient();
  
  // Buscar acordo da parcela
  const { data: installment } = await supabase
    .from("agreement_installments")
    .select("agreement_id")
    .eq("id", installmentId)
    .single();
    
  if (!installment) return;
  
  // Verificar se todas as parcelas foram pagas
  const { data: pendingInstallments } = await supabase
    .from("agreement_installments")
    .select("id")
    .eq("agreement_id", installment.agreement_id)
    .eq("status", "pending");
    
  if (!pendingInstallments || pendingInstallments.length === 0) {
    // Marcar acordo como completado
    await supabase
      .from("financial_agreements")
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq("id", installment.agreement_id);
  }
}

/**
 * Busca relatórios financeiros
 */
export async function getFinancialReports(startDate: string, endDate: string) {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .rpc('generate_financial_report', {
      start_date: startDate,
      end_date: endDate
    });
    
  if (error) {
    console.error("Erro ao gerar relatório financeiro:", error);
    throw new Error("Não foi possível gerar o relatório financeiro.");
  }
  
  return data;
}