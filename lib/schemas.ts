// lib/schemas.ts 
import { z } from "zod";

// =================================
// ENTITY SCHEMAS
// =================================

export const EntitySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(255),
  document: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido.").optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  address_number: z.string().max(20).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  zip_code: z.string().max(20).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  phone2: z.string().max(20).optional().nullable(),
  type: z.string().min(1, "O tipo é obrigatório."),
});

export const EntityUpdateSchema = EntitySchema.partial();

// =================================
// CASE SCHEMAS
// =================================

export const CaseSchema = z.object({
  case_number: z.string().max(100).optional().nullable(),
  title: z.string().min(3, "O título (Observação) é obrigatório.").max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['Em andamento', 'Acordo', 'Extinto', 'Pago']).default('Em andamento'),
  status_reason: z.string().optional().nullable(),
  court: z.string().max(255).optional().nullable(),
  priority: z.enum(['Alta', 'Média', 'Baixa']).default('Média'),
  // A COLUNA 'value' FOI REMOVIDA PARA CORRESPONDER AO SEU BANCO DE DADOS
  // value: z.number().optional().nullable(), 
  client_entity_id: z.number({ required_error: "Você deve selecionar um cliente." }).int().positive(),
  executed_entity_id: z.number({ required_error: "Você deve selecionar um executado." }).int().positive(),
  payment_date: z.string().optional().nullable(),
  final_value: z.number().optional().nullable(),
  
  // Campos para Acordo (opcionais e sem validação estrita aqui)
  agreement_type: z.enum(['Judicial', 'Extrajudicial', 'Em Audiência', 'Pela Loja']).optional().nullable(),
  agreement_value: z.number().optional().nullable(),
  installments: z.number().int().optional().nullable(),
  down_payment: z.number().optional().nullable(),
  installment_due_date: z.string().optional().nullable(),
});

export const CaseUpdateSchema = CaseSchema.partial().omit({
  client_entity_id: true,
  executed_entity_id: true
});

// =================================
// AGREEMENT SCHEMAS
// =================================

export const AgreementSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  client_entity_id: z.number().int().positive("O ID da entidade cliente é obrigatório."),
  agreement_type: z.string().min(1, "O tipo de acordo é obrigatório."),
  // VALIDAÇÃO POSITIVA APLICADA CORRETAMENTE AQUI
  total_value: z.number().positive("O valor do acordo deve ser positivo."),
  entry_value: z.number().min(0).default(0),
  installments: z.number().int().min(1, "O número de parcelas deve ser positivo.").default(1),
  status: z.enum(['active', 'completed', 'cancelled', 'defaulted']).default('active'),
  notes: z.string().optional().nullable(),
});

export const AgreementUpdateSchema = AgreementSchema.partial();

// =================================
// PETITION SCHEMAS
// =================================

export const PetitionSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  title: z.string().min(3, "O título é obrigatório.").max(255),
  description: z.string().optional().nullable(),
  file_path: z.string().min(1, "O caminho do arquivo é obrigatório."),
  deadline: z.string().optional().nullable(),
  status: z.enum(['pending', 'under_review', 'approved', 'corrections_needed', 'rejected']).default('pending'),
  created_by_employee_id: z.string().uuid("ID do criador inválido."),
  assigned_to_employee_id: z.string().uuid("ID do responsável inválido."),
});

export const PetitionUpdateSchema = z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    status: z.enum(['pending', 'under_review', 'approved', 'corrections_needed', 'rejected']).optional(),
    assigned_to_employee_id: z.string().uuid().optional(),
});

// =================================
// DOCUMENT SCHEMAS
// =================================

