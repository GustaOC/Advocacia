// lib/api-client.ts - MÉTODOS FINANCEIROS EXPANDIDOS (ADICIONAR AO ARQUIVO EXISTENTE)

export class ApiClient {
  // ... métodos existentes ...

  // =================================================================
  // MÓDULO FINANCEIRO EXPANDIDO - NOVOS MÉTODOS
  // =================================================================

  /**
   * Busca parcelas de um acordo financeiro específico
   */
  async getAgreementInstallments(agreementId: string): Promise<Array<{
    id: number;
    agreement_id: number;
    installment_number: number;
    due_date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    paid_date?: string;
    amount_paid?: number;
    late_fee_paid?: number;
    interest_paid?: number;
    payment_method?: string;
    payment_reference?: string;
    created_at: string;
    updated_at?: string;
  }>> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}/installments`);
  }

  /**
   * Busca histórico de pagamentos de um acordo
   */
  async getAgreementPaymentHistory(agreementId: string): Promise<Array<{
    id: number;
    installment_id: number;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference?: string;
    late_fee: number;
    interest: number;
    notes?: string;
    created_at: string;
  }>> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}/payments`);
  }

  /**
   * Registra o pagamento de uma parcela
   */
  async recordInstallmentPayment(agreementId: string, paymentData: {
    installmentId: number;
    amount_paid: number;
    payment_date: string;
    payment_method: string;
    payment_reference?: string;
    late_fee_paid?: number;
    interest_paid?: number;
    notes?: string;
  }): Promise<void> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  /**
   * Renegocia um acordo financeiro
   */
  async renegotiateFinancialAgreement(agreementId: string, renegotiationData: {
    new_total_value?: number;
    new_installments?: number;
    new_first_due_date: string;
    new_entry_value?: number;
    renegotiation_reason: string;
    discount_applied?: number;
    additional_fees?: number;
  }): Promise<FinancialAgreement> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}/renegotiate`, {
      method: 'POST',
      body: JSON.stringify(renegotiationData)
    });
  }

  /**
   * Cancela um acordo financeiro
   */
  async cancelFinancialAgreement(agreementId: string, reason?: string): Promise<void> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}`, {
      method: 'DELETE',
      body: JSON.stringify({ cancellation_reason: reason })
    });
  }

  /**
   * Busca acordos com parcelas em atraso
   */
  async getOverdueAgreements(daysOverdue: number = 0): Promise<Array<FinancialAgreement & {
    overdue_days: number;
    overdue_amount: number;
    overdue_installments: number;
  }>> {
    return this.authenticatedRequest(`/api/financial-agreements/overdue?days=${daysOverdue}`);
  }

  /**
   * Envia lembretes para acordos em atraso
   */
  async sendOverdueReminders(agreementIds: number[], messageTemplate?: string, sendMethod: 'email' | 'sms' | 'whatsapp' = 'email'): Promise<{
    sent: number;
    failed: number;
    details: Array<{ agreementId: number; status: 'sent' | 'failed'; error?: string }>;
  }> {
    return this.authenticatedRequest('/api/financial-agreements/overdue', {
      method: 'POST',
      body: JSON.stringify({
        agreementIds,
        messageTemplate,
        sendMethod
      })
    });
  }

  /**
   * Gera relatórios financeiros
   */
  async getFinancialReports(startDate: string, endDate: string, reportType: 'general' | 'agreements' | 'payments' | 'overdue' = 'general'): Promise<{
    summary: {
      total_agreements: number;
      total_value: number;
      paid_amount: number;
      overdue_amount: number;
      completion_rate: number;
    };
    agreements_by_status: Array<{
      status: string;
      count: number;
      total_value: number;
    }>;
    monthly_payments: Array<{
      month: string;
      payments_count: number;
      total_paid: number;
    }>;
    overdue_analysis: {
      overdue_count: number;
      total_overdue_value: number;
      average_days_overdue: number;
    };
    client_performance: Array<{
      client_name: string;
      agreements_count: number;
      total_value: number;
      payment_rate: number;
    }>;
  }> {
    return this.authenticatedRequest(`/api/financial-agreements/reports?startDate=${startDate}&endDate=${endDate}&type=${reportType}`);
  }

  /**
   * Busca estatísticas do dashboard financeiro
   */
  async getFinancialDashboardStats(): Promise<{
    total_agreements: number;
    active_agreements: number;
    completed_agreements: number;
    total_value: number;
    paid_amount: number;
    overdue_amount: number;
    this_month_payments: number;
    pending_installments: number;
    success_rate: number;
    average_agreement_value: number;
    top_clients: Array<{
      name: string;
      agreements_count: number;
      total_value: number;
    }>;
    monthly_trend: Array<{
      month: string;
      agreements_created: number;
      total_payments: number;
    }>;
  }> {
    return this.authenticatedRequest('/api/financial-agreements/dashboard/stats');
  }

  /**
   * Busca próximos vencimentos
   */
  async getUpcomingDueDates(days: number = 7): Promise<Array<{
    agreement_id: number;
    installment_id: number;
    client_name: string;
    case_number: string;
    due_date: string;
    amount: number;
    days_until_due: number;
    client_contact: {
      email?: string;
      phone?: string;
    };
  }>> {
    return this.authenticatedRequest(`/api/financial-agreements/upcoming-dues?days=${days}`);
  }

  /**
   * Calcula simulação de acordo
   */
  async simulateAgreement(simulationData: {
    total_value: number;
    entry_value?: number;
    installments: number;
    interest_rate?: number;
    discount_percent?: number;
  }): Promise<{
    final_total: number;
    installment_value: number;
    total_interest: number;
    discount_amount: number;
    payment_schedule: Array<{
      installment_number: number;
      due_date: string;
      amount: number;
    }>;
  }> {
    return this.authenticatedRequest('/api/financial-agreements/simulate', {
      method: 'POST',
      body: JSON.stringify(simulationData)
    });
  }

  /**
   * Exporta acordos para Excel/CSV
   */
  async exportFinancialAgreements(format: 'excel' | 'csv' = 'excel', filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    clientIds?: number[];
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    searchParams.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(item => searchParams.append(`${key}[]`, String(item)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
    }

    const response = await fetch(`/api/financial-agreements/export?${searchParams.toString()}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro ao exportar dados');
    }

    return response.blob();
  }

  /**
   * Busca histórico de renegociações de um acordo
   */
  async getAgreementRenegotiationHistory(agreementId: string): Promise<Array<{
    id: number;
    agreement_id: number;
    previous_total_value: number;
    new_total_value: number;
    previous_installments: number;
    new_installments: number;
    reason: string;
    discount_applied: number;
    additional_fees: number;
    renegotiated_by: string;
    renegotiated_at: string;
  }>> {
    return this.authenticatedRequest(`/api/financial-agreements/${agreementId}/renegotiation-history`);
  }

  /**
   * Busca alvarás judiciais relacionados aos acordos
   */
  async getCourtReleases(): Promise<Array<{
    id: number;
    agreement_id: number;
    case_number: string;
    client_name: string;
    expected_value: number;
    release_date?: string;
    received_date?: string;
    received: boolean;
    court_name: string;
    notes?: string;
  }>> {
    return this.authenticatedRequest('/api/court-releases');
  }

  /**
   * Marca alvará como recebido
   */
  async markCourtReleaseAsReceived(releaseId: number, receivedData: {
    received_date: string;
    actual_value: number;
    notes?: string;
  }): Promise<void> {
    return this.authenticatedRequest(`/api/court-releases/${releaseId}/receive`, {
      method: 'POST',
      body: JSON.stringify(receivedData)
    });
  }

  /**
   * Busca métricas de performance financeira
   */
  async getFinancialPerformanceMetrics(period: '30d' | '90d' | '6m' | '1y' = '30d'): Promise<{
    payment_rate: number;
    default_rate: number;
    average_payment_time: number;
    renegotiation_rate: number;
    collection_efficiency: number;
    monthly_recovery_trend: Array<{
      month: string;
      recovered_amount: number;
      recovery_rate: number;
    }>;
    client_risk_analysis: Array<{
      client_name: string;
      risk_score: number;
      payment_behavior: 'excellent' | 'good' | 'fair' | 'poor';
      recommendations: string[];
    }>;
  }> {
    return this.authenticatedRequest(`/api/financial-agreements/performance?period=${period}`);
  }

  /**
   * Criar lembrete automático para vencimento
   */
  async createPaymentReminder(reminderData: {
    agreement_id: number;
    reminder_type: 'email' | 'sms' | 'whatsapp';
    days_before_due: number;
    message_template?: string;
    recurring: boolean;
  }): Promise<{
    id: number;
    scheduled_date: string;
  }> {
    return this.authenticatedRequest('/api/payment-reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData)
    });
  }

  /**
   * Buscar lembretes de pagamento
   */
  async getPaymentReminders(agreementId?: string): Promise<Array<{
    id: number;
    agreement_id: number;
    client_name: string;
    reminder_type: string;
    scheduled_date: string;
    sent_date?: string;
    status: 'pending' | 'sent' | 'failed';
    message_preview: string;
  }>> {
    const url = agreementId 
      ? `/api/payment-reminders?agreementId=${agreementId}`
      : '/api/payment-reminders';
    return this.authenticatedRequest(url);
  }

  /**
   * Validar dados bancários para pagamento
   */
  async validateBankAccount(bankData: {
    bank_code: string;
    agency: string;
    account: string;
    account_type: 'checking' | 'savings';
    holder_document: string;
  }): Promise<{
    valid: boolean;
    holder_name?: string;
    bank_name: string;
    errors?: string[];
  }> {
    return this.authenticatedRequest('/api/financial-agreements/validate-bank-account', {
      method: 'POST',
      body: JSON.stringify(bankData)
    });
  }

  /**
   * Gerar boleto para parcela
   */
  async generateBoleto(installmentId: number, boletoData?: {
    due_date?: string;
    discount_amount?: number;
    fine_percentage?: number;
    interest_percentage?: number;
    instructions?: string;
  }): Promise<{
    boleto_url: string;
    barcode: string;
    digitable_line: string;
    due_date: string;
    amount: number;
  }> {
    return this.authenticatedRequest(`/api/installments/${installmentId}/boleto`, {
      method: 'POST',
      body: JSON.stringify(boletoData || {})
    });
  }

  /**
   * Buscar receita total por período
   */
  async getTotalRevenue(startDate: string, endDate: string, breakdown?: 'daily' | 'weekly' | 'monthly'): Promise<{
    total_revenue: number;
    period_comparison: {
      current_period: number;
      previous_period: number;
      growth_percentage: number;
    };
    breakdown?: Array<{
      period: string;
      revenue: number;
      agreements_count: number;
    }>;
    revenue_sources: {
      agreements: number;
      late_fees: number;
      interest: number;
      court_releases: number;
    };
  }> {
    const params = new URLSearchParams({
      startDate,
      endDate,
      ...(breakdown && { breakdown })
    });
    return this.authenticatedRequest(`/api/financial-agreements/revenue?${params.toString()}`);
  }
}

// =================================================================
// INTERFACES ADICIONAIS PARA OS NOVOS MÉTODOS
// =================================================================

export interface PaymentReminder {
  id: number;
  agreement_id: number;
  reminder_type: 'email' | 'sms' | 'whatsapp';
  days_before_due: number;
  message_template?: string;
  recurring: boolean;
  scheduled_date: string;
  sent_date?: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface CourtRelease {
  id: number;
  agreement_id: number;
  case_number: string;
  client_name: string;
  expected_value: number;
  release_date?: string;
  received_date?: string;
  received: boolean;
  court_name: string;
  notes?: string;
}

export interface InstallmentPayment {
  id: number;
  installment_id: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference?: string;
  late_fee: number;
  interest: number;
  notes?: string;
  created_at: string;
}

export interface FinancialMetrics {
  payment_rate: number;
  default_rate: number;
  average_payment_time: number;
  renegotiation_rate: number;
  collection_efficiency: number;
}

export interface ClientRiskAnalysis {
  client_name: string;
  risk_score: number;
  payment_behavior: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}