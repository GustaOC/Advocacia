// gustioc/advocacia/Advocacia-d92d5295fd1f928d4587d3584d317470ec35dac5/lib/schemas.ts

import { z } from 'zod'

// ============================================================================
// ENUMS E TIPOS FINANCEIROS CENTRALIZADOS
// Usar enums garante consistência e previne erros de digitação em todo o sistema.
// ============================================================================

export const AgreementStatus = z.enum([
  'ATIVO',
  'INADIMPLENTE',
  'PAUSADO',
  'CONCLUIDO',
  'CANCELADO',
])
export type AgreementStatusType = z.infer<typeof AgreementStatus>

export const InstallmentStatus = z.enum([
  'PENDENTE',
  'PAGA',
  'ATRASADA',
  'RENEGOCIADA',
  'CANCELADA',
])
export type InstallmentStatusType = z.infer<typeof InstallmentStatus>

export const AgreementType = z.enum([
  'ENTRADA_PARCELADO',
  'SOMENTE_PARCELADO',
  'A_VISTA',
])
export type AgreementTypeType = z.infer<typeof AgreementType>

export const PaymentMethod = z.enum([
  'BOLETO',
  'CARTAO_CREDITO',
  'DEBITO',
  'PIX',
  'TRANSFERENCIA',
  'DINHEIRO',
])
export type PaymentMethodType = z.infer<typeof PaymentMethod>

// ============================================================================
// SCHEMAS FINANCEIROS
// Schemas robustos com coerção de tipos, validações detalhadas e mensagens de erro em português.
// ============================================================================

/**
 * Schema para uma única parcela de um acordo financeiro.
 */
export const InstallmentSchema = z.object({
  id: z.string().optional(),
  agreement_id: z.string().optional(),
  installment_number: z.coerce
    .number({
      required_error: 'O número da parcela é obrigatório.',
      invalid_type_error: 'O número da parcela deve ser um número.',
    })
    .int()
    .positive('O número da parcela deve ser positivo.'),
  amount: z.coerce
    .number({
      required_error: 'O valor da parcela é obrigatório.',
      invalid_type_error: 'O valor da parcela deve ser um número.',
    })
    .positive('O valor da parcela deve ser maior que zero.'),
  due_date: z.coerce.date({
    required_error: 'A data de vencimento é obrigatória.',
    invalid_type_error: 'Forneça uma data de vencimento válida.',
  }),
  // ***** CORREÇÃO APLICADA AQUI *****
  status: InstallmentStatus.default('PENDENTE').optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})
export type Installment = z.infer<typeof InstallmentSchema>

/**
 * Schema principal para Acordos Financeiros.
 * Inclui validações complexas entre campos.
 */
export const EnhancedAgreementSchema = z
  .object({
    id: z.string().optional(),
    case_id: z.string({ required_error: 'O processo é obrigatório.' }),
    debtor_id: z.string({ required_error: 'O devedor é obrigatório.' }),
    creditor_id: z.string({ required_error: 'O credor é obrigatório.' }),
    total_amount: z.coerce
      .number({
        required_error: 'O valor total é obrigatório.',
        invalid_type_error: 'O valor total deve ser um número.',
      })
      .positive('O valor total do acordo deve ser maior que zero.'),
    down_payment: z.coerce
      .number({ invalid_type_error: 'O valor da entrada deve ser um número.' })
      .min(0, 'O valor da entrada não pode ser negativo.')
      .default(0)
      .optional(),
    number_of_installments: z.coerce
      .number({
        required_error: 'O número de parcelas é obrigatório.',
        invalid_type_error: 'O número de parcelas deve ser um número.',
      })
      .int()
      .min(1, 'O acordo deve ter pelo menos uma parcela.'),
    start_date: z.coerce.date({
      required_error: 'A data de início é obrigatória.',
      invalid_type_error: 'Forneça uma data de início válida.',
    }),
    end_date: z.coerce.date({
      required_error: 'A data final é obrigatória.',
      invalid_type_error: 'Forneça uma data final válida.',
    }),
    status: AgreementStatus.default('ATIVO').optional(),
    agreement_type: AgreementType.default('SOMENTE_PARCELADO').optional(),
    notes: z.string().optional().nullable(),
    installments: z.array(InstallmentSchema).optional(),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: 'A data final deve ser posterior à data de início.',
    path: ['end_date'],
  })
  .refine(
    (data) => (data.down_payment ?? 0) <= data.total_amount,
    {
      message: 'O valor da entrada não pode ser maior que o valor total.',
      path: ['down_payment'],
    },
  )
  .superRefine((data, ctx) => {
    // CORREÇÃO APLICADA AQUI:
    // Adicionada uma verificação explícita para a existência da primeira parcela
    // para satisfazer a análise estrita de tipos do TypeScript.
    if (data.installments && data.installments.length > 0) {
      const firstInstallment = data.installments[0]
      if (firstInstallment && firstInstallment.due_date < data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'A data da primeira parcela não pode ser anterior ao início do acordo.',
          path: ['installments', 0, 'due_date'],
        })
      }
    }
  })
