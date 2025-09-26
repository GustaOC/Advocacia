// lib/services/financialService.ts - VERSÃO COMPLETA E OTIMIZADA
import { createAdminClient } from "@/lib/supabase/server";
import { EnhancedAgreementSchema, EnhancedAgreementUpdateSchema, RenegotiationSchema, PaymentSchema } from "@/lib/schemas";
import { z } from "zod";

/**
 * Calcula dados dinâmicos de um acordo (parcelas pagas, em atraso, etc.)
 * a partir dos dados já buscados, sem fazer novas consultas ao banco.
 * @param agreement - O objeto do acordo, já contendo suas parcelas.
 */
function calculateAgreementMetrics(agreement: any) {
  const installments = agreement.agreement_installments || [];
  const now = new Date();
  
  const paidInstallments = installments.filter((i: any) => i.status === 'PAID');
  const partiallyPaidInstallments = installments.filter((i: any) => i.status === 'PARTIALLY_PAID');
  const overdueInstallments = installments.filter((i: any) => i.status === 'PENDING' && new Date(i.due_date) < now);

  const totalPaidAmount = installments.reduce((sum: number, i: any) => sum + (i.paid_value || 0), 0);
  const overdueAmount = overdueInstallments.reduce((sum: number, i: any) => sum + i.value, 0);

  const nextInstallment = installments
    .filter((i: any) => ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'].includes(i.status))
    .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];
    
  const nextDueDate = nextInstallment ? nextInstallment.due_date : null;
  
  const daysOverdue = nextDueDate && new Date(nextDueDate) < now 
    ? Math.floor((now.getTime() - new Date(nextDueDate).getTime()) / (1000 * 3600 * 24))
    : 0;

  const completionPercentage = agreement.total_value > 0 
    ? Math.min(100, Math.round((totalPaidAmount / agreement.total_value) * 100))
    : 0;

  const remainingBalance = agreement.total_value - totalPaidAmount;

  return {
    paid_installments: paidInstallments.length,
    partially_paid_installments: partiallyPaidInstallments.length,
    overdue_installments: overdueInstallments.length,
    next_due_date: nextDueDate,
    remaining_balance: remainingBalance,
    paid_amount: totalPaidAmount,
    overdue_amount: overdueAmount,
    days_overdue: daysOverdue,
    completion_percentage: completionPercentage,
  };
}

/**
 * Busca todos os acordos financeiros com informações expandidas.
 * Otimizado para fazer uma única consulta principal.
 */
