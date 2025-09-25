// lib/api-client.ts
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

// ✅ ADICIONADO: Interface para casos/processos
export interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago';
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
  action_type?: 'cobranca' | 'divorcio' | 'inventario' | 'outros';
  // 🆕 ADICIONADO CAMPOS DE ACORDO
  agreement_type?: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | 'Pela Loja' | null;
  agreement_value?: number | null;
  installments?: number | null;
  down_payment?: number | null;
  installment_due_date?: string | null;
}

// ✅ ADICIONADO: Interface completa para acordos financeiros
export interface FinancialAgreement {
  id: number;
  case_id: number;
  client_entity_id: number;
  agreement_type: string;
  total_value: number;
  entry_value: number;
  installments: number;
  status: 'active' | 'completed' | 'cancelled' | 'defaulted';
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  // Relacionamentos vindos do JOIN com outras tabelas:
  cases: {
    id: number;
    case_number: string | null;
    title: string;
  };
  entities: {
    id: number;
    name: string;
    document?: string | null;
  };
}

// ✅ ADICIONADO: Interface para entidades (clientes/executados)
export interface Entity {
  id: number;
  name: string;
  document?: string | null;
  email?: string | null;
  address?: string | null;
  address_number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  phone2?: string | null;
  type: string;
  created_at: string;
  updated_at?: string;
}

// ✅ ADICIONADO: Interface para funcionários
export interface Employee {
  id: number;
  name: string;
  email: string;
  role_id: number;
  created_at: string;
  updated_at?: string;
  // Relacionamentos:
  role?: {
    id: number;
    name: string;
    permissions?: string[];
  };
}

// ✅ ADICIONADO: Interface para usuário atual
export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

// ✅ ADICIONADO: Interface para notificações
export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// ✅ ADICIONADO: Interface para templates de documentos
export interface DocumentTemplate {
  id: number;
  name: string;
  content: string;
  variables: string[];
  created_at: string;
  updated_at?: string;
}

// ✅ ADICIONADO: Interface para petições
export interface Petition {
  id: number;
  case_id: number;
  title: string;
  description?: string | null;
  file_path: string;
  deadline?: string | null;
  status: 'pending' | 'under_review' | 'approved' | 'corrections_needed' | 'rejected';
  created_by_employee_id: string;
  assigned_to_employee_id: string;
  created_at: string;
  updated_at?: string;
}

// ✅ ADICIONADO: Interface para cargos
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at?: string;
}