export const DocumentSchema = z.object({
  case_id: z.number().int().positive(),
  employee_id: z.string().uuid(),
  file_name: z.string().min(1, "O nome do arquivo é obrigatório."),
  file_path: z.string().min(1, "O caminho do arquivo é obrigatório."),
  file_type: z.string().optional().nullable(),
  file_size: z.number().int().positive().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const DocumentUploadSchema = z.object({
  case_id: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("O ID do caso é obrigatório.")
  ),
  description: z.string().optional(),
});

// lib/schemas.ts - SCHEMA EXPANDIDO PARA ACORDOS FINANCEIROS

// =================================
// ENHANCED AGREEMENT SCHEMAS
// =================================

export const EnhancedAgreementSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  client_entity_id: z.number().int().positive("O ID da entidade cliente é obrigatório."),
  executed_entity_id: z.number().int().positive().optional().nullable(),
  agreement_type: z.enum(['Judicial', 'Extrajudicial', 'Em Audiência', 'Pela Loja'], {
    required_error: "O tipo de acordo é obrigatório."
  }),
  total_value: z.number().positive("O valor do acordo deve ser positivo."),
  entry_value: z.number().min(0, "O valor de entrada não pode ser negativo.").default(0),
  installments: z.number().int().min(1, "O número de parcelas deve ser pelo menos 1.").max(120, "Máximo de 120 parcelas."),
  installment_value: z.number().positive("O valor da parcela deve ser positivo."),
  first_due_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de vencimento inválida."),
  installment_interval: z.enum(['monthly', 'biweekly', 'weekly', 'custom']).default('monthly'),
  status: z.enum(['active', 'completed', 'cancelled', 'defaulted', 'renegotiated']).default('active'),
  
  // Informações de alvará judicial
  has_court_release: z.boolean().default(false),
  court_release_value: z.number().positive().optional().nullable(),
  court_release_received: z.boolean().default(false),
  
  // Informações de pagamento
  payment_method: z.enum(['bank_transfer', 'pix', 'check', 'cash', 'credit_card', 'debit_card']).default('pix'),
  bank_account_info: z.string().max(500).optional().nullable(),
  
  // Garantias e taxas
  guarantor_entity_id: z.number().int().positive().optional().nullable(),
  late_payment_fee: z.number().min(0).max(100).default(2), // % de multa por atraso
  late_payment_daily_interest: z.number().min(0).max(1).default(0.033), // % ao dia de juros de mora
  
  // Dados contratuais
  contract_signed_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de assinatura inválida.").optional().nullable(),
  renegotiation_count: z.number().int().min(0).default(0),
  
  notes: z.string().max(1000).optional().nullable(),
});

export const EnhancedAgreementUpdateSchema = EnhancedAgreementSchema.partial();

// Schema para criação rápida de acordo (campos mínimos)
export const QuickAgreementSchema = z.object({
  case_id: z.number().int().positive(),
  client_entity_id: z.number().int().positive(),
  agreement_type: z.enum(['Judicial', 'Extrajudicial', 'Em Audiência', 'Pela Loja']),
  total_value: z.number().positive(),
  entry_value: z.number().min(0).default(0),
  installments: z.number().int().min(1).max(120),
  first_due_date: z.string(),
  has_court_release: z.boolean().default(false),
  court_release_value: z.number().positive().optional().nullable(),
  payment_method: z.enum(['bank_transfer', 'pix', 'check', 'cash', 'credit_card', 'debit_card']).default('pix'),
}).transform((data) => ({
  ...data,
  installment_value: data.entry_value > 0 
    ? (data.total_value - data.entry_value) / data.installments
    : data.total_value / data.installments,
  installment_interval: 'monthly' as const,
  status: 'active' as const,
  late_payment_fee: 2,
  late_payment_daily_interest: 0.033,
  renegotiation_count: 0,
  court_release_received: false,
}));

// Schema para renegociação de acordo
export const RenegotiationSchema = z.object({
  new_total_value: z.number().positive("O novo valor deve ser positivo.").optional(),
  new_installments: z.number().int().min(1).max(120).optional(),
  new_first_due_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Nova data de vencimento inválida."),
  new_entry_value: z.number().min(0).default(0).optional(),
  renegotiation_reason: z.string().min(10, "Motivo da renegociação deve ter pelo menos 10 caracteres.").max(500),
  discount_applied: z.number().min(0).max(100).default(0), // % de desconto aplicado
  additional_fees: z.number().min(0).default(0), // Taxas adicionais
}).transform((data) => ({
  ...data,
  new_installment_value: data.new_total_value && data.new_installments
    ? (data.new_entry_value || 0) > 0 
      ? (data.new_total_value - (data.new_entry_value || 0)) / data.new_installments
      : data.new_total_value / data.new_installments
    : undefined,
}));