export async function getFinancialAgreements() {
  const supabase = createAdminClient();
  
  const { data: agreements, error } = await supabase
    .from("financial_agreements")
    .select(`
      *,
      cases (id, case_number, title),
      client_entities:entities!client_entity_id (id, name),
      executed_entities:entities!executed_entity_id (id, name),
      agreement_installments (id, installment_number, due_date, value, status, paid_value, payment_date)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar acordos financeiros:", error);
    throw new Error("Não foi possível buscar os acordos financeiros.");
  }

  // Calcula métricas para cada acordo sem novas chamadas ao DB
  return (agreements || []).map(agreement => ({
    ...agreement,
    ...calculateAgreementMetrics(agreement),
  }));
}

/**
 * Busca um acordo financeiro específico pelo ID com detalhes completos.
 */
export async function getFinancialAgreementById(id: string) {
    const supabase = createAdminClient();
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) throw new Error("ID do acordo inválido.");

    const { data: agreement, error } = await supabase
        .from("financial_agreements")
        .select(`
            *,
            cases (*),
            client_entities:entities!client_entity_id (*),
            executed_entities:entities!executed_entity_id (*),
            guarantor_entities:entities!guarantor_entity_id (*),
            agreement_installments (*)
        `)
        .eq("id", numericId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Retorna nulo se não encontrar, erro padrão do Supabase
        console.error(`Erro ao buscar acordo ${id}:`, error);
        throw new Error("Não foi possível buscar o acordo.");
    }

    return {
        ...agreement,
        ...calculateAgreementMetrics(agreement),
    };
}


/**
 * Cria um novo acordo financeiro e suas parcelas.
 */
export async function createFinancialAgreement(agreementData: unknown) {
  // 1. Validação dos dados com o Zod schema
  const parsedData = EnhancedAgreementSchema.parse(agreementData);
  const supabase = createAdminClient();

  // 2. Insere o acordo no banco de dados
  const { data: agreement, error } = await supabase
    .from("financial_agreements")
    .insert(parsedData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar acordo financeiro:", error);
    throw new Error(`Erro ao criar acordo: ${error.message}`);
  }

  // 3. Cria as parcelas automaticamente com base nos dados do acordo
  await createAgreementInstallments(agreement.id, agreement);
  return agreement;
}

/**
 * Gera e salva as parcelas de um acordo no banco.
 */
async function createAgreementInstallments(agreementId: number, agreement: z.infer<typeof EnhancedAgreementSchema>) {
  const supabase = createAdminClient();
  const installmentsToCreate = [];
  const firstDueDate = new Date(agreement.first_due_date);

  for (let i = 0; i < agreement.installments; i++) {
    const dueDate = new Date(firstDueDate);
    // Adiciona o fuso horário local para evitar problemas de "off-by-one day"
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
    
    switch (agreement.installment_interval) {
      case 'monthly': dueDate.setMonth(dueDate.getMonth() + i); break;
      case 'biweekly': dueDate.setDate(dueDate.getDate() + (i * 14)); break;
      case 'weekly': dueDate.setDate(dueDate.getDate() + (i * 7)); break;
      // 'custom' e default caem aqui, tratando como mensal por padrão
      default: dueDate.setMonth(dueDate.getMonth() + i);
    }
    
    installmentsToCreate.push({
      agreement_id: agreementId,
      installment_number: i + 1,
      due_date: dueDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      value: agreement.installment_value,
      status: 'PENDING'
    });
  }

  const { error } = await supabase.from("agreement_installments").insert(installmentsToCreate);
  if (error) {
    console.error("Erro crítico ao criar parcelas. Revertendo acordo:", error);
    // Transação de reversão: se as parcelas falharem, o acordo é removido.
    await supabase.from("financial_agreements").delete().eq("id", agreementId);
    throw new Error("Falha ao gerar parcelas. O acordo foi desfeito para garantir a consistência dos dados.");
  }
}

/**
 * Atualiza um acordo financeiro.
 */
export async function updateFinancialAgreement(id: string, agreementData: unknown) {
  const parsedData = EnhancedAgreementUpdateSchema.parse(agreementData);
  const supabase = createAdminClient();
  const numericId = parseInt(id, 10);

  const { data: updatedAgreement, error } = await supabase
    .from("financial_agreements")
    .update({ ...parsedData, updated_at: new Date().toISOString() })
    .eq("id", numericId)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar acordo ${id}:`, error);
    throw new Error(`Erro ao atualizar acordo: ${error.message}`);
  }
  
  return updatedAgreement;
}

/**
 * Registra um pagamento para uma parcela específica.
 */
export async function registerPayment(paymentData: unknown) {
    const parsedData = PaymentSchema.parse(paymentData);
    const supabase = createAdminClient();

    // 1. Busca a parcela para verificar o estado atual
    const { data: installment, error: fetchError } = await supabase
        .from("agreement_installments")
        .select("id, value, paid_value, status")
        .eq("id", parsedData.installment_id)
        .single();

    if (fetchError || !installment) {
        throw new Error("Parcela não encontrada.");
    }

    if (installment.status === 'PAID') {
        throw new Error("Esta parcela já foi quitada.");
    }
    
    const newPaidValue = (installment.paid_value || 0) + parsedData.paid_amount;
    const remainingValue = installment.value - newPaidValue;
    
    // 2. Determina o novo status da parcela
    const newStatus = remainingValue <= 0.01 ? 'PAID' : 'PARTIALLY_PAID'; // Tolerância para arredondamento

    // 3. Atualiza a parcela
    const { error: updateError } = await supabase
        .from("agreement_installments")
        .update({
            paid_value: newPaidValue,
            status: newStatus,
            payment_date: parsedData.payment_date,
        })
        .eq("id", parsedData.installment_id);

    if (updateError) {
        throw new Error("Erro ao registrar o pagamento na parcela.");
    }

    // 4. Verifica se todas as parcelas do acordo foram pagas
    const { data: pendingInstallments, error: pendingError } = await supabase
        .from("agreement_installments")
        .select("id")
        .eq("agreement_id", parsedData.agreement_id)
        .in("status", ['PENDING', 'PARTIALLY_PAID', 'OVERDUE']);

    if (pendingError) {
        console.error("Erro ao verificar status do acordo:", pendingError);
        // O pagamento foi registrado, mas a verificação falhou. Não lançar erro.
        return { message: "Pagamento registrado com sucesso." };
    }
    
    // 5. Se não houver mais parcelas pendentes, atualiza o acordo para 'COMPLETED'
    if (pendingInstallments.length === 0) {
        await supabase
            .from("financial_agreements")
            .update({ status: 'completed' })
            .eq("id", parsedData.agreement_id);
    }
    
    return { message: "Pagamento registrado com sucesso." };
}

