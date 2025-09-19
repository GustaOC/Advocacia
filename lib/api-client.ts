// lib/api-client.ts - VERSÃO PADRONIZADA E COMPLETA
// Centraliza todas as chamadas de API do frontend para o backend.

interface EmployeeData {
  name: string;
  email: string;
  role_id: number;
}

interface UpdateEmployeeData {
  name?: string;
  role_id?: number;
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
          // Redireciona para o login se a sessão expirar
          window.location.href = '/login?error=session-expired';
        }
      }
      
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
      return response.json();
    } else {
      // Retorna um objeto vazio para respostas sem conteúdo (ex: DELETE com status 204)
      return {} as T;
    }
  }

  // === MÓDULO DE AUTENTICAÇÃO E PERFIL ===
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

  // === MÓDULO DE CLIENTES ===
  async getClients() { return this.authenticatedRequest<any[]>('/api/clients'); }
  async getClient(id: string) { return this.authenticatedRequest(`/api/clients/${id}`); }
  async createClient(clientData: any) { return this.authenticatedRequest('/api/clients', { method: 'POST', body: JSON.stringify(clientData) }); }
  async updateClient(id: string, clientData: any) { return this.authenticatedRequest(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(clientData) }); }
  async deleteClient(id: string) { return this.authenticatedRequest(`/api/clients/${id}`, { method: 'DELETE' }); }

  // === MÓDULO DE CASOS/PROCESSOS ===
  async getCases() { return this.authenticatedRequest<any[]>('/api/cases'); }
  async getCase(id: string) { return this.authenticatedRequest(`/api/cases/${id}`); }
  async createCase(caseData: any) { return this.authenticatedRequest('/api/cases', { method: 'POST', body: JSON.stringify(caseData) }); }
  async updateCase(id: string, caseData: any) { return this.authenticatedRequest(`/api/cases/${id}`, { method: 'PUT', body: JSON.stringify(caseData) }); }
  
  // === MÓDULO DE DOCUMENTOS ===
  async getDocumentsByCaseId(caseId: number) { return this.authenticatedRequest<any[]>(`/api/documents?case_id=${caseId}`); }
  async uploadDocument(formData: FormData) { return this.authenticatedRequest('/api/documents', { method: 'POST', body: formData, headers: {} }); } // Header é removido para que o browser defina o multipart/form-data
  async deleteDocument(id: number) { return this.authenticatedRequest(`/api/documents/${id}`, { method: 'DELETE' }); }

  // === MÓDULO DE TAREFAS ===
  async getTasks() { return this.authenticatedRequest<any[]>('/api/tasks'); }
  async createTask(taskData: any) { return this.authenticatedRequest('/api/tasks', { method: 'POST', body: JSON.stringify(taskData) }); }
  async completeTask(taskId: string) { return this.authenticatedRequest(`/api/tasks/${taskId}/complete`, { method: 'PATCH' }); }

  // === MÓDULO DE EVENTOS (AGENDA) ===
  async getEvents() { return this.authenticatedRequest<any[]>('/api/events'); }
  async createEvent(eventData: any) { return this.authenticatedRequest('/api/events', { method: 'POST', body: JSON.stringify(eventData) }); }
  async updateEvent(id: string, eventData: any) { return this.authenticatedRequest(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }); }

  // === MÓDULO DE FUNCIONÁRIOS E CARGOS ===
  async getEmployees() { return this.authenticatedRequest<any[]>('/api/employees'); }
  async updateEmployee(id: number, employeeData: UpdateEmployeeData) { return this.authenticatedRequest(`/api/employees/${id}`, { method: 'PUT', body: JSON.stringify(employeeData) }); }
  async getRoles() { return this.authenticatedRequest<any[]>('/api/roles'); }

  // === MÓDULO DE PETIÇÕES ===
  async getPetitions() { return this.authenticatedRequest<any[]>('/api/petitions'); }
  async updatePetition(id: string, petitionData: any) { return this.authenticatedRequest(`/api/petitions/${id}`, { method: 'PUT', body: JSON.stringify(petitionData) }); }
  
  // === MÓDULO DE TEMPLATES DE DOCUMENTOS ===
  async getTemplates() { return this.authenticatedRequest<any[]>('/api/document-templates'); }
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

// Exporta uma instância única para ser usada em toda a aplicação
export const apiClient = new ApiClient();