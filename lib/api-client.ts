// lib/api-client.ts - VERSÃO CORRIGIDA COM O TIPO DE RETORNO CORRETO PARA getCases
// Este arquivo centraliza todas as chamadas de API do frontend para o backend.

// Tipos para os dados dos funcionários, para garantir a consistência
interface EmployeeData {
  name: string;
  email: string;
  role_id: number;
}

interface UpdateEmployeeData {
  name?: string;
  email?: string;
  role_id?: number;
}

// ✅ CORREÇÃO: Esta será a nossa definição central do tipo 'Case'.
// Adicionamos 'action_type' como um campo opcional para resolver o erro.
export interface Case {
  id: number;
  case_number: string | null;
  title: string;
  main_status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago';
  status_reason: string | null;
  value: number | null;
  court: string | null;
  created_at: string;
  priority: 'Alta' | 'Média' | 'Baixa';
  description?: string | null;
  case_parties: { role: string; entities: { id: number; name: string; } }[];
  client_entity_id?: number;
  executed_entity_id?: number;
  payment_date?: string | null;
  final_value?: number | null;
  action_type?: 'cobranca' | 'divorcio' | 'inventario' | 'outros'; // Campo adicionado
}


export class ApiClient {
  /**
   * Método genérico para realizar requisições autenticadas.
   */
  private async authenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    console.log(`[ApiClient] Chamando: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Erro na API: ${response.status} ${response.statusText}`;
      console.error(`[ApiClient] Falha na requisição para ${endpoint}:`, errorMessage);

      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session-expired';
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      return {} as T;
    }
  }

  // MÓDULO DE ENTIDADES (CLIENTES)
  async getEntities() { return this.authenticatedRequest<any[]>('/api/entities'); }
  async getEntity(id: string) { return this.authenticatedRequest(`/api/entities/${id}`); }
  async createEntity(entityData: any) { return this.authenticatedRequest('/api/entities', { method: 'POST', body: JSON.stringify(entityData) }); }
  async updateEntity(id: string, entityData: any) { return this.authenticatedRequest(`/api/entities/${id}`, { method: 'PUT', body: JSON.stringify(entityData) }); }
  async deleteEntity(id: string) { return this.authenticatedRequest(`/api/entities/${id}`, { method: 'DELETE' }); }

  // MÓDULO DE CASOS/PROCESSOS
  async getCases(): Promise<{ cases: Case[]; total: number }> {
    return this.authenticatedRequest<{ cases: Case[]; total: number }>('/api/cases');
  }
  async getCase(id: string): Promise<Case> { return this.authenticatedRequest(`/api/cases/${id}`); }
  async createCase(caseData: any): Promise<Case> { return this.authenticatedRequest('/api/cases', { method: 'POST', body: JSON.stringify(caseData) }); }
  async updateCase(id: string, caseData: any): Promise<Case> { return this.authenticatedRequest(`/api/cases/${id}`, { method: 'PUT', body: JSON.stringify(caseData) }); }
  async deleteCase(id: string) { return this.authenticatedRequest(`/api/cases/${id}`, { method: 'DELETE' }); }
  async archiveCaseDocuments(id: string) { return this.authenticatedRequest(`/api/cases/${id}/archive`, { method: 'PUT' }); }


  // MÓDULO FINANCEIRO
  async getFinancialAgreements() { return this.authenticatedRequest('/api/financial-agreements'); }
  async createFinancialAgreement(agreementData: any) { return this.authenticatedRequest('/api/financial-agreements', { method: 'POST', body: JSON.stringify(agreementData) }); }

  // MÓDULO DE FUNCIONÁRIOS (EMPLOYEES)
  async getEmployees() { return this.authenticatedRequest<any[]>('/api/employees'); }
  async createEmployee(employeeData: EmployeeData) { return this.authenticatedRequest('/api/employees', { method: 'POST', body: JSON.stringify(employeeData) }); }
  async updateEmployee(id: number, employeeData: UpdateEmployeeData) { return this.authenticatedRequest(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(employeeData) }); }
  async deleteEmployee(id: number) { return this.authenticatedRequest(`/api/employees/${id}`, { method: 'DELETE' }); }

  // MÓDULO DE AUTENTICAÇÃO E PERFIS
  async getCurrentUser() { return this.authenticatedRequest<any>('/api/auth/me'); }
  async logout() {
    try {
      await this.authenticatedRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("[ApiClient] Falha na API de logout, mas continuará o processo:", error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
  async setPassword(data: { code: string; password?: string; }) { return this.authenticatedRequest('/api/auth/set-password', { method: 'POST', body: JSON.stringify(data) }); }

  // MÓDULO DE PETIÇÕES (PETITIONS)
  async getPetitions() { return this.authenticatedRequest<any[]>('/api/petitions'); }

  // --- NOVO MÓDULO DE NOTIFICAÇÕES ---
  async getNotifications(userId: string) { return this.authenticatedRequest<{ notifications: any[] }>(`/api/notifications?user_id=${userId}`); }
  async getUnreadNotificationCount(userId: string) { return this.authenticatedRequest<{ count: number }>(`/api/notifications/count?user_id=${userId}`); }

  // MÓDULO DE CARGOS E PERMISSÕES (ROLES & PERMISSIONS)
  async getRoles() { return this.authenticatedRequest<any[]>('/api/roles'); }
  async getPermissions() { return this.authenticatedRequest<any[]>('/api/permissions'); }

  // MÓDULO DE TEMPLATES DE DOCUMENTOS
  async getTemplates() { return this.authenticatedRequest<any[]>('/api/document-templates'); }
  async getTemplate(id: number) { return this.authenticatedRequest(`/api/document-templates/${id}`); }
  async createTemplate(templateData: any) { return this.authenticatedRequest('/api/document-templates', { method: 'POST', body: JSON.stringify(templateData) }); }
  async updateTemplate(id: number, templateData: any) { return this.authenticatedRequest(`/api/document-templates/${id}`, { method: 'PUT', body: JSON.stringify(templateData) }); }
  async deleteTemplate(id: number) { return this.authenticatedRequest(`/api/document-templates/${id}`, { method: 'DELETE' }); }
  
  async generateDocument(templateId: number, caseId: number) {
    return this.authenticatedRequest<{ generatedContent: string, documentTitle: string }>('/api/document-templates/generate', {
      method: 'POST',
      body: JSON.stringify({ templateId, caseId }),
    });
  }
}

export const apiClient = new ApiClient();