/**
 * Renegocia um acordo financeiro.
 */
export async function renegotiateAgreement(agreementId: string, renegotiationData: unknown) {
    const parsedData = RenegotiationSchema.parse(renegotiationData);
    const supabase = createAdminClient();
    const numericId = parseInt(agreementId, 10);

    // 1. Busca o acordo original
    const { data: originalAgreement, error: fetchError } = await supabase
        .from("financial_agreements")
        .select("*, agreement_installments(*)")
        .eq("id", numericId)
        .single();

    if (fetchError || !originalAgreement) {
        throw new Error("Acordo original não encontrado para renegociação.");
    }

    // 2. Cancela todas as parcelas pendentes do acordo antigo
    const pendingInstallmentIds = originalAgreement.agreement_installments
        .filter((i: any) => i.status !== 'PAID')
        .map((i: any) => i.id);

    if (pendingInstallmentIds.length > 0) {
        await supabase
            .from("agreement_installments")
            .update({ status: 'CANCELLED' })
            .in('id', pendingInstallmentIds);
    }

    // 3. Atualiza o acordo principal com os novos dados e incrementa o contador
    const updatedAgreementData = {
        total_value: parsedData.new_total_value || originalAgreement.total_value,
        installments: parsedData.new_installments || originalAgreement.installments,
        first_due_date: parsedData.new_first_due_date,
        entry_value: parsedData.new_entry_value || 0,
        // Calcula o novo valor da parcela
        installment_value: ( (parsedData.new_total_value || originalAgreement.total_value) - (parsedData.new_entry_value || 0) ) / (parsedData.new_installments || originalAgreement.installments),
        status: 'renegotiated', // ou 'active' se preferir
        renegotiation_count: (originalAgreement.renegotiation_count || 0) + 1,
        updated_at: new Date().toISOString(),
    };

    const { data: renegotiatedAgreement, error: updateError } = await supabase
        .from("financial_agreements")
        .update(updatedAgreementData)
        .eq("id", numericId)
        .select()
        .single();

    if (updateError || !renegotiatedAgreement) {
        throw new Error("Falha ao atualizar o acordo durante a renegociação.");
    }
    
    // 4. Cria as novas parcelas para o acordo renegociado
    await createAgreementInstallments(numericId, renegotiatedAgreement as any);

    return renegotiatedAgreement;
}

/**
 * Deleta um acordo financeiro e todas as suas parcelas.
 * Use com cuidado extremo.
 */
export async function deleteFinancialAgreement(id: string) {
    const supabase = createAdminClient();
    const numericId = parseInt(id, 10);

    // Deleta primeiro as parcelas associadas (devido à foreign key constraint)
    await supabase.from("agreement_installments").delete().eq("agreement_id", numericId);
    
    const { error } = await supabase.from("financial_agreements").delete().eq("id", numericId);

    if (error) {
        console.error(`Erro ao deletar acordo ${id}:`, error);
        throw new Error("Não foi possível deletar o acordo.");
    }
    return { message: "Acordo deletado com sucesso." };
}