export type EnhancedAgreement = z.infer<typeof EnhancedAgreementSchema>

/**
 * Schema para registro de pagamento de uma parcela.
 */
export const PaymentSchema = z.object({
  id: z.string().optional(),
  installment_id: z.string({
    required_error: 'A identificação da parcela é obrigatória.',
  }),
  amount_paid: z.coerce
    .number({
      required_error: 'O valor pago é obrigatório.',
      invalid_type_error: 'O valor pago deve ser um número.',
    })
    .positive('O valor pago deve ser maior que zero.'),
  payment_date: z.coerce.date({
    required_error: 'A data do pagamento é obrigatória.',
    invalid_type_error: 'Forneça uma data de pagamento válida.',
  }),
  payment_method: PaymentMethod,
  notes: z.string().optional().nullable(),
})
export type Payment = z.infer<typeof PaymentSchema>

/**
 * Schema para a renegociação de um acordo financeiro.
 */
export const RenegotiationSchema = z.object({
  agreement_id: z.string(),
  new_total_amount: z.coerce
    .number()
    .positive('O novo valor total deve ser positivo.'),
  new_number_of_installments: z.coerce
    .number()
    .int()
    .positive('O novo número de parcelas deve ser pelo menos 1.'),
  new_start_date: z.coerce.date(),
  reason: z.string().min(10, 'A justificativa é obrigatória.'),
})
export type Renegotiation = z.infer<typeof RenegotiationSchema>

/**
 * Schema para geração de relatórios financeiros.
 */
export const FinancialReportSchema = z
  .object({
    report_type: z.enum(['RECEITA', 'INADIMPLENCIA', 'FLUXO_DE_CAIXA']),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    creditor_id: z.string().optional(),
  })
  .refine((data) => data.end_date >= data.start_date, {
    message: 'A data final deve ser igual ou posterior à data de início.',
    path: ['end_date'],
  })
export type FinancialReport = z.infer<typeof FinancialReportSchema>

/**
 * Schema para regras de notificação de pagamentos.
 */
export const NotificationRuleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'O nome da regra é obrigatório.'),
  days_before_due: z.coerce
    .number()
    .int()
    .positive('O número de dias deve ser um inteiro positivo.'),
  message_template: z.string().min(10, 'O modelo da mensagem é obrigatório.'),
  is_active: z.boolean().default(true),
})
export type NotificationRule = z.infer<typeof NotificationRuleSchema>

// ============================================================================
// OUTROS SCHEMAS DO SISTEMA (Mantidos para compatibilidade)
// ============================================================================

export const EmployeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Cargo é obrigatório'),
  phone: z.string().optional(),
})

export const RoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do cargo é obrigatório'),
  permissions: z.array(z.string()),
})

export const CaseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Título é obrigatório').optional(),
  case_number: z.string().min(1, 'Número do processo é obrigatório').nullable(),
  debtor_id: z.string().min(1, 'Devedor é obrigatório'),
  creditor_id: z.string().min(1, 'Credor é obrigatório'),
  status: z.enum([
    'Em Andamento',
    'Finalizado',
    'Arquivado',
    'Suspenso',
    'Acordo'
  ]),
  lawyer_id: z.string().optional().nullable(),
  
  // Campos financeiros e outros, adicionados como opcionais para validação
  agreement_type: z.string().optional().nullable(),
  agreement_value: z.coerce.number().optional().nullable(),
  down_payment: z.coerce.number().optional().nullable(),
  installments: z.coerce.number().int().optional().nullable(),
  installment_due_date: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  value: z.coerce.number().optional().nullable(),
  action_type: z.string().optional().nullable(),
})

export const EntitySchema = z.object({
  id: z.string().optional(),
  // Campos principais
  name: z.string().min(1, 'Nome é obrigatório'),
  document: z.string().min(1, 'Documento é obrigatório'), // CPF/CNPJ (somente dígitos)
  type: z.enum(['Cliente', 'Executado']).default('Cliente'),

  // Dados pessoais / contato (todos opcionais)
  rg: z.string().optional().nullable(),
  birth_date: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  cellphone1: z.string().optional().nullable(),
  cellphone2: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),

  // Endereço
  address: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),

  // Outros
  observations: z.string().optional().nullable(),
});


export const DocumentTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Nome do modelo é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
})

// Adicionei um schema básico para DocumentUpload, que parece estar faltando.
export const DocumentUploadSchema = z.object({
  case_id: z.coerce.number(),
  description: z.string().optional(),
});

export const PetitionSchema = z.object({
  id: z.string().optional(),
  case_id: z.string().min(1, 'Processo é obrigatório'),
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  status: z.enum(['Em elaboração', 'Revisão', 'Protocolado']),
})

export const SystemSettingsSchema = z.object({
  officeName: z.string().optional(),
  logoUrl: z.string().url().optional(),
  defaultLanguage: z.string().optional(),
})

export const UserProfileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
})

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(8, 'A nova senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })