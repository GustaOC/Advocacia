// lib/form-utils.ts
// Utilitários para máscaras e validações de formulários

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function maskCPF(value: string): string {
  const numbers = value.replace(/\D/g, "")
  
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 6) {
    return numbers.replace(/(\d{3})(\d{0,3})/, "$1.$2")
  } else if (numbers.length <= 9) {
    return numbers.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3")
  } else {
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4").slice(0, 14)
  }
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 */
export function maskCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "")
  
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 5) {
    return numbers.replace(/(\d{2})(\d{0,3})/, "$1.$2")
  } else if (numbers.length <= 8) {
    return numbers.replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3")
  } else if (numbers.length <= 12) {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4")
  } else {
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5").slice(0, 18)
  }
}

/**
 * Aplica máscara de CPF ou CNPJ automaticamente
 */
export function maskCPFCNPJ(value: string): string {
  const numbers = value.replace(/\D/g, "")
  
  if (numbers.length <= 11) {
    return maskCPF(value)
  } else {
    return maskCNPJ(value)
  }
}

/**
 * Aplica máscara de telefone: (00) 0000-0000 ou (00) 00000-0000
 */
export function maskPhone(value: string): string {
  const numbers = value.replace(/\D/g, "")
  
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : ""
  } else if (numbers.length <= 6) {
    return numbers.replace(/(\d{2})(\d{0,4})/, "($1) $2")
  } else if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  } else {
    // Celular com 9 dígitos
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").slice(0, 15)
  }
}

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = cpf.replace(/\D/g, "")
  
  if (numbers.length !== 11) return false
  if (/^(\d)\1{10}$/.test(numbers)) return false
  
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i)
  }
  let digit = ((sum * 10) % 11) % 10
  if (digit !== parseInt(numbers[9])) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i)
  }
  digit = ((sum * 10) % 11) % 10
  if (digit !== parseInt(numbers[10])) return false
  
  return true
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const numbers = cnpj.replace(/\D/g, "")
  
  if (numbers.length !== 14) return false
  if (/^(\d)\1{13}$/.test(numbers)) return false
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i]
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(numbers[12])) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i]
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (digit !== parseInt(numbers[13])) return false
  
  return true
}

/**
 * Valida CPF ou CNPJ
 */
export function isValidCPFCNPJ(value: string): boolean {
  const numbers = value.replace(/\D/g, "")
  
  if (numbers.length === 11) {
    return isValidCPF(value)
  } else if (numbers.length === 14) {
    return isValidCNPJ(value)
  }
  
  return false
}

/**
 * Valida telefone (10 ou 11 dígitos)
 */
export function isValidPhone(phone: string): boolean {
  const numbers = phone.replace(/\D/g, "")
  return numbers.length === 10 || numbers.length === 11
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Remove máscara e retorna apenas números
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, "")
}

/**
 * Formata nome próprio (primeira letra maiúscula)
 */
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Palavras que devem ficar em minúsculo
      const lowercaseWords = ['de', 'da', 'do', 'dos', 'das', 'e']
      if (lowercaseWords.includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Hook React para usar máscaras em inputs
 */
export function useMask(type: 'cpf' | 'cnpj' | 'cpfcnpj' | 'phone') {
  const maskFunctions = {
    cpf: maskCPF,
    cnpj: maskCNPJ,
    cpfcnpj: maskCPFCNPJ,
    phone: maskPhone,
  }

  const validationFunctions = {
    cpf: isValidCPF,
    cnpj: isValidCNPJ,
    cpfcnpj: isValidCPFCNPJ,
    phone: isValidPhone,
  }

  return {
    mask: maskFunctions[type],
    validate: validationFunctions[type],
    unmask,
  }
}
