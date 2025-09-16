// lib/api-client.ts - VERSÃO CORRIGIDA PARA FUNCIONAR COM COOKIES
export class ApiClient {
  // Método genérico para fazer requests autenticados usando cookies
  private async authenticatedRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    console.log(`[ApiClient] Making request to: ${endpoint}`)

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // IMPORTANTE: Incluir cookies de autenticação
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error || `HTTP ${response.status}`
      
      console.error(`[ApiClient] Request failed: ${errorMessage}`)
      
      // Se erro 401, redirecionar para login
      if (response.status === 401) {
        console.warn("[ApiClient] Unauthorized - redirecting to login")
        if (typeof window !== 'undefined') {
          window.location.href = '/login?error=session-expired'
        }
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  // Métodos para funcionários
  async getEmployees() {
    return this.authenticatedRequest('/api/employees')
  }

  async getEmployee(id: string) {
    return this.authenticatedRequest(`/api/employees/${id}`)
  }

  async createEmployee(employeeData: any) {
    return this.authenticatedRequest('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    })
  }

  async updateEmployee(id: string, employeeData: any) {
    return this.authenticatedRequest(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData),
    })
  }

  async deleteEmployee(id: string) {
    return this.authenticatedRequest(`/api/employees/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para clientes
  async getClients() {
    return this.authenticatedRequest('/api/clients')
  }

  async createClient(clientData: any) {
    return this.authenticatedRequest('/api/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    })
  }

  async updateClient(id: string, clientData: any) {
    return this.authenticatedRequest(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    })
  }

  async deleteClient(id: string) {
    return this.authenticatedRequest(`/api/clients/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para casos
  async getCases() {
    return this.authenticatedRequest('/api/cases')
  }

  async getCase(id: string) {
    return this.authenticatedRequest(`/api/cases/${id}`)
  }

  async createCase(caseData: any) {
    return this.authenticatedRequest('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    })
  }

  async updateCase(id: string, caseData: any) {
    return this.authenticatedRequest(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    })
  }

  async deleteCase(id: string) {
    return this.authenticatedRequest(`/api/cases/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para petições
  async getPetitions() {
    return this.authenticatedRequest('/api/petitions')
  }

  async getPetition(id: string) {
    return this.authenticatedRequest(`/api/petitions/${id}`)
  }

  async createPetition(petitionData: any) {
    return this.authenticatedRequest('/api/petitions', {
      method: 'POST',
      body: JSON.stringify(petitionData),
    })
  }

  async updatePetition(id: string, petitionData: any) {
    return this.authenticatedRequest(`/api/petitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(petitionData),
    })
  }

  async deletePetition(id: string) {
    return this.authenticatedRequest(`/api/petitions/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para acordos financeiros
  async getFinancialAgreements() {
    return this.authenticatedRequest('/api/financial-agreements')
  }

  async getFinancialAgreement(id: string) {
    return this.authenticatedRequest(`/api/financial-agreements/${id}`)
  }

  async createFinancialAgreement(agreementData: any) {
    return this.authenticatedRequest('/api/financial-agreements', {
      method: 'POST',
      body: JSON.stringify(agreementData),
    })
  }

  async updateFinancialAgreement(id: string, agreementData: any) {
    return this.authenticatedRequest(`/api/financial-agreements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agreementData),
    })
  }

  async deleteFinancialAgreement(id: string) {
    return this.authenticatedRequest(`/api/financial-agreements/${id}`, {
      method: 'DELETE',
    })
  }

  // Métodos para notificações
  async getNotifications() {
    return this.authenticatedRequest('/api/notifications')
  }

  async markNotificationAsRead(id: string) {
    return this.authenticatedRequest(`/api/notifications/${id}/read`, {
      method: 'POST',
    })
  }

  async getNotificationCount() {
    return this.authenticatedRequest('/api/notifications/count')
  }

  // Métodos para permissões
  async getPermissions() {
    return this.authenticatedRequest('/api/permissions')
  }

  async checkPermission(permission: string): Promise<boolean> {
    try {
      await this.authenticatedRequest('/api/permissions', {
        method: 'POST',
        body: JSON.stringify({ permission }),
      })
      return true
    } catch (error) {
      console.warn(`[ApiClient] Permission ${permission} denied:`, error)
      return false
    }
  }

  // Métodos para perfil de usuário
  async getProfile() {
    return this.authenticatedRequest('/api/profile')
  }

  async updateProfile(profileData: any) {
    return this.authenticatedRequest('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    })
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.authenticatedRequest('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    })
  }

  // Métodos para configurações
  async getSettings() {
    return this.authenticatedRequest('/api/settings')
  }

  async updateSettings(settingsData: any) {
    return this.authenticatedRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    })
  }

  // Métodos para roles
  async getRoles() {
    return this.authenticatedRequest('/api/roles')
  }

  async createRole(roleData: any) {
    return this.authenticatedRequest('/api/roles', {
      method: 'POST',
      body: JSON.stringify(roleData),
    })
  }

  async updateRole(id: string, roleData: any) {
    return this.authenticatedRequest(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roleData),
    })
  }

  async deleteRole(id: string) {
    return this.authenticatedRequest(`/api/roles/${id}`, {
      method: 'DELETE',
    })
  }

  // Método para logout
  async logout() {
    try {
      // Faz logout via API
      await this.authenticatedRequest('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      console.error("[ApiClient] Logout API failed:", error)
    }
    
    // Limpar storage local independente do resultado da API
    if (typeof window !== 'undefined') {
      sessionStorage.clear()
      localStorage.removeItem('dev-auth-token')
      
      // Limpar cookies de autenticação
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
      document.cookie = 'sb-auth-token-client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
      document.cookie = 'just-logged-in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
      
      // Redirecionar para login
      window.location.href = '/login'
    }
  }

  // Método para verificar se está autenticado (baseado em cookies)
  async isAuthenticated(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    
    // Verifica se há cookies de autenticação
    const cookies = document.cookie
    const hasAuthCookie = cookies.includes('sb-access-token') || 
                         cookies.includes('sb-auth-token-client') ||
                         cookies.includes('just-logged-in')
    
    if (!hasAuthCookie) {
      console.log("[ApiClient] No auth cookies found")
      return false
    }

    try {
      // Testa uma requisição simples para verificar se está autenticado
      await this.authenticatedRequest('/api/auth/me')
      return true
    } catch (error) {
      console.warn("[ApiClient] Auth verification failed:", error)
      return false
    }
  }

  // Método para obter informações do usuário atual
  async getCurrentUser() {
    return this.authenticatedRequest('/api/auth/me')
  }
}

// Instância singleton
export const apiClient = new ApiClient()
