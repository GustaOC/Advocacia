// lib/types.ts

import { z } from 'zod';
import { EnhancedAgreementSchema, InstallmentSchema, PaymentSchema } from './schemas';

// Interface unificada para Entidades (Clientes, Executados, etc.)
// Adicionamos os novos campos sugeridos para um cadastro mais completo.
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
  state?: string | null; // Adicionado
  zip_code?: string | null;

  // Informações Pessoais (campos novos)
  birth_date?: string | null;
  marital_status?: 'Solteiro(a)' | 'Casado(a)' | 'Divorciado(a)' | 'Viúvo(a)' | 'União Estável' | null;
  profession?: string | null;
  nationality?: string | null;

  // Documentos Adicionais (campos novos)
  rg?: string | null;
  cnh?: string | null;

  // Filiação (campos novos)
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

// --- TIPOS ADICIONADOS PARA CORRIGIR O ERRO DE BUILD ---

// Tipo para um único pagamento, inferido do schema
export type Payment = z.infer<typeof PaymentSchema>;

// Tipo para uma única parcela que INCLUI seus pagamentos
export type InstallmentWithPayments = z.infer<typeof InstallmentSchema> & {
  payments?: Payment[];
};

// Tipo principal para o Acordo Financeiro, que INCLUI parcelas com seus pagamentos
// e os detalhes do devedor, credor e caso.
export type FinancialAgreement = z.infer<typeof EnhancedAgreementSchema> & {
  installments?: InstallmentWithPayments[]; // Esta linha já estava aqui, o que é bom.
  debtor?: { id: string; name: string };
  creditor?: { id: string; name: string };
  cases?: { id: string; case_number: string };
};