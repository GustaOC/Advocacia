// hooks/use-financials.ts - VERSÃO CORRIGIDA

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from './use-toast'

// ✅ A ÚNICA ALTERAÇÃO NECESSÁRIA ESTÁ AQUI:
import { apiClient, FinancialAgreement } from '@/lib/api-client' // Adicionando chaves {} e importando o tipo

// Chave de query para os acordos financeiros, usada para cache e invalidação.
const financialAgreementsQueryKey = ['financialAgreements']

/**
 * Hook para buscar a lista de acordos financeiros.
 * Gerencia o estado de carregamento, erro e os dados retornados.
 */
export const useGetFinancialAgreements = () => {
  return useQuery<FinancialAgreement[], Error>({
    queryKey: financialAgreementsQueryKey,
    queryFn: () => apiClient.getFinancialAgreements(),
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  })
}

/**
 * Hook para buscar os detalhes de um único acordo financeiro.
 * @param agreementId - O ID do acordo a ser buscado.
 */
export const useGetFinancialAgreementDetails = (agreementId: string | null) => {
  return useQuery<FinancialAgreement | null, Error>({
    queryKey: ['financialAgreementDetails', agreementId],
    queryFn: () =>
      agreementId ? apiClient.getFinancialAgreementDetails(agreementId) : null,
    enabled: !!agreementId, // A query só será executada se agreementId não for nulo.
  })
}

/**
 * Hook para criar um novo acordo financeiro.
 * Fornece o estado da mutação e funções para executar a criação.
 */
export const useCreateFinancialAgreement = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation<FinancialAgreement, Error, any>({
    mutationFn: (newAgreementData) =>
      apiClient.createFinancialAgreement(newAgreementData),
    onSuccess: () => {
      // Invalida o cache da lista de acordos para que a nova lista seja buscada.
      queryClient.invalidateQueries({ queryKey: financialAgreementsQueryKey })
      toast({
        title: 'Sucesso!',
        description: 'O acordo financeiro foi criado com sucesso.',
        variant: 'success',
      })
    },
    onError: (error) => {
      // Exibe uma notificação de erro para o usuário.
      toast({
        title: 'Erro ao Criar Acordo',
        description:
          error.message || 'Não foi possível criar o acordo financeiro.',
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financialAgreementsQueryKey })
      queryClient.invalidateQueries({
        queryKey: ['financialAgreementDetails', variables.id],
      })
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi atualizado com sucesso.',
        variant: 'success',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialAgreementsQueryKey })
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi deletado com sucesso.',
        variant: 'success',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialAgreementsQueryKey })
      toast({
        title: 'Sucesso!',
        description: 'O acordo foi renegociado com sucesso.',
        variant: 'success',
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
      // Invalida a query do acordo específico para atualizar os detalhes (parcelas e pagamentos)
      queryClient.invalidateQueries({
        queryKey: ['financialAgreementDetails', variables.agreementId],
      })
      // Também invalida a lista geral, caso o status do acordo mude
      queryClient.invalidateQueries({ queryKey: financialAgreementsQueryKey })
      toast({
        title: 'Pagamento Registrado!',
        description: 'O pagamento foi registrado com sucesso.',
        variant: 'success',
      })
    },
    onError: (error) => {
      toast({
        title: 'Erro no Pagamento',
        description:
          error.message || 'Não foi possível registrar o pagamento.',
        variant: 'destructive',
      })
    },
  })
}