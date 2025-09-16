// lib/supabase.ts - VERSÃO CORRIGIDA PRESERVANDO ESTRUTURA ORIGINAL
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}

// Interfaces do banco de dados (MANTIDAS COMO NO ORIGINAL)
export interface Client {
  id: number
  PROCESSO?: string
  LOJA?: string
  "EXECUTADO(A)": string
  CPF?: string
  TELEFONE?: string
  ENDERECO?: string
  NUMERO?: number
  BAIRRO?: string
  CIDADE?: string
  status: string
  Data: string
  email?: string
  updated_at?: string
}

export interface Process {
  id: number
  number: string
  client_id: number
  client_name: string
  type: string
  status: string
  court: string
  value: number
  source: string
  store?: string
  last_update: string
  next_deadline?: string
  created_at: string
  updated_at: string
  case_id?: number
}

export interface ProcessTimeline {
  id: number
  process_id: number
  event: string
  description: string
  date: string
  created_at: string
}

export interface Publication {
  id: number
  title: string
  content?: string
  publication_date: string
  source?: string
  category?: string
  tags?: string[]
  url?: string
  is_important: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  email: string
  password_hash: string
  role: string
  permissions: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Case {
  id: number
  name: string
  description?: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Installment {
  id: number
  agreement_id: number
  installment_number: number
  value: number
  due_date: string
  paid: boolean
  paid_date?: string
  paid_amount?: number
  notes?: string
  created_at: string
  updated_at: string
}

// Funções utilitárias (MANTIDAS COMO NO ORIGINAL)
export async function testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log("🔄 Testing database connection (mock mode for v0.dev)...")
  
  return {
    success: true,
    message: "Mock connection successful - using test data for development",
    details: { 
      mode: "development",
      message: "Real database connection disabled in v0.dev environment"
    }
  }
}

// Serviço de banco de dados - PRESERVANDO ESTRUTURA ORIGINAL E ADICIONANDO MELHORIAS
export class DatabaseService {
  // TODOS OS MÉTODOS ORIGINAIS MANTIDOS AQUI...
  static async getFinancialAgreements(options?: { includeIPCA?: boolean }): Promise<any[]> {
    console.log('[DatabaseService] getFinancialAgreements - returning mock data')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        id: 1,
        "EXECUTADO(A)": "João Silva",
        CPF: "123.456.789-00",
        PROCESSO: "0001234-56.2024.8.11.0001",
        agreement_type: "Parcelamento",
        "Valor ação": 10000,
        entry_value: 1000,
        entry_date: "2024-01-15",
        "Números de parcelas": 10,
        "Valor da parcelas": 900,
        paid_installments: 2,
        status: "active",
        ipca_correction: options?.includeIPCA ? 1.05 : null,
        current_total_value: 10500,
        current_installment_value: 945,
        installmentSchedule: [
          { installment_number: 1, value: 900, due_date: "2024-02-15", paid: true },
          { installment_number: 2, value: 900, due_date: "2024-03-15", paid: true },
          { installment_number: 3, value: 900, due_date: "2024-04-15", paid: false }
        ]
      },
      {
        id: 2,
        "EXECUTADO(A)": "Maria Santos",
        CPF: "987.654.321-00",
        PROCESSO: "0005678-90.2024.8.11.0002",
        agreement_type: "Acordo Judicial",
        "Valor ação": 5000,
        entry_value: 500,
        entry_date: "2024-02-01",
        "Números de parcelas": 5,
        "Valor da parcelas": 900,
        paid_installments: 1,
        status: "active",
        ipca_correction: options?.includeIPCA ? 1.03 : null,
        current_total_value: 5150,
        current_installment_value: 927,
        installmentSchedule: [
          { installment_number: 1, value: 900, due_date: "2024-03-01", paid: true },
          { installment_number: 2, value: 900, due_date: "2024-04-01", paid: false }
        ]
      }
    ]
  }

  static async getProcesses(): Promise<Process[]> {
    console.log('[DatabaseService] getProcesses - returning mock data')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        id: 1,
        number: "0001234-56.2024.8.11.0001",
        client_id: 1,
        client_name: "João Silva",
        type: "Execução",
        status: "Em andamento",
        court: "1ª Vara Cível",
        value: 15000,
        source: "Manual",
        store: "Loja Centro",
        last_update: "2024-01-15T10:00:00Z",
        next_deadline: "2024-02-15T10:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      },
      {
        id: 2,
        number: "0005678-90.2024.8.11.0002",
        client_id: 2,
        client_name: "Maria Santos",
        type: "Cobrança",
        status: "Finalizado",
        court: "2ª Vara Cível",
        value: 8500,
        source: "Sistema",
        last_update: "2024-01-10T14:30:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-10T14:30:00Z"
      },
      {
        id: 3,
        number: "0009876-12.2024.8.11.0003",
        client_id: 3,
        client_name: "Carlos Oliveira",
        type: "Trabalhista",
        status: "Aguardando",
        court: "3ª Vara do Trabalho",
        value: 25000,
        source: "Manual",
        store: "Filial Sul",
        last_update: "2024-01-20T09:15:00Z",
        next_deadline: "2024-03-01T10:00:00Z",
        created_at: "2024-01-05T00:00:00Z",
        updated_at: "2024-01-20T09:15:00Z"
      },
      {
        id: 4,
        number: "0002468-13.2024.8.11.0004",
        client_id: 4,
        client_name: "Ana Costa",
        type: "Cível",
        status: "Em andamento",
        court: "4ª Vara Cível",
        value: 12000,
        source: "Sistema",
        last_update: "2024-01-18T16:45:00Z",
        next_deadline: "2024-02-28T14:00:00Z",
        created_at: "2024-01-08T00:00:00Z",
        updated_at: "2024-01-18T16:45:00Z"
      }
    ]
  }

  // MANTENDO TODOS OS OUTROS MÉTODOS ORIGINAIS...
  static async createProcess(processData: any): Promise<Process | null> {
    console.log('[DatabaseService] createProcess - mock creation', processData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id: Date.now(),
      number: processData.number || `000${Date.now()}-00.2024.8.11.0001`,
      client_id: processData.client_id || 1,
      client_name: processData.client_name || "Novo Cliente",
      type: processData.type || "Cível",
      status: processData.status || "Em andamento",
      court: processData.court || "1ª Vara Cível",
      value: processData.value || 0,
      source: processData.source || "Manual",
      store: processData.store,
      last_update: new Date().toISOString(),
      next_deadline: processData.next_deadline,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      case_id: processData.case_id
    }
  }

  static async updateProcess(id: number, processData: any): Promise<Process | null> {
    console.log('[DatabaseService] updateProcess - mock update', id, processData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id,
      ...processData,
      updated_at: new Date().toISOString()
    }
  }

  static async deleteProcess(id: number): Promise<boolean> {
    console.log('[DatabaseService] deleteProcess - mock delete', id)
    await new Promise(resolve => setTimeout(resolve, 100))
    return true
  }

  static async getCases(): Promise<Case[]> {
    console.log('[DatabaseService] getCases - returning mock data for v0.dev')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        id: 1,
        name: "Execução de Títulos Extrajudiciais",
        description: "Processos de cobrança judicial",
        color: "#2C3E50",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      },
      {
        id: 2,
        name: "Ações Trabalhistas",
        description: "Reclamações e defesas trabalhistas",
        color: "#27AE60",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      },
      {
        id: 3,
        name: "Ações Cíveis",
        description: "Processos cíveis em geral",
        color: "#E74C3C",
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      }
    ]
  }

  static async getCaseProcesses(caseId: number): Promise<Process[]> {
    console.log(`[DatabaseService] getCaseProcesses - returning mock data for case ${caseId}`)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        id: 1,
        number: "0001234-56.2024.8.11.0001",
        client_id: 1,
        client_name: "João Silva",
        type: "Execução",
        status: "Em andamento",
        court: "1ª Vara Cível",
        value: 15000,
        source: "Manual",
        store: "Loja Centro",
        last_update: "2024-01-15T10:00:00Z",
        next_deadline: "2024-02-15T10:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        case_id: caseId
      },
      {
        id: 2,
        number: "0005678-90.2024.8.11.0002",
        client_id: 2,
        client_name: "Maria Santos",
        type: "Cobrança",
        status: "Finalizado",
        court: "2ª Vara Cível",
        value: 8500,
        source: "Sistema",
        last_update: "2024-01-10T14:30:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-10T14:30:00Z",
        case_id: caseId
      }
    ]
  }

  static async createCase(caseData: { name: string; description: string; color: string }): Promise<Case | null> {
    console.log('[DatabaseService] createCase - mock creation', caseData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id: Date.now(),
      ...caseData,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async getClientById(id: number): Promise<Client | null> {
    console.log(`[DatabaseService] getClientById - returning mock data for client ${id}`)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const mockClients: Client[] = [
      {
        id: 1,
        "EXECUTADO(A)": "João Silva",
        CPF: "123.456.789-00",
        TELEFONE: "(67) 99269-0768",
        ENDERECO: "Rua das Flores",
        NUMERO: 123,
        BAIRRO: "Centro",
        CIDADE: "Campo Grande",
        status: "active",
        Data: "2024-01-01",
        email: "joao@email.com"
      },
      {
        id: 2,
        "EXECUTADO(A)": "Maria Santos",
        CPF: "987.654.321-00",
        TELEFONE: "(67) 98888-8888",
        ENDERECO: "Av. Principal",
        NUMERO: 456,
        BAIRRO: "Jardim",
        CIDADE: "Campo Grande",
        status: "active",
        Data: "2024-01-02",
        email: "maria@email.com"
      },
      {
        id: 3,
        "EXECUTADO(A)": "Carlos Oliveira",
        CPF: "456.123.789-00",
        TELEFONE: "(67) 97777-7777",
        ENDERECO: "Rua Central",
        NUMERO: 789,
        BAIRRO: "Vila Nova",
        CIDADE: "Campo Grande",
        status: "active",
        Data: "2024-01-03",
        email: "carlos@email.com"
      },
      {
        id: 4,
        "EXECUTADO(A)": "Ana Costa",
        CPF: "321.654.987-00",
        TELEFONE: "(67) 96666-6666",
        ENDERECO: "Av. Secundária",
        NUMERO: 321,
        BAIRRO: "Morada",
        CIDADE: "Campo Grande",
        status: "active",
        Data: "2024-01-04",
        email: "ana@email.com"
      }
    ]
    
    const client = mockClients.find(c => c.id === id)
    if (client) return client
    
    return {
      id: id,
      "EXECUTADO(A)": `Cliente ${id}`,
      CPF: `000.000.000-${String(id).padStart(2, '0')}`,
      TELEFONE: "(67) 90000-0000",
      ENDERECO: "Endereço Padrão",
      NUMERO: id,
      BAIRRO: "Centro",
      CIDADE: "Campo Grande",
      status: "active",
      Data: new Date().toISOString().split('T')[0],
      email: `cliente${id}@email.com`
    }
  }

  // MÉTODO GETCLIENTS MELHORADO PARA SUPORTAR CRIAÇÃO E ATUALIZAÇÃO
  private static mockClients: Client[] = [
    {
      id: 1,
      "EXECUTADO(A)": "João Silva",
      CPF: "123.456.789-00",
      TELEFONE: "(67) 99269-0768",
      ENDERECO: "Rua das Flores",
      NUMERO: 123,
      BAIRRO: "Centro",
      CIDADE: "Campo Grande",
      status: "active",
      Data: "2024-01-01",
      email: "joao@email.com"
    },
    {
      id: 2,
      "EXECUTADO(A)": "Maria Santos",
      CPF: "987.654.321-00",
      TELEFONE: "(67) 98888-8888",
      ENDERECO: "Av. Principal",
      NUMERO: 456,
      BAIRRO: "Jardim",
      CIDADE: "Campo Grande",
      status: "active",
      Data: "2024-01-02",
      email: "maria@email.com"
    },
    {
      id: 3,
      "EXECUTADO(A)": "Pedro Oliveira",
      CPF: "456.789.123-00",
      TELEFONE: "(67) 97777-7777",
      ENDERECO: "Rua Central",
      NUMERO: 789,
      BAIRRO: "Vila Nova",
      CIDADE: "Campo Grande",
      status: "pending",
      Data: "2024-01-03",
      email: "pedro@email.com"
    }
  ]

  static async getClients(): Promise<Client[]> {
    console.log('[DatabaseService] getClients - returning mock data')
    await new Promise(resolve => setTimeout(resolve, 100))
    return [...this.mockClients]
  }

  static async getClientsForFinancial(): Promise<Client[]> {
    console.log('[DatabaseService] getClientsForFinancial - returning mock data')
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return this.mockClients.filter(c => c.status === "active").map(c => ({
      ...c,
      PROCESSO: `000${c.id}234-56.2024.8.11.000${c.id}`
    }))
  }

  static async createFinancialAgreement(agreementData: any): Promise<any> {
    console.log('[DatabaseService] createFinancialAgreement - mock creation', agreementData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id: Date.now(),
      ...agreementData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async updateFinancialAgreement(id: number, agreementData: any): Promise<any> {
    console.log('[DatabaseService] updateFinancialAgreement - mock update', id, agreementData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id,
      ...agreementData,
      updated_at: new Date().toISOString()
    }
  }

  static async getEmployees(): Promise<Employee[]> {
    console.log('[DatabaseService] getEmployees - returning mock data')
    
    return [
      {
        id: 1,
        name: "Admin Sistema",
        email: "admin@teste.com",
        password_hash: "",
        role: "super_admin",
        permissions: ["CASES_VIEW", "CASES_CREATE", "CASES_EDIT", "CASES_DELETE"],
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      },
      {
        id: 2,
        name: "João Advogado",
        email: "joao@advocacia.com",
        password_hash: "",
        role: "advogado",
        permissions: ["CASES_VIEW", "CASES_CREATE", "CLIENTS_VIEW"],
        is_active: true,
        created_at: "2024-01-02T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z"
      }
    ]
  }

  static async getProcessById(id: number): Promise<Process | null> {
    console.log(`[DatabaseService] getProcessById - returning mock data for process ${id}`)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const processes = await this.getProcesses()
    const process = processes.find(p => p.id === id)
    
    if (process) return process
    
    return {
      id: id,
      number: `000${id}-00.2024.8.11.0001`,
      client_id: 1,
      client_name: "Cliente Padrão",
      type: "Cível",
      status: "Em andamento",
      court: "1ª Vara Cível",
      value: 10000,
      source: "Manual",
      last_update: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async getProcessesByClientId(clientId: number): Promise<Process[]> {
    console.log(`[DatabaseService] getProcessesByClientId - returning mock data for client ${clientId}`)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const allProcesses = await this.getProcesses()
    const clientProcesses = allProcesses.filter(p => p.client_id === clientId)
    
    return clientProcesses.length > 0 ? clientProcesses : []
  }

  static async searchProcesses(searchTerm: string): Promise<Process[]> {
    console.log(`[DatabaseService] searchProcesses - searching for: ${searchTerm}`)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const allProcesses = await this.getProcesses()
    
    if (!searchTerm) return allProcesses
    
    const term = searchTerm.toLowerCase()
    return allProcesses.filter(p => 
      p.number.toLowerCase().includes(term) ||
      p.client_name.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term) ||
      p.status.toLowerCase().includes(term)
    )
  }

  static async getProcessTimeline(processId: number): Promise<ProcessTimeline[]> {
    console.log(`[DatabaseService] getProcessTimeline - returning mock data for process ${processId}`)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return [
      {
        id: 1,
        process_id: processId,
        event: "Petição Inicial",
        description: "Protocolo da petição inicial",
        date: "2024-01-01T10:00:00Z",
        created_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        process_id: processId,
        event: "Citação",
        description: "Réu citado",
        date: "2024-01-15T14:30:00Z",
        created_at: "2024-01-15T14:30:00Z"
      },
      {
        id: 3,
        process_id: processId,
        event: "Audiência",
        description: "Audiência de conciliação marcada",
        date: "2024-02-15T09:00:00Z",
        created_at: "2024-01-20T11:00:00Z"
      }
    ]
  }

  static async addProcessTimelineEvent(processId: number, eventData: any): Promise<ProcessTimeline | null> {
    console.log('[DatabaseService] addProcessTimelineEvent - mock creation', processId, eventData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return {
      id: Date.now(),
      process_id: processId,
      event: eventData.event || "Novo Evento",
      description: eventData.description || "",
      date: eventData.date || new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  }

  static async getEmployeeById(id: number): Promise<Employee | null> {
    console.log(`[DatabaseService] getEmployeeById - returning mock data for employee ${id}`)
    
    await new Promise(resolve => setTimeout(resolve, 50))
    
    const employees = await this.getEmployees()
    const employee = employees.find(e => e.id === id)
    
    if (employee) return employee
    
    return {
      id: id,
      name: `Funcionário ${id}`,
      email: `funcionario${id}@email.com`,
      password_hash: "",
      role: "estagiario",
      permissions: ["CASES_VIEW", "CLIENTS_VIEW"],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  static async getRoles(): Promise<string[]> {
    console.log('[DatabaseService] getRoles - returning mock roles')
    
    return [
      "super_admin",
      "advogado",
      "secretaria",
      "estagiario",
      "financeiro"
    ]
  }

  static async getPermissions(): Promise<string[]> {
    console.log('[DatabaseService] getPermissions - returning mock permissions')
    
    return [
      "CASES_VIEW",
      "CASES_CREATE",
      "CASES_EDIT",
      "CASES_DELETE",
      "CLIENTS_VIEW",
      "CLIENTS_CREATE",
      "CLIENTS_EDIT",
      "CLIENTS_DELETE",
      "FINANCIAL_VIEW",
      "FINANCIAL_CREATE",
      "FINANCIAL_EDIT",
      "FINANCIAL_DELETE",
      "EMPLOYEES_VIEW",
      "EMPLOYEES_CREATE",
      "EMPLOYEES_EDIT",
      "EMPLOYEES_DELETE"
    ]
  }

  // MANTENDO COMPATIBILIDADE COM O CLIENTS-MODULE ORIGINAL
  static subscribeToClients(callback: (payload: any) => void): () => void {
    console.log('[DatabaseService] subscribeToClients - setting up mock subscription')
    
    const timeoutId = setTimeout(() => {
      callback({ eventType: 'INSERT', new: this.mockClients[0] })
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
      console.log('[DatabaseService] Unsubscribed from clients')
    }
  }

  static subscribeToProcesses(callback: (processes: Process[]) => void): { unsubscribe: () => void } {
    console.log('[DatabaseService] subscribeToProcesses - setting up mock subscription')
    
    const mockProcesses: Process[] = [
      {
        id: 1,
        number: "0001234-56.2024.8.11.0001",
        client_id: 1,
        client_name: "João Silva",
        type: "Execução",
        status: "Em andamento",
        court: "1ª Vara Cível",
        value: 15000,
        source: "Manual",
        last_update: "2024-01-15T10:00:00Z",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
      }
    ]
    
    const timeoutId = setTimeout(() => {
      callback(mockProcesses)
    }, 100)
    
    return {
      unsubscribe: () => {
        clearTimeout(timeoutId)
        console.log('[DatabaseService] Unsubscribed from processes')
      }
    }
  }

  // MÉTODO CREATECLIENT MELHORADO PARA ADICIONAR À LISTA MOCK
  static async createClient(clientData: any): Promise<Client> {
    console.log('[DatabaseService] createClient - mock creation', clientData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const newClient: Client = {
      id: Date.now(),
      "EXECUTADO(A)": clientData["EXECUTADO(A)"] || clientData.name || "",
      CPF: clientData.CPF || "",
      TELEFONE: clientData.TELEFONE || "",
      ENDERECO: clientData.ENDERECO || clientData.ENDEREÇO || "",
      NUMERO: clientData.NUMERO || clientData.NÚMERO || 0,
      BAIRRO: clientData.BAIRRO || "",
      CIDADE: clientData.CIDADE || "",
      PROCESSO: clientData.PROCESSO || "",
      LOJA: clientData.LOJA || "",
      status: clientData.status || "active",
      Data: clientData.Data || new Date().toISOString().split('T')[0],
      email: clientData.email || ""
    }
    
    // Adiciona o novo cliente à lista mock
    this.mockClients.push(newClient)
    
    return newClient
  }

  // MÉTODO UPDATECLIENT MELHORADO
  static async updateClient(id: number, clientData: any): Promise<Client> {
    console.log('[DatabaseService] updateClient - mock update', id, clientData)
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const index = this.mockClients.findIndex(c => c.id === id)
    
    if (index !== -1) {
      this.mockClients[index] = {
        ...this.mockClients[index],
        ...clientData,
        updated_at: new Date().toISOString()
      }
      return this.mockClients[index]
    }
    
    throw new Error(`Cliente com ID ${id} não encontrado`)
  }

  // MÉTODO DELETECLIENT MELHORADO
  static async deleteClient(id: number): Promise<boolean> {
    console.log('[DatabaseService] deleteClient - mock delete', id)
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const index = this.mockClients.findIndex(c => c.id === id)
    
    if (index !== -1) {
      this.mockClients.splice(index, 1)
      return true
    }
    
    return false
  }
}

// Função utilitária para teste de conexão (compatibilidade)
export async function testDatabaseConnection() {
  return testConnection()
}

export const db = DatabaseService
