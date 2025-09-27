// hooks/use-financials.ts - VERSÃO MELHORADA E COMPLETA

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from './use-toast'
import { apiClient, FinancialAgreement } from '@/lib/api-client'

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface FinancialAgreementFilters {
  status?: string
  agreementType?: string
  clientId?: string
  startDate?: string
  endDate?: string
  search?: string
}

interface ReportFilters {
  startDate: string
  endDate: string
  reportType: 'general' | 'agreements' | 'payments' | 'overdue' | 'clients'
  clientIds?: number[]
  status?: string[]
}

// ============================================================================
// CHAVES DE QUERY
// ============================================================================

const financialAgreementsQueryKey = ['financialAgreements']
const financialReportsQueryKey = ['financialReports']
const agreementInstallmentsQueryKey = ['agreementInstallments']
const agreementPaymentHistoryQueryKey = ['agreementPaymentHistory']

// ============================================================================
// HOOKS PARA ACORDOS FINANCEIROS
// ============================================================================

/**
 * Hook para buscar a lista de acordos financeiros.
 * ✅ CORRIGIDO: Usando apenas os métodos disponíveis no apiClient.
 */
export const useGetFinancialAgreements = (
  page = 1, 
  pageSize = 10, 
  filters: FinancialAgreementFilters = {}
) => {
  return useQuery<FinancialAgreement[], Error>({
    queryKey: [...financialAgreementsQueryKey, page, pageSize, filters],
    queryFn: () => apiClient.getFinancialAgreements(), // ✅ CORREÇÃO: Sem parâmetros
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
    placeholderData: (previousData) => previousData, // Mantém dados anteriores durante loading
    select: (data) => {
      // Aplicar filtros e paginação no lado cliente por enquanto
      let filteredData = data || []
      
      // Aplicar filtros
      if (filters.status) {
        filteredData = filteredData.filter(item => item.status === filters.status)
      }
      if (filters.agreementType) {
        filteredData = filteredData.filter(item => item.agreement_type === filters.agreementType)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(item => 
          item.entities.name.toLowerCase().includes(searchLower) ||
          item.cases.case_number?.toLowerCase().includes(searchLower)
        )
      }
      
      // Aplicar paginação
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
      return filteredData.slice(startIndex, endIndex)
    }
  })
}

/**
 * Hook para buscar todos os acordos financeiros sem paginação.
 * ✅ CORRIGIDO: Usando o método disponível no apiClient.
 */
export const useGetAllFinancialAgreements = (filters: FinancialAgreementFilters = {}) => {
  return useQuery<FinancialAgreement[], Error>({
    queryKey: [...financialAgreementsQueryKey, 'all', filters],
    queryFn: () => apiClient.getFinancialAgreements(), // ✅ CORREÇÃO: Usando método existente
    staleTime: 1000 * 60 * 10, // Cache de 10 minutos
    select: (data) => {
      // Aplicar filtros no lado cliente
      let filteredData = data || []
      
      if (filters.status) {
        filteredData = filteredData.filter(item => item.status === filters.status)
      }
      if (filters.agreementType) {
        filteredData = filteredData.filter(item => item.agreement_type === filters.agreementType)
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(item => 
          item.entities.name.toLowerCase().includes(searchLower) ||
          item.cases.case_number?.toLowerCase().includes(searchLower)
        )
      }
      
      return filteredData
    }
  })
}

/**
 * Hook para buscar os detalhes de um único acordo financeiro.
 */
export const useGetFinancialAgreementDetails = (agreementId: string | null) => {
  return useQuery<FinancialAgreement | null, Error>({
    queryKey: ['financialAgreementDetails', agreementId],
    queryFn: () =>
      agreementId ? apiClient.getFinancialAgreementDetails(agreementId) : null,
    enabled: !!agreementId,
    staleTime: 1000 * 60 * 2, // Cache de 2 minutos
  })
}

/**
 * Hook para criar um novo acordo financeiro.
 */
