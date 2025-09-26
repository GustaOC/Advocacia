// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/lib/api-client.ts

import axios, { AxiosResponse, AxiosError } from 'axios'

/**
 * Instância centralizada do Axios para todas as chamadas de API da aplicação.
 * Configura a URL base e os cabeçalhos padrão.
 */
const apiClient = axios.create({
  baseURL: '/api', // Aponta para a pasta /api do Next.js
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Interceptor de Resposta do Axios.
 * Permite capturar e manipular respostas e erros de forma global.
 *
 * @param response - A resposta bem-sucedida, agora tipada com AxiosResponse.
 * @param error - O objeto de erro, agora tipado com AxiosError.
 * @returns A promessa resolvida ou rejeitada.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Retorna a resposta diretamente se for bem-sucedida.
    return response
  },
  (error: AxiosError) => {
    // Aqui você pode adicionar lógica global para tratamento de erros.
    // Exemplo: Se o erro for 401 (Não Autorizado), redirecionar para o login.
    if (error.response && error.response.status === 401) {
      // Em um cenário real, você poderia redirecionar o usuário:
      // window.location.href = '/login';
      console.error('Erro de autenticação. O usuário precisa fazer login.')
    }

    // Rejeita a promessa para que o erro possa ser tratado localmente
    // (por exemplo, no `onError` do useMutation em nossos hooks).
    return Promise.reject(error)
  },
)

// Exporta a instância como padrão para facilitar a importação.
export default apiClient