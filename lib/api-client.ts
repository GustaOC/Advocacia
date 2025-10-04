// lib/api-client.ts - VERSÃO CORRIGIDA COM AS SUAS ESTRUTURAS ORIGINAIS

import axios, { AxiosResponse, AxiosError } from 'axios';

// ============================================================================
// TIPAGEM (Interfaces para os dados da API)
// ============================================================================

export interface Entity {
  id: string;
  name: string;
  document: string;
  type: string;
  email?: string | null;
  address?: string | null;
  address_number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  phone2?: string | null;
}

export interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago';
  value: number | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  description?: string | null;
  case_parties: { role: string; entities: { id: number; name: string } }[];
  action_type?: string;
}

interface AgreementEntity {
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
}

export interface FinancialAgreementFilters {
  status?: string;
  agreementType?: string;
  clientId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FinancialStats {
  totalAgreements: number;
  totalValue: number;
  paidAmount: number;
  overdueAmount: number;
  completionRate: number;
  averageAgreementValue: number;
}

export interface FinancialAgreement {
  id: number;
  total_amount: number | null;
  status: string;
  start_date: string;
  updated_at: string;
  created_at: string;
  number_of_installments: number;
  installment_value: number | null;
  down_payment: number;
  completion_percentage: number;
  paid_amount: number;
  remaining_balance: number;
  agreement_type: string;
  payment_method: string;
  next_due_date: string | null;
  days_overdue: number;
  bank_account_info?: string;
  notes?: string;
  has_court_release?: boolean;
  court_release_value?: number;
  renegotiation_count: number;
  paid_installments: number;
  entities: AgreementEntity | null;
  client_entities: AgreementEntity | null;
  executed_entities: AgreementEntity | null;
  guarantor_entities: AgreementEntity | null;
  cases: { case_number: string | null; title: string; status: string } | null;
  installments?: Installment[];
}

export interface Payment {
  id: string;
  installment_id: string;
  amount_paid: number;
  payment_date: string; // ISO
  payment_method?: string | null;
  notes?: string | null;
}

export interface Installment {
  id: string;
  agreement_id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'PENDENTE' | 'PAGA' | 'ATRASADA' | 'RENEGOCIADA' | 'CANCELADA';
  payments?: Payment[];
}

export interface MonthlyInstallment {
  id: number;
  due_date: string;
  amount: number;
  status: 'PENDENTE' | 'PAGA' | 'ATRASADA';
  agreement: {
    id: number;
    cases: {
      case_number: string | null;
      title: string;
      case_parties: { role: string; entities: { name: string } }[];
    } | null;
    debtor: {
      name: string;
    } | null;
  } | null;
}

// *** NOVA INTERFACE PARA A ABA "RECEBIDOS DO MÊS" ***
export interface ReceivedPayment {
  id: number;
  payment_date: string;
  amount_paid: number;
  payment_method: string | null;
  installment_number: number;
  client_name: string;
  case_number: string | null;
}


// ============================================================================
// INSTÂNCIA DO AXIOS (sem alterações)
// ============================================================================

const instance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    const errorMessage = (error.response?.data as { error?: string })?.error || error.message;
    return Promise.reject(new Error(errorMessage));
  }
);

// ============================================================================
// CLASSE ApiClient COM TODOS OS MÉTODOS
// ============================================================================

export class ApiClient {
  // Entidades
  async getEntities(): Promise<Entity[]> { return instance.get('/entities'); }
  async createEntity(data: Partial<Entity>): Promise<Entity> { return instance.post('/entities', data); }
  async updateEntity(id: string, data: Partial<Entity>): Promise<Entity> { return instance.put(`/entities/${id}`, data); }
  async deleteEntity(id: string): Promise<{ message: string }> { return instance.delete(`/entities/${id}`); }

  // Casos
  async getCases(): Promise<{ cases: Case[]; total: number }> { return instance.get('/cases'); }
  async createCase(data: Partial<Case>): Promise<Case> { return instance.post('/cases', data); }
  async updateCase(id: string, data: Partial<Case>): Promise<Case> { return instance.put(`/cases/${id}`, data); }

  // Funcionários e Permissões
  async getEmployees(): Promise<any[]> { return instance.get('/employees'); }
  async getRoles(): Promise<any[]> { return instance.get('/roles'); }
  async getPermissions(): Promise<any[]> { return instance.get('/permissions'); }

  // Petições
  async getPetitions(): Promise<any[]> { return instance.get('/petitions'); }
  async createPetition(data: Partial<any>): Promise<any> { return instance.post('/petitions', data); }
  async updatePetition(id: string, data: Partial<any>): Promise<any> { return instance.put(`/petitions/${id}`, data); }

  // Modelos
  async getTemplates(): Promise<any[]> { return instance.get('/document-templates'); }
  async createTemplate(data: Partial<any>): Promise<any> { return instance.post('/document-templates', data); }
  async updateTemplate(id: number, data: Partial<any>): Promise<any> { return instance.put(`/document-templates/${id}`, data); }
  async deleteTemplate(id: number): Promise<{ message: string }> { return instance.delete(`/document-templates/${id}`); }

  // Métodos Financeiros Melhorados
  async getFinancialAgreements(
    page?: number, pageSize?: number, filters?: FinancialAgreementFilters
  ): Promise<FinancialAgreement[]> {
    const params: any = {};
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (filters) Object.assign(params, filters);
    return instance.get('/financial-agreements', { params });
  }

