// lib/api-client.ts - VERSÃO REATORADA
// Este arquivo centraliza todas as chamadas de API do frontend para o backend.

export class ApiClient {
  /**
   * Método genérico para realizar requisições autenticadas.
   * Ele automaticamente inclui os cookies de autenticação em cada chamada.
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
      // Essencial para enviar os cookies de autenticação para a API
      credentials: 'include', 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Erro na API: ${response.status} ${response.statusText}`;
      console.error(`[ApiClient] Falha na requisição para ${endpoint}:`, errorMessage);

      // Redireciona para o login em caso de não autorizado
      if (response.status === 401 || response.status === 403) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session-expired';
        }
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // =================================================================
  // MÓDULO DE ENTIDADES (ANTIGO CLIENTES)
  // =================================================================
  
  async getEntities() {
    return this.authenticatedRequest<any[]>('/api/entities');
  }

  async getEntity(id: string) {
    return this.authenticatedRequest(`/api/entities/${id}`);
  }

  async createEntity(entityData: any) {
    return this.authenticatedRequest('/api/entities', {
      method: 'POST',
      body: JSON.stringify(entityData),
    });
  }

  async updateEntity(id: string, entityData: any) {
    return this.authenticatedRequest(`/api/entities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entityData),
    });
  }

  async deleteEntity(id: string) {
    return this.authenticatedRequest(`/api/entities/${id}`, {
      method: 'DELETE',
    });
  }

  // =================================================================
  // MÓDULO DE CASOS/PROCESSOS
  // =================================================================

  async getCases() {
    return this.authenticatedRequest<any[]>('/api/cases');
  }

  async getCase(id: string) {
    return this.authenticatedRequest(`/api/cases/${id}`);
  }

  async createCase(caseData: any) {
    return this.authenticatedRequest('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  async updateCase(id: string, caseData: any) {
    return this.authenticatedRequest(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    });
  }

  async deleteCase(id: string) {
    return this.authenticatedRequest(`/api/cases/${id}`, {
      method: 'DELETE',
    });
  }
  
  // =================================================================
  // MÓDULO FINANCEIRO
  // =================================================================
  
  async getFinancialAgreements() {
    return this.authenticatedRequest('/api/financial-agreements');
  }

  async createFinancialAgreement(agreementData: any) {
    return this.authenticatedRequest('/api/financial-agreements', {
      method: 'POST',
      body: JSON.stringify(agreementData),
    });
  }

  // ... outros métodos financeiros ...

  // =================================================================
  // MÓDULO DE FUNCIONÁRIOS E AUTENTICAÇÃO
  // =================================================================

  async getEmployees() {
    return this.authenticatedRequest('/api/employees');
  }
  
  async getCurrentUser() {
    return this.authenticatedRequest('/api/auth/me');
  }

  async logout() {
    try {
      await this.authenticatedRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("[ApiClient] Falha na API de logout, mas continuará o processo:", error);
    } finally {
      // Garante que o usuário seja deslogado no frontend independentemente da resposta da API
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }
}

// Exporta uma instância única para ser usada em toda a aplicação
export const apiClient = new ApiClient();