export const useCreateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<FinancialAgreement, Error, any>({
    mutationFn: (newAgreementData) =>
      apiClient.createFinancialAgreement(newAgreementData),
    onSuccess: () => {
      // Invalida todas as queries relacionadas aos acordos
      queryClient.invalidateQueries({ 
        queryKey: financialAgreementsQueryKey,
        exact: false 
      })
      queryClient.invalidateQueries({ 
        queryKey: financialReportsQueryKey,
        exact: false 
      })
      
      toast({
        title: 'Sucesso!',
        description: 'O acordo financeiro foi criado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Criar Acordo',
        description: error.message || 'Não foi possível criar o acordo financeiro.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook para atualizar um acordo financeiro existente.
 */
export const useUpdateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<
    FinancialAgreement,
    Error,
    { id: string; data: Partial<FinancialAgreement> }
  >({
    mutationFn: ({ id, data }) => apiClient.updateFinancialAgreement(id, data),
    onSuccess: (updatedAgreement, variables) => {
      // Atualiza o cache específico do acordo
      queryClient.setQueryData(
        ['financialAgreementDetails', variables.id],
        updatedAgreement
      )
      
      // Invalida listas e relatórios
      queryClient.invalidateQueries({ 
        queryKey: financialAgreementsQueryKey,
        exact: false 
      })
      queryClient.invalidateQueries({ 
        queryKey: financialReportsQueryKey,
        exact: false 
      })
      
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi atualizado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Atualizar',
        description: error.message || 'Não foi possível atualizar o acordo.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook para deletar um acordo financeiro.
 */
export const useDeleteFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<boolean, Error, string>({
    mutationFn: (id) => apiClient.deleteFinancialAgreement(id),
    onSuccess: (_, deletedId) => {
      // Remove do cache
      queryClient.removeQueries({
        queryKey: ['financialAgreementDetails', deletedId]
      })
      
      // Invalida listas
      queryClient.invalidateQueries({ 
        queryKey: financialAgreementsQueryKey,
        exact: false 
      })
      queryClient.invalidateQueries({ 
        queryKey: financialReportsQueryKey,
        exact: false 
      })
      
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi deletado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro ao Deletar',
        description: error.message || 'Não foi possível deletar o acordo.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook para renegociar um acordo financeiro existente.
 */
export const useRenegotiateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<
    FinancialAgreement,
    Error,
    { agreementId: string; data: any }
  >({
    mutationFn: ({ agreementId, data }) =>
      apiClient.renegotiateFinancialAgreement(agreementId, data),
    onSuccess: (renegotiatedAgreement, variables) => {
      // Atualiza o cache do acordo renegociado
      queryClient.setQueryData(
        ['financialAgreementDetails', variables.agreementId],
        renegotiatedAgreement
      )
      
      // Invalida listas e parcelas
      queryClient.invalidateQueries({ 
        queryKey: financialAgreementsQueryKey,
        exact: false 
      })
      queryClient.invalidateQueries({
        queryKey: [...agreementInstallmentsQueryKey, variables.agreementId]
      })
      
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi renegociado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro na Renegociação',
        description: error.message || 'Não foi possível renegociar o acordo.',
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// HOOKS PARA PARCELAS E PAGAMENTOS
// ============================================================================

/**
 * Hook para buscar as parcelas de um acordo específico.
 */
export const useGetAgreementInstallments = (agreementId: string | null) => {
  return useQuery({
    queryKey: [...agreementInstallmentsQueryKey, agreementId],
    queryFn: () => 
      agreementId ? apiClient.getAgreementInstallments(agreementId) : [],
    enabled: !!agreementId,
    staleTime: 1000 * 60 * 2, // Cache de 2 minutos
  })
}

/**
 * Hook para buscar o histórico de pagamentos de um acordo.
 */
export const useGetAgreementPaymentHistory = (agreementId: string | null) => {
  return useQuery({
    queryKey: [...agreementPaymentHistoryQueryKey, agreementId],
    queryFn: () =>
      agreementId ? apiClient.getAgreementPaymentHistory(agreementId) : [],
    enabled: !!agreementId,
    staleTime: 1000 * 60 * 2, // Cache de 2 minutos
  })
}

/**
 * Hook para registrar o pagamento de uma parcela.
 */
export const useRecordInstallmentPayment = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<any, Error, { agreementId: string; paymentData: any }>({
    mutationFn: ({ agreementId, paymentData }) =>
      apiClient.recordInstallmentPayment(agreementId, paymentData),
    onSuccess: (data, variables) => {
      // Invalida parcelas e histórico de pagamentos
      queryClient.invalidateQueries({
        queryKey: [...agreementInstallmentsQueryKey, variables.agreementId]
      })
      queryClient.invalidateQueries({
        queryKey: [...agreementPaymentHistoryQueryKey, variables.agreementId]
      })
      
      // Invalida detalhes do acordo
      queryClient.invalidateQueries({
        queryKey: ['financialAgreementDetails', variables.agreementId]
      })
      
      // Invalida listas e relatórios
      queryClient.invalidateQueries({ 
        queryKey: financialAgreementsQueryKey,
        exact: false 
      })
      queryClient.invalidateQueries({ 
        queryKey: financialReportsQueryKey,
        exact: false 
      })
      
      toast({
        title: 'Pagamento Registrado!',
        description: 'O pagamento foi registrado com sucesso.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro no Pagamento',
        description: error.message || 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// HOOKS PARA RELATÓRIOS
// ============================================================================

/**
 * Hook para buscar relatórios financeiros.
 */
export const useGetFinancialReports = (filters: ReportFilters) => {
  return useQuery({
    queryKey: [...financialReportsQueryKey, filters],
    queryFn: () => apiClient.getFinancialReports(
      filters.startDate, 
      filters.endDate, 
      filters.reportType
    ),
    enabled: !!(filters.startDate && filters.endDate),
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  })
}

/**
 * Hook para exportar acordos financeiros.
 */
export const useExportFinancialAgreements = () => {
  const { toast } = useToast()

  return useMutation<Blob, Error, { format: 'excel' | 'csv'; filters: any }>({
    mutationFn: ({ format, filters }) =>
      apiClient.exportFinancialAgreements(format, filters),
    onSuccess: (blob, variables) => {
      // Cria download automático do arquivo
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `acordos_financeiros_${new Date().toISOString().split('T')[0]}.${
        variables.format === 'excel' ? 'xlsx' : 'csv'
      }`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação Concluída!',
        description: `Arquivo ${variables.format.toUpperCase()} baixado com sucesso.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro na Exportação',
        description: error.message || 'Não foi possível exportar os dados.',
        variant: 'destructive',
      })
    },
  })
}

// ============================================================================
// HOOKS PARA ESTATÍSTICAS E MÉTRICAS
// ============================================================================

/**
 * Hook para buscar estatísticas financeiras gerais.
 */
export const useGetFinancialStats = () => {
  return useQuery({
    queryKey: ['financialStats'],
    queryFn: () => apiClient.getFinancialStats?.() || Promise.resolve(null),
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  })
}

/**
 * Hook para buscar acordos em atraso.
 */
export const useGetOverdueAgreements = () => {
  return useQuery<FinancialAgreement[], Error>({
    queryKey: ['overdueAgreements'],
    queryFn: () => apiClient.getOverdueAgreements?.() || Promise.resolve([]),
    staleTime: 1000 * 60 * 2, // Cache de 2 minutos
    refetchInterval: 1000 * 60 * 5, // Atualiza automaticamente a cada 5 minutos
  })
}

// ============================================================================
// HOOKS UTILITÁRIOS
// ============================================================================

/**
 * Hook para invalidar todas as queries relacionadas a financeiro.
 * Útil para refresh geral da aplicação.
 */
export const useRefreshFinancialData = () => {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ 
      queryKey: financialAgreementsQueryKey,
      exact: false 
    })
    queryClient.invalidateQueries({ 
      queryKey: financialReportsQueryKey,
      exact: false 
    })
    queryClient.invalidateQueries({ 
      queryKey: agreementInstallmentsQueryKey,
      exact: false 
    })
    queryClient.invalidateQueries({ 
      queryKey: agreementPaymentHistoryQueryKey,
      exact: false 
    })
    queryClient.invalidateQueries({ queryKey: ['financialStats'] })
    queryClient.invalidateQueries({ queryKey: ['overdueAgreements'] })
  }
}

/**
 * Hook para pré-carregar dados de acordo específico.
 * Útil para melhorar a experiência do usuário.
 */
export const usePrefetchAgreementDetails = () => {
  const queryClient = useQueryClient()

  return (agreementId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['financialAgreementDetails', agreementId],
      queryFn: () => apiClient.getFinancialAgreementDetails(agreementId),
      staleTime: 1000 * 60 * 2,
    })
  }
}