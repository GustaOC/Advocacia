// lib/types.ts

import { z } from 'zod';
import { EnhancedAgreementSchema, InstallmentSchema, PaymentSchema } from './schemas';

// Interface unificada para Entidades (Clientes, Executados, etc.)
export interface Entity {
  id: string;
  name: string;
  document: string; // CPF/CNPJ
  type: 'Cliente' | 'Executado' | string;

  // Informações de Contato
  email?: string | null;
  cellphone1?: string | null;
  cellphone2?: string | null;
  phone?: string | null;

  // Endereço
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;

  // Informações Pessoais
  birth_date?: string | null;
  marital_status?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável' | null;
  profession?: string | null;
  nationality?: string | null;

  // Documentos Adicionais
  rg?: string | null;
  cnh?: string | null;

  // Filiação
  mother_name?: string | null;
  father_name?: string | null;

  // Outros
  observations?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Interface para as Partes de um Processo
export interface CaseParty {
  role: 'Cliente' | 'Executado' | 'Advogado' | string;
  entities: {
    id: number;
    name: string;
  };
}

// Interface para Processos, alinhada com a API e o frontend
export interface Case {
  id: number;
  case_number: string | null;
  title: string;
  status: 'Em andamento' | 'Acordo' | 'Extinto' | 'Pago' | string;
  priority: 'Alta' | 'Média' | 'Baixa';
  value: number | null;
  court?: string | null;
  description?: string | null;
  created_at: string;
  case_parties: CaseParty[];

  // Campos de Acordo (se aplicável)
  agreement_type?: 'Judicial' | 'Extrajudicial' | 'Em Audiência' | 'Pela Loja' | null;
  agreement_value?: number | null;
  installments?: number | null;
  down_payment?: number | null;
  installment_due_date?: string | null;
}

// --- TIPOS CORRIGIDOS PARA O BUILD ---

// Tipo para um único pagamento, inferido do schema
export type Payment = z.infer<typeof PaymentSchema>;

// Tipo para uma única parcela que INCLUI seus pagamentos.
// ***** CORREÇÃO: Este tipo agora pode ser simplificado, mas o mantemos para consistência se for usado em outros lugares. *****
export type InstallmentWithPayments = z.infer<typeof InstallmentSchema> & {
  payments?: Payment[];
};

// Tipo principal para o Acordo Financeiro.
// ***** CORREÇÃO: Removida a propriedade 'installments' duplicada. *****
// O tipo agora é inferido corretamente do EnhancedAgreementSchema.
export type FinancialAgreement = z.infer<typeof EnhancedAgreementSchema> & {
  debtor?: { id: string; name: string };
  creditor?: { id: string; name: string };
  cases?: { id: string; case_number: string };
};