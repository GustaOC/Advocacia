// lib/api-client.ts - VERSÃO COMPLETA E CORRIGIDA

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
    court: string | null;
    created_at: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    description?: string | null;
    case_parties: { role: string; entities: { id: number; name: string; } }[];
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
  total_value: number;
  status: string;
  start_date: string;
  updated_at: string;
  created_at: string;
  installments: number;
  installment_value: number | null;
  entry_value: number;
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
  entities: AgreementEntity;
  client_entities: AgreementEntity;
  executed_entities: AgreementEntity;
  guarantor_entities: AgreementEntity;
  cases: { case_number: string | null; title: string; court: string; status: string };
}

// ============================================================================
// INSTÂNCIA DO AXIOS
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

class ApiClient {
  // Entidades
  async getEntities(): Promise<Entity[]> {
    return instance.get('/entities');
  }
  async createEntity(data: Partial<Entity>): Promise<Entity> {
    return instance.post('/entities', data);
  }
  async updateEntity(id: string, data: Partial<Entity>): Promise<Entity> {
    return instance.put(`/entities/${id}`, data);
  }
  async deleteEntity(id: string): Promise<{ message: string }> {
    return instance.delete(`/entities/${id}`);
  }

  // Casos
  async getCases(): Promise<{ cases: Case[]; total: number }> {
    return instance.get('/cases');
  }
  async createCase(data: Partial<Case>): Promise<Case> {
    return instance.post('/cases', data);
  }
  async updateCase(id: string, data: Partial<Case>): Promise<Case> {
    return instance.put(`/cases/${id}`, data);
  }

  // Funcionários e Permissões
  async getEmployees(): Promise<any[]> {
    return instance.get('/employees');
  }
  async getRoles(): Promise<any[]> {
    return instance.get('/roles');
  }
  async getPermissions(): Promise<any[]> {
    return instance.get('/permissions');
  }

  // Petições
  async getPetitions(): Promise<any[]> {
    return instance.get('/petitions');
  }
  // ✅ FUNÇÃO ADICIONADA
  async createPetition(data: Partial<any>): Promise<any> {
    return instance.post('/petitions', data);
  }
  // ✅ FUNÇÃO ADICIONADA
  async updatePetition(id: string, data: Partial<any>): Promise<any> {
    return instance.put(`/petitions/${id}`, data);
  }

  // Modelos
  async getTemplates(): Promise<any[]> {
    return instance.get('/document-templates');
  }
  async createTemplate(data: Partial<any>): Promise<any> {
    return instance.post('/document-templates', data);
  }
  async updateTemplate(id: number, data: Partial<any>): Promise<any> {
    return instance.put(`/document-templates/${id}`, data);
  }
  async deleteTemplate(id: number): Promise<{ message: string }> {
    return instance.delete(`/document-templates/${id}`);
  }

  // ============================================================================
  // MÉTODOS FINANCEIROS MELHORADOS
  // ============================================================================

  async getFinancialAgreements(
    page?: number, 
    pageSize?: number, 
    filters?: FinancialAgreementFilters
  ): Promise<FinancialAgreement[]> {
    const params: any = {};
    
    if (page !== undefined) params.page = page;
    if (pageSize !== undefined) params.pageSize = pageSize;
    if (filters?.status) params.status = filters.status;
    if (filters?.agreementType) params.agreementType = filters.agreementType;
    if (filters?.clientId) params.clientId = filters.clientId;
    if (filters?.startDate) params.startDate = filters.startDate;
    if (filters?.endDate) params.endDate = filters.endDate;
    if (filters?.search) params.search = filters.search;

    return instance.get('/financial-agreements', { params });
  }

  async getFinancialAgreementsPaginated(
    page: number = 1, 
    pageSize: number = 10, 
    filters?: FinancialAgreementFilters
  ): Promise<PaginatedResponse<FinancialAgreement>> {
    const params = { page, pageSize, ...filters };
    return instance.get('/financial-agreements/paginated', { params });
  }

