// lib/api-client.ts - VERSÃO CORRIGIDA E COMPLETA

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

export interface FinancialAgreement {
  id: number;
  total_value: number;
  status: string;
  start_date: string;
  updated_at: string;
  created_at: string;
  installments: number;
  installment_value: number;
  entry_value: number;
  completion_percentage: number;
  paid_amount: number;
  remaining_balance: number;
  agreement_type: string;
  payment_method: string;
  next_due_date: string;
  days_overdue: number;
  bank_account_info?: string;
  notes?: string;
  has_court_release?: boolean;
  court_release_value?: number;
  renegotiation_count: number;
  paid_installments: number;
  entities: { name: string; document: string };
  client_entities: { name: string; document: string };
  executed_entities: { name: string; document: string };
  guarantor_entities: { name: string; document: string };
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

  // Financeiro
  async getFinancialAgreements(): Promise<FinancialAgreement[]> {
      return instance.get('/financial-agreements');
  }
  async createFinancialAgreement(data: any): Promise<FinancialAgreement> {
      return instance.post('/financial-agreements', data);
  }
  
  // ✅ MÉTODOS FINANCEIROS ADICIONADOS PARA CORRIGIR OS ERROS
  async getFinancialAgreementDetails(id: string): Promise<FinancialAgreement | null> {
    return instance.get(`/financial-agreements/${id}`);
  }
  async updateFinancialAgreement(id: string, data: Partial<FinancialAgreement>): Promise<FinancialAgreement> {
    return instance.put(`/financial-agreements/${id}`, data);
  }
  async deleteFinancialAgreement(id: string): Promise<boolean> {
    return instance.delete(`/financial-agreements/${id}`);
  }
  
  // --> Outros métodos que você já tinha ou irá precisar
  async getFinancialReports(startDate: string, endDate: string, reportType: string): Promise<any> {
      return instance.get('/financial-reports', { params: { startDate, endDate, reportType } });
  }
  async exportFinancialAgreements(format: 'excel' | 'csv', filters: any): Promise<Blob> {
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
  async recordInstallmentPayment(agreementId: string, paymentData: any): Promise<any> {
      return instance.post(`/financial-agreements/${agreementId}/payments`, paymentData);
  }
  async renegotiateFinancialAgreement(agreementId: string, data: any): Promise<FinancialAgreement> {
      return instance.post(`/financial-agreements/${agreementId}/renegotiate`, data);
  }

  // Autenticação
  async getCurrentUser(): Promise<any> {
    return instance.get('/auth/me');
  }
  async logout(): Promise<void> {
    await instance.post('/auth/logout');
    window.location.href = '/login';
  }
  async setPassword(data: { code: string; password: string }): Promise<void> {
      return instance.post('/auth/set-password', data);
  }

  // Notificações
  async getNotifications(userId: string): Promise<{ notifications: any[] }> {
    return instance.get(`/notifications?user_id=${userId}`);
  }
  async getUnreadNotificationCount(userId: string): Promise<{ count: number }> {
    return instance.get(`/notifications/count?user_id=${userId}`);
  }
}

// ============================================================================
// EXPORTAÇÃO
// ============================================================================

export const apiClient = new ApiClient();