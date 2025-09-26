import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS (Entidades, Casos, etc.)
// ============================================================================

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

export const CaseSchema = z.object({
  case_number: z.string().max(100).optional().nullable(),
  title: z.string().min(3, "O título (Observação) é obrigatório.").max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['Em andamento', 'Acordo', 'Extinto', 'Pago']).default('Em andamento'),
  status_reason: z.string().optional().nullable(),
  court: z.string().max(255).optional().nullable(),
  priority: z.enum(['Alta', 'Média', 'Baixa']).default('Média'),
  client_entity_id: z.number({ required_error: "Você deve selecionar um cliente." }).int().positive(),
  executed_entity_id: z.number({ required_error: "Você deve selecionar um executado." }).int().positive(),
  payment_date: z.string().optional().nullable(),
  final_value: z.number().optional().nullable(),
  agreement_type: z.enum(['Judicial', 'Extrajudicial', 'Em Audiência', 'Pela Loja']).optional().nullable(),
  agreement_value: z.number().optional().nullable(),
  installments: z.number().int().optional().nullable(),
  down_payment: z.number().optional().nullable(),
  installment_due_date: z.string().optional().nullable(),
});

// ============================================================================
// FINANCIAL SCHEMAS (O CORAÇÃO DA NOSSA ATUALIZAÇÃO)
// ============================================================================

/**
 * Define a estrutura de uma única parcela.
 * Essencial para validar pagamentos e calcular juros de forma isolada.
 */
export const InstallmentSchema = z.object({
  id: z.string().uuid().optional(), // ID da parcela no banco de dados
  agreement_id: z.number().int().positive(),
  installment_number: z.number().int().positive("O número da parcela deve ser um inteiro positivo."),
  value: z.number().positive("O valor da parcela deve ser maior que zero."),
  due_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de vencimento inválida."),
  status: z.enum(['PENDING', 'PAID', 'PARTIALLY_PAID', 'OVERDUE']).default('PENDING'),
  paid_value: z.number().min(0).default(0),
  payment_date: z.string().optional().nullable(),
});

/**
 * Schema para registrar um pagamento em uma parcela.
 */
export const PaymentSchema = z.object({
    installment_id: z.string().uuid("O ID da parcela é obrigatório."),
    agreement_id: z.number().int().positive("O ID do acordo é obrigatório."),
    paid_amount: z.number().positive("O valor pago deve ser maior que zero."),
    payment_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de pagamento inválida."),
    method: z.enum(['bank_transfer', 'pix', 'check', 'cash', 'credit_card', 'debit_card']),
    late_fees: z.number().min(0).default(0),
    interest: z.number().min(0).default(0),
    notes: z.string().optional().nullable(),
});

/**
 * Schema aprimorado para Acordos Financeiros.
 * Mantém todos os seus campos, mas com validações mais estritas.
 */
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
  
  has_court_release: z.boolean().default(false),
  court_release_value: z.number().positive("O valor do alvará deve ser positivo.").optional().nullable(),
  court_release_received: z.boolean().default(false),
  
  payment_method: z.enum(['bank_transfer', 'pix', 'check', 'cash', 'credit_card', 'debit_card']).default('pix'),
  bank_account_info: z.string().max(500).optional().nullable(),
  
  guarantor_entity_id: z.number().int().positive().optional().nullable(),
  late_payment_fee: z.number().min(0, "A multa não pode ser negativa.").max(100).default(2), // %
  late_payment_daily_interest: z.number().min(0, "O juro diário não pode ser negativo.").max(1).default(0.033), // %
  
  contract_signed_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Data de assinatura inválida.").optional().nullable(),
  renegotiation_count: z.number().int().min(0).default(0),
  
  notes: z.string().max(1000).optional().nullable(),
});

export const EnhancedAgreementUpdateSchema = EnhancedAgreementSchema.partial();


/**
 * Schema para renegociação de acordo.
 */
export const RenegotiationSchema = z.object({
  new_total_value: z.number().positive("O novo valor deve ser positivo.").optional(),
  new_installments: z.number().int().min(1).max(120).optional(),
  new_first_due_date: z.string().refine((date) => !isNaN(Date.parse(date)), "Nova data de vencimento inválida."),
  new_entry_value: z.number().min(0).default(0).optional(),
  renegotiation_reason: z.string().min(10, "Motivo da renegociação deve ter pelo menos 10 caracteres.").max(500),
  discount_applied: z.number().min(0).max(100).default(0), // %
  additional_fees: z.number().min(0).default(0), 
});


// ============================================================================
// OUTROS SCHEMAS (Documentos, Petições, etc.)
// ============================================================================

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

export const DocumentUploadSchema = z.object({
  case_id: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("O ID do caso é obrigatório.")
  ),
  description: z.string().optional(),
});