// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/hooks/use-financials.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client' // Agora esta importação funcionará perfeitamente.
import { EnhancedAgreement } from '@/lib/schemas'
import { useToast } from '@/hooks/use-toast'

// ... (todo o resto do arquivo permanece o mesmo)
// ============================================================================
// QUERY KEYS
// Centralizar as chaves de query evita erros de digitação e facilita a manutenção.
// ============================================================================
const financialQueryKeys = {
  all: ['financial'] as const,
  agreements: (filters: { page?: number; pageSize?: number } = {}) =>
    [...financialQueryKeys.all, 'agreements', filters] as const,
  agreement: (id: string) =>
    [...financialQueryKeys.all, 'agreement', id] as const,
}

// ============================================================================
// FUNÇÕES DE API
// Funções que interagem diretamente com o nosso apiClient.
// ============================================================================

const fetchFinancialAgreements = async (page = 1, pageSize = 10) => {
  const response = await apiClient.get('/financial-agreements', {
    params: { page, pageSize },
  })
  return response.data
}

const fetchAgreementDetails = async (id: string) => {
  if (!id) return null
  const response = await apiClient.get(`/financial-agreements/${id}`)
  return response.data
}

const createFinancialAgreement = async (
  agreementData: EnhancedAgreement,
): Promise<EnhancedAgreement> => {
  const response = await apiClient.post(
    '/financial-agreements',
    agreementData,
  )
  return response.data
}

const updateFinancialAgreement = async ({
  id,
  updates,
}: {
  id: string
  updates: Partial<EnhancedAgreement>
}): Promise<EnhancedAgreement> => {
  const response = await apiClient.patch(
    `/financial-agreements/${id}`,
    updates,
  )
  return response.data
}

const deleteFinancialAgreement = async (id: string): Promise<void> => {
  await apiClient.delete(`/financial-agreements/${id}`)
}

// ============================================================================
// HOOKS CUSTOMIZADOS (useQuery, useMutation)
// ============================================================================

/**
 * Hook para buscar la lista paginada de acordos financeiros.
 */
export const useGetFinancialAgreements = (page = 1, pageSize = 10) => {
  return useQuery({
    queryKey: financialQueryKeys.agreements({ page, pageSize }),
    queryFn: () => fetchFinancialAgreements(page, pageSize),
    placeholderData: (previousData) => previousData, // Mantém os dados antigos enquanto busca novos
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

/**
 * Hook para buscar os detalhes completos de um único acordo financeiro.
 * @param id O ID do acordo. O hook será desabilitado se o ID for nulo.
 */
export const useGetFinancialAgreementDetails = (id: string | null) => {
  return useQuery({
    queryKey: financialQueryKeys.agreement(id!),
    queryFn: () => fetchAgreementDetails(id!),
    enabled: !!id, // A query só será executada se o 'id' existir
    staleTime: 1000 * 60 * 10, // 10 minutos
  })
}

/**
 * Hook para criar um novo acordo financeiro.
 * Invalida a lista de acordos após a criação para atualizar a UI.
 */
export const useCreateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: createFinancialAgreement,
    onSuccess: (newAgreement) => {
      toast({
        title: 'Sucesso!',
        description: 'Novo acordo financeiro criado.',
        variant: 'default',
      })
      // Invalida a query da lista para forçar a atualização
      queryClient.invalidateQueries({
        queryKey: financialQueryKeys.agreements(),
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Criar Acordo',
        description:
          error.response?.data?.message ||
          'Não foi possível criar o acordo. Tente novamente.',
        variant: 'destructive',
      })
    },
  })
}

/**
 * Hook para atualizar um acordo financeiro existente.
 * Invalida tanto a lista de acordos quanto os detalhes do acordo específico.
 */
export const useUpdateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: updateFinancialAgreement,
    onSuccess: (updatedAgreement) => {
      toast({
        title: 'Sucesso!',
        description: 'Acordo atualizado com sucesso.',
      })
      // Invalida a lista
      queryClient.invalidateQueries({
        queryKey: financialQueryKeys.agreements(),
      })
      // Atualiza o cache dos detalhes deste acordo específico com os novos dados
      queryClient.setQueryData(
        financialQueryKeys.agreement(updatedAgreement.id!),
        updatedAgreement,
      )
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Atualizar',
        description:
          error.response?.data?.message || 'Não foi possível atualizar o acordo.',
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

  return useMutation({
    mutationFn: deleteFinancialAgreement,
    onSuccess: (_, id) => {
      toast({
        title: 'Sucesso!',
        description: 'Acordo deletado com sucesso.',
      })
      queryClient.invalidateQueries({
        queryKey: financialQueryKeys.agreements(),
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao Deletar',
        description:
          error.response?.data?.message || 'Não foi possível deletar o acordo.',
        variant: 'destructive',
      })
    },
  })
}