  async getFinancialAgreementsPaginated(
    page: number = 1, pageSize: number = 10, filters?: FinancialAgreementFilters
  ): Promise<PaginatedResponse<FinancialAgreement>> {
    const params = { page, pageSize, ...filters };
    return instance.get('/financial-agreements/paginated', { params });
  }

  async getFinancialStats(): Promise<FinancialStats> { return instance.get('/financial-agreements/stats'); }
  async getOverdueAgreements(): Promise<FinancialAgreement[]> { return instance.get('/financial-agreements/overdue'); }

  async createFinancialAgreement(data: any): Promise<FinancialAgreement> {
    const payload: any = {
      case_id: String(data.case_id),
      debtor_id: String(data.client_entity_id), 
      creditor_id: String(data.creditor_id ?? data.client_entity_id),
      total_amount: Number(data.total_value ?? data.total_amount),
      down_payment: Number(data.entry_value ?? data.down_payment ?? 0),
      number_of_installments: Number(data.installments ?? data.number_of_installments ?? 1),
      start_date: data.start_date ?? new Date().toISOString(),
      end_date:
        data.end_date ??
        new Date(new Date().setMonth(new Date().getMonth() + Number(data.installments ?? 1))).toISOString(),
      status: data.status ?? 'ATIVO',
      agreement_type: data.agreement_type ?? 'SOMENTE_PARCELADO',
      notes: data.notes ?? null,
    };

    if (Array.isArray(data.installments_list)) {
      payload.installments = data.installments_list.map((it: any, idx: number) => ({
        installment_number: Number(it.installment_number ?? idx + 1),
        amount: Number(it.amount),
        due_date: it.due_date,
        status: it.status ?? 'PENDENTE',
      }));
    }

    return instance.post('/financial-agreements', payload);
  }

  async getFinancialAgreementDetails(id: string): Promise<FinancialAgreement | null> {
    return instance.get(`/financial-agreements/${id}`);
  }
  async updateFinancialAgreement(id: string, data: Partial<FinancialAgreement>): Promise<FinancialAgreement> {
    return instance.put(`/financial-agreements/${id}`, data);
  }
  async deleteFinancialAgreement(id: string): Promise<boolean> {
    return instance.delete(`/financial-agreements/${id}`);
  }

  async getFinancialReports(
    startDate: string, endDate: string, reportType: string
  ): Promise<any> {
    return instance.get('/financial-reports', { params: { startDate, endDate, reportType } });
  }

  async exportFinancialAgreements(
    format: 'excel' | 'csv', filters: FinancialAgreementFilters
  ): Promise<Blob> {
    const response = await instance.get(`/financial-agreements/export/${format}`, {
      params: filters,
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  async getAgreementInstallments(agreementId: number): Promise<Installment[]> {
    return instance.get(`/financial-agreements/${agreementId}/installments`);
  }

  async recordInstallmentPayment(
    installmentId: string,
    paymentData: { amount_paid: number; payment_date: string; payment_method: string; notes?: string }
  ): Promise<any> {
    return instance.post(`/installments/${installmentId}/pay`, paymentData);
  }

  async renegotiateFinancialAgreement(agreementId: string, data: any): Promise<FinancialAgreement> {
    return instance.post(`/financial-agreements/${agreementId}/renegotiate`, data);
  }

  async getInstallmentsByMonth(year: number, month: number): Promise<MonthlyInstallment[]> {
    return instance.get(`/installments/by-month`, { params: { year, month } });
  }

  // *** NOVO MÉTODO PARA A ABA "RECEBIDOS DO MÊS" ***
  async getReceivedByMonth(year: number, month: number): Promise<ReceivedPayment[]> {
    return instance.get('/payments/by-month', { params: { year, month } });
  }

  // Métodos de Autenticação
  async getCurrentUser(): Promise<any> { return instance.get('/auth/me'); }
  async logout(): Promise<void> {
    await instance.post('/auth/logout');
    if (typeof window !== 'undefined') window.location.href = '/login';
  }
  async setPassword(data: { code: string; password: string }): Promise<void> {
    return instance.post('/auth/set-password', data);
  }

  // Métodos de Notificações
  async getNotifications(userId: string): Promise<{ notifications: any[] }> {
    return instance.get(`/notifications?user_id=${userId}`);
  }
  async getUnreadNotificationCount(userId: string): Promise<{ count: number }> {
    return instance.get(`/notifications/count?user_id=${userId}`);
  }

  // Métodos Utilitários
  validateFinancialAgreement(data: Partial<FinancialAgreement>): string[] {
    const errors: string[] = [];
    if (!data.total_amount || data.total_amount <= 0) errors.push('Valor total deve ser maior que zero');
    if (!data.number_of_installments || data.number_of_installments < 1) errors.push('Número de parcelas deve ser pelo menos 1');
    if (!data.agreement_type) errors.push('Tipo de acordo é obrigatório');
    if (!data.payment_method) errors.push('Método de pagamento é obrigatório');
    return errors;
  }

  calculateAgreementInfo(data: { totalValue: number; entryValue: number; installments: number }) {
    const remainingValue = data.totalValue - data.entryValue;
    const installmentValue = data.installments > 0 ? remainingValue / data.installments : 0;
    return { remainingValue, installmentValue, entryPercentage: (data.entryValue / data.totalValue) * 100 };
    }
}

// ============================================================================
// EXPORTAÇÃO CORRIGIDA
// ============================================================================

export const apiClient = new ApiClient();