  async getFinancialStats(): Promise<FinancialStats> {
    return instance.get('/financial-agreements/stats');
  }

  async getOverdueAgreements(): Promise<FinancialAgreement[]> {
    return instance.get('/financial-agreements/overdue');
  }

  async createFinancialAgreement(data: Partial<FinancialAgreement>): Promise<FinancialAgreement> {
    return instance.post('/financial-agreements', data);
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
    startDate: string, 
    endDate: string, 
    reportType: string
  ): Promise<any> {
    return instance.get('/financial-reports', { 
      params: { startDate, endDate, reportType } 
    });
  }

  async exportFinancialAgreements(
    format: 'excel' | 'csv', 
    filters: FinancialAgreementFilters
  ): Promise<Blob> {
    const response = await instance.get(`/financial-agreements/export/${format}`, {
      params: filters,
      responseType: 'blob',
    });
    return response as unknown as Blob;
  }

  async getAgreementInstallments(agreementId: string): Promise<any[]> {
    return instance.get(`/financial-agreements/${agreementId}/installments`);
  }

  async getAgreementPaymentHistory(agreementId: string): Promise<any[]> {
    return instance.get(`/financial-agreements/${agreementId}/payments`);
  }

  async recordInstallmentPayment(
    agreementId: string, 
    paymentData: {
      installmentId: string;
      amount: number;
      paymentDate: string;
      paymentMethod: string;
      reference?: string;
      notes?: string;
    }
  ): Promise<any> {
    return instance.post(`/financial-agreements/${agreementId}/payments`, paymentData);
  }

  async renegotiateFinancialAgreement(
    agreementId: string, 
    data: {
      newTotalAmount: number;
      newInstallments: number;
      newStartDate: string;
      reason: string;
      notes?: string;
    }
  ): Promise<FinancialAgreement> {
    return instance.post(`/financial-agreements/${agreementId}/renegotiate`, data);
  }

  // ============================================================================
  // MÉTODOS DE AUTENTICAÇÃO
  // ============================================================================

  async getCurrentUser(): Promise<any> {
    return instance.get('/auth/me');
  }

  async logout(): Promise<void> {
    await instance.post('/auth/logout');
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  async setPassword(data: { code: string; password: string }): Promise<void> {
    return instance.post('/auth/set-password', data);
  }

  // ============================================================================
  // MÉTODOS DE NOTIFICAÇÕES
  // ============================================================================

  async getNotifications(userId: string): Promise<{ notifications: any[] }> {
    return instance.get(`/notifications?user_id=${userId}`);
  }

  async getUnreadNotificationCount(userId: string): Promise<{ count: number }> {
    return instance.get(`/notifications/count?user_id=${userId}`);
  }

  // ============================================================================
  // MÉTODOS UTILITÁRIOS
  // ============================================================================

  validateFinancialAgreement(data: Partial<FinancialAgreement>): string[] {
    const errors: string[] = [];
    
    if (!data.total_value || data.total_value <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }
    
    if (!data.installments || data.installments < 1) {
      errors.push('Número de parcelas deve ser pelo menos 1');
    }
    
    if (!data.agreement_type) {
      errors.push('Tipo de acordo é obrigatório');
    }
    
    if (!data.payment_method) {
      errors.push('Método de pagamento é obrigatório');
    }
    
    return errors;
  }

  calculateAgreementInfo(data: {
    totalValue: number;
    entryValue: number;
    installments: number;
  }) {
    const remainingValue = data.totalValue - data.entryValue;
    const installmentValue = data.installments > 0 ? remainingValue / data.installments : 0;
    
    return {
      remainingValue,
      installmentValue,
      entryPercentage: (data.entryValue / data.totalValue) * 100,
    };
  }
}

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

export const apiClient = new ApiClient();