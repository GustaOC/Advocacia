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
  value: z.number().optional().nullable(),
  client_entity_id: z.number({ required_error: "Você deve selecionar um cliente." }).int().positive(),
  executed_entity_id: z.number({ required_error: "Você deve selecionar um executado." }).int().positive(),
  payment_date: z.string().optional().nullable(),
  final_value: z.number().optional().nullable(),
  
  // Campos para Acordo (opcionais)
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
  total_value: z.number().positive("O valor total deve ser maior que zero."),
  entry_value: z.number().min(0).default(0),
  installments: z.number().int().min(1).default(1),
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