// ✅ ADICIONADO: Interface para permissões
export interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
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

  // =================================================================
  // MÓDULO DE ENTIDADES (CLIENTES/EXECUTADOS) - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getEntities(): Promise<Entity[]> { 
    return this.authenticatedRequest<Entity[]>('/api/entities'); 
  }
  
  async getEntity(id: string): Promise<Entity> { 
    return this.authenticatedRequest<Entity>(`/api/entities/${id}`); 
  }
  
  async createEntity(entityData: Partial<Entity>): Promise<Entity> { 
    return this.authenticatedRequest<Entity>('/api/entities', { 
      method: 'POST', 
      body: JSON.stringify(entityData) 
    }); 
  }
  
  async updateEntity(id: string, entityData: Partial<Entity>): Promise<Entity> { 
    return this.authenticatedRequest<Entity>(`/api/entities/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(entityData) 
    }); 
  }
  
  async deleteEntity(id: string): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/entities/${id}`, { 
      method: 'DELETE' 
    }); 
  }

  // =================================================================
  // MÓDULO DE CASOS/PROCESSOS - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getCases(): Promise<{ cases: Case[]; total: number }> {
    return this.authenticatedRequest<{ cases: Case[]; total: number }>('/api/cases');
  }
  
  async getCase(id: string): Promise<Case> { 
    return this.authenticatedRequest<Case>(`/api/cases/${id}`); 
  }
  
  async createCase(caseData: Partial<Case>): Promise<Case> { 
    return this.authenticatedRequest<Case>('/api/cases', { 
      method: 'POST', 
      body: JSON.stringify(caseData) 
    }); 
  }
  
  async updateCase(id: string, caseData: Partial<Case>): Promise<Case> { 
    return this.authenticatedRequest<Case>(`/api/cases/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(caseData) 
    }); 
  }
  
  async deleteCase(id: string): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/cases/${id}`, { 
      method: 'DELETE' 
    }); 
  }
  
  async archiveCaseDocuments(id: string): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/cases/${id}/archive`, { 
      method: 'PUT' 
    }); 
  }

  // =================================================================
  // MÓDULO FINANCEIRO - ✅ TIPAGEM CORRIGIDA E COMPLETADA
  // =================================================================
  
  async getFinancialAgreements(): Promise<FinancialAgreement[]> { 
    return this.authenticatedRequest<FinancialAgreement[]>('/api/financial-agreements'); 
  }
  
  async getFinancialAgreement(id: string): Promise<FinancialAgreement> { 
    return this.authenticatedRequest<FinancialAgreement>(`/api/financial-agreements/${id}`); 
  }
  
  async createFinancialAgreement(agreementData: Partial<FinancialAgreement>): Promise<FinancialAgreement> { 
    return this.authenticatedRequest<FinancialAgreement>('/api/financial-agreements', { 
      method: 'POST', 
      body: JSON.stringify(agreementData) 
    }); 
  }
  
  async updateFinancialAgreement(id: string, agreementData: Partial<FinancialAgreement>): Promise<FinancialAgreement> { 
    return this.authenticatedRequest<FinancialAgreement>(`/api/financial-agreements/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(agreementData) 
    }); 
  }

  // =================================================================
  // MÓDULO DE FUNCIONÁRIOS (EMPLOYEES) - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getEmployees(): Promise<Employee[]> { 
    return this.authenticatedRequest<Employee[]>('/api/employees'); 
  }
  
  async getEmployee(id: number): Promise<Employee> { 
    return this.authenticatedRequest<Employee>(`/api/employees/${id}`); 
  }
  
  async createEmployee(employeeData: EmployeeData): Promise<Employee> { 
    return this.authenticatedRequest<Employee>('/api/employees', { 
      method: 'POST', 
      body: JSON.stringify(employeeData) 
    }); 
  }
  
  async updateEmployee(id: number, employeeData: UpdateEmployeeData): Promise<Employee> { 
    return this.authenticatedRequest<Employee>(`/api/employees/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(employeeData) 
    }); 
  }
  
  async deleteEmployee(id: number): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/employees/${id}`, { 
      method: 'DELETE' 
    }); 
  }

  // =================================================================
  // MÓDULO DE AUTENTICAÇÃO E PERFIS - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getCurrentUser(): Promise<CurrentUser> { 
    return this.authenticatedRequest<CurrentUser>('/api/auth/me'); 
  }
  
  async logout(): Promise<void> {
    try {
      await this.authenticatedRequest<void>('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("[ApiClient] Falha na API de logout, mas continuará o processo:", error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
  
  async setPassword(data: { code: string; password?: string; }): Promise<void> { 
    return this.authenticatedRequest<void>('/api/auth/set-password', { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }); 
  }

  // =================================================================
  // MÓDULO DE PETIÇÕES (PETITIONS) - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getPetitions(): Promise<Petition[]> { 
    return this.authenticatedRequest<Petition[]>('/api/petitions'); 
  }
  
  async getPetition(id: number): Promise<Petition> { 
    return this.authenticatedRequest<Petition>(`/api/petitions/${id}`); 
  }
  
  async createPetition(petitionData: Partial<Petition>): Promise<Petition> { 
    return this.authenticatedRequest<Petition>('/api/petitions', { 
      method: 'POST', 
      body: JSON.stringify(petitionData) 
    }); 
  }
  
  async updatePetition(id: number, petitionData: Partial<Petition>): Promise<Petition> { 
    return this.authenticatedRequest<Petition>(`/api/petitions/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(petitionData) 
    }); 
  }
  
  async deletePetition(id: number): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/petitions/${id}`, { 
      method: 'DELETE' 
    }); 
  }

  // =================================================================
  // MÓDULO DE NOTIFICAÇÕES - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getNotifications(userId: string): Promise<{ notifications: Notification[] }> { 
    return this.authenticatedRequest<{ notifications: Notification[] }>(`/api/notifications?user_id=${userId}`); 
  }
  
  async getUnreadNotificationCount(userId: string): Promise<{ count: number }> { 
    return this.authenticatedRequest<{ count: number }>(`/api/notifications/count?user_id=${userId}`); 
  }
  
  async markNotificationAsRead(notificationId: number): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/notifications/${notificationId}/read`, { 
      method: 'PUT' 
    }); 
  }
  
  async markAllNotificationsAsRead(userId: string): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/notifications/mark-all-read`, { 
      method: 'PUT',
      body: JSON.stringify({ user_id: userId })
    }); 
  }

  // =================================================================
  // MÓDULO DE CARGOS E PERMISSÕES (ROLES & PERMISSIONS) - ✅ TIPAGEM CORRIGIDA
  // =================================================================
  
  async getRoles(): Promise<Role[]> { 
    return this.authenticatedRequest<Role[]>('/api/roles'); 
  }
  
  async getRole(id: number): Promise<Role> { 
    return this.authenticatedRequest<Role>(`/api/roles/${id}`); 
  }
  
  async createRole(roleData: Partial<Role>): Promise<Role> { 
    return this.authenticatedRequest<Role>('/api/roles', { 
      method: 'POST', 
      body: JSON.stringify(roleData) 
    }); 
  }
  
  async updateRole(id: number, roleData: Partial<Role>): Promise<Role> { 
    return this.authenticatedRequest<Role>(`/api/roles/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(roleData) 
    }); 
  }
  
  async deleteRole(id: number): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/roles/${id}`, { 
      method: 'DELETE' 
    }); 
  }
  
  async getPermissions(): Promise<Permission[]> { 
    return this.authenticatedRequest<Permission[]>('/api/permissions'); 
  }

  // =================================================================
  // MÓDULO DE TEMPLATES DE DOCUMENTOS - ✅ TIPAGEM CORRIGIDA E EXPANDIDA
  // =================================================================
  
  async getTemplates(): Promise<DocumentTemplate[]> { 
    return this.authenticatedRequest<DocumentTemplate[]>('/api/document-templates'); 
  }
  
  async getTemplate(id: number): Promise<DocumentTemplate> { 
    return this.authenticatedRequest<DocumentTemplate>(`/api/document-templates/${id}`); 
  }
  
  async createTemplate(templateData: Partial<DocumentTemplate>): Promise<DocumentTemplate> { 
    return this.authenticatedRequest<DocumentTemplate>('/api/document-templates', { 
      method: 'POST', 
      body: JSON.stringify(templateData) 
    }); 
  }
  
  async updateTemplate(id: number, templateData: Partial<DocumentTemplate>): Promise<DocumentTemplate> { 
    return this.authenticatedRequest<DocumentTemplate>(`/api/document-templates/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(templateData) 
    }); 
  }
  
  async deleteTemplate(id: number): Promise<void> { 
    return this.authenticatedRequest<void>(`/api/document-templates/${id}`, { 
      method: 'DELETE' 
    }); 
  }
  
  async generateDocument(templateId: number, caseId: number): Promise<{ generatedContent: string; documentTitle: string }> {
    return this.authenticatedRequest<{ generatedContent: string; documentTitle: string }>('/api/document-templates/generate', {
      method: 'POST',
      body: JSON.stringify({ templateId, caseId }),
    });
  }

  // =================================================================
  // ✅ NOVOS MÉTODOS UTILITÁRIOS
  // =================================================================
  
  /**
   * Método para fazer upload de arquivos
   */
  async uploadFile(file: File, caseId?: number): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) {
      formData.append('case_id', caseId.toString());
    }

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro no upload do arquivo');
    }

    return response.json();
  }

  /**
   * Método para fazer download de arquivos
   */
  async downloadFile(filename: string): Promise<Blob> {
    const response = await fetch(`/api/files/${filename}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Erro no download do arquivo');
    }

    return response.blob();
  }

  /**
   * Método para verificar conectividade com a API
   */
  async healthCheck(): Promise<{ status: 'ok' | 'error'; timestamp: string }> {
    return this.authenticatedRequest<{ status: 'ok' | 'error'; timestamp: string }>('/api/health');
  }

  /**
   * Método para buscar dados de dashboard/estatísticas
   */
  async getDashboardStats(): Promise<{
    totalCases: number;
    activeCases: number;
    completedCases: number;
    totalAgreements: number;
    totalValue: number;
    overdueAgreements: number;
  }> {
    return this.authenticatedRequest<{
      totalCases: number;
      activeCases: number;
      completedCases: number;
      totalAgreements: number;
      totalValue: number;
      overdueAgreements: number;
    }>('/api/dashboard/stats');
  }
}

// ✅ Instância única exportada
export const apiClient = new ApiClient();