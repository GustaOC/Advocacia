// lib/form-utils.ts
// Central de utilitários para máscaras, validações e formatações de formulários.

/**
 * Aplica máscara de CPF: 000.000.000-00
 * @param value A string a ser formatada.
 */
export function maskCPF(value: string): string {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .substring(0, 14);
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * @param value A string a ser formatada.
 */
export function maskCNPJ(value: string): string {
  if (!value) return "";
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
}

/**
 * Aplica máscara de CPF ou CNPJ dinamicamente com base no comprimento.
 * @param value A string a ser formatada.
 */
export function maskCPFCNPJ(value: string): string {
  if (!value) return "";
  const numbersOnly = value.replace(/\D/g, "");
  if (numbersOnly.length <= 11) {
    return maskCPF(numbersOnly);
  }
  return maskCNPJ(numbersOnly);
}

/**
 * Aplica máscara de telefone: (00) 0000-0000 ou (00) 00000-0000
 * @param value A string a ser formatada.
 */
export function maskPhone(value: string): string {
  if (!value) return "";
  const numbersOnly = value.replace(/\D/g, "");
  if (numbersOnly.length <= 10) {
    return numbersOnly
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbersOnly
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .substring(0, 15);
}

/**
 * Remove qualquer formatação, retornando apenas os números de uma string.
 * @param value A string a ser limpa.
 */
export function unmask(value: string): string {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

/**
 * Valida um CPF.
 * @param cpf O CPF a ser validado (com ou sem máscara).
 */
export function isValidCPF(cpf: string): boolean {
  const numbers = unmask(cpf);
  if (numbers.length !== 11 || /^(\d)\1{10}$/.test(numbers)) {
    return false;
  }
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(numbers.substring(9, 10))) {
    return false;
  }
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(numbers.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) {
    remainder = 0;
  }
  if (remainder !== parseInt(numbers.substring(10, 11))) {
    return false;
  }
  return true;
}

/**
 * Formata um nome para o formato "Title Case", tratando preposições comuns.
 * Ex: "joão da silva" -> "João da Silva"
 * @param name O nome completo a ser formatado.
 */
export function formatName(name: string): string {
  if (!name) return "";
  const lowercaseWords = ['de', 'da', 'do', 'dos', 'das', 'e'];
  return name
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (lowercaseWords.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}