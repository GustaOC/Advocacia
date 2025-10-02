// lib/utils.ts 
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Função para detectar ambiente v0.dev
export function isV0DevEnvironment(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.hostname.includes('v0') || 
         window.location.hostname.includes('vercel.app') ||
         process.env.NODE_ENV === 'development'
}

// Função para salvar token de desenvolvimento (somente para v0.dev)
export function saveAuthTokenDev(token: string): void {
  if (typeof window === 'undefined') return
  
  try {
    // Salva no sessionStorage para simular autenticação no v0.dev
    sessionStorage.setItem('dev-auth-token', token)
    
    // Também define um cookie simples para o middleware
    document.cookie = `sb-auth-token-client=authenticated; path=/; max-age=604800`
    
    console.log('[Utils] Dev auth token saved successfully')
  } catch (error) {
    console.warn('[Utils] Failed to save dev auth token:', error)
  }
}

// Função para obter token de desenvolvimento
export function getAuthTokenDev(): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    return sessionStorage.getItem('dev-auth-token')
  } catch (error) {
    console.warn('[Utils] Failed to get dev auth token:', error)
    return null
  }
}

// Função para limpar token de desenvolvimento
export function clearAuthTokenDev(): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.removeItem('dev-auth-token')
    document.cookie = 'sb-auth-token-client=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    console.log('[Utils] Dev auth token cleared')
  } catch (error) {
    console.warn('[Utils] Failed to clear dev auth token:', error)
  }
}

// Função para formatar dados de formulário
export function formatFormData(data: Record<string, any>): Record<string, any> {
  const formatted: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      formatted[key] = value
    }
  }
  
  return formatted
}

// Função para sanitizar strings
export function sanitizeString(str: string): string {
  if (!str) return ''
  return str.trim().replace(/[<>]/g, '')
}

// Função para validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para debug de cookies
export function debugCookies(): void {
  if (typeof window === 'undefined') return
  
  console.log('[Utils] Current cookies:', {
    all: document.cookie,
    authCookies: document.cookie
      .split('; ')
      .filter(cookie => cookie.includes('sb-') || cookie.includes('auth'))
  })
}

// --- FUNÇÕES ADICIONADAS PARA CORRIGIR O ERRO DE BUILD ---

/**
 * Formata uma string de data ou objeto Date para o formato "dd/mm/aaaa".
 * @param dateString A data a ser formatada.
 * @returns A data formatada ou 'N/A' se a data for inválida.
 */
export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) {
    return 'N/A';
  }
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC', // Adicionado para consistência
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return 'Data inválida';
  }
}

/**
 * Formata um número como moeda brasileira (BRL).
 * @param amount O valor a ser formatado.
 * @returns O valor formatado como string, ex: "R$ 1.234,56".
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}