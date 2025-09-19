// lib/schemas.ts
import { z } from "zod";

// =================================
// CLIENT SCHEMAS (MANTIDO)
// =================================

export const ClientSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(255),
  document: z.string().max(20).optional().nullable(), // CPF/CNPJ
  email: z.string().email("Email inválido.").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  neighborhood: z.string().max(100).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip_code: z.string().max(20).optional().nullable(),
});

export const ClientUpdateSchema = ClientSchema.partial();


// =================================
// CASE SCHEMAS (MANTIDO)
// =================================

export const CaseSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(255),
  case_number: z.string().max(100).optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['Em Andamento', 'Em Acordo', 'Extinto']).default('Em Andamento'),
  urgency: z.enum(['Baixa', 'Media', 'Alta']).default('Baixa'),
  court: z.string().max(255).optional().nullable(),
  agreement_type: z.enum(['Judicial', 'Extrajudicial', 'Acordo em Audiência']).optional().nullable(),
  extinction_reason: z.enum(['Grupo Econômico', 'Citação Negativa', 'Penhora Infrutífera', 'Pagamento', 'Morte', 'Desistência']).optional().nullable(),
}).refine(data => {
  if (data.status === 'Em Acordo') return !!data.agreement_type;
  return true;
}, {
  message: "O tipo de acordo é obrigatório quando o status é 'Em Acordo'.",
  path: ['agreement_type'],
}).refine(data => {
  if (data.status === 'Extinto') return !!data.extinction_reason;
  return true;
}, {
  message: "O motivo da extinção é obrigatório quando o status é 'Extinto'.",
  path: ['extinction_reason'],
});

export const CaseUpdateSchema = CaseSchema.partial();

// =================================
// DEMAIS SCHEMAS (MANTIDOS)
// =================================

export const AgreementSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  client_entity_id: z.number().int().positive("O ID da entidade cliente é obrigatório."),
  agreement_type: z.string().min(3, "O tipo de acordo é obrigatório."),
  total_value: z.number().positive("O valor total deve ser maior que zero."),
  entry_value: z.number().min(0).default(0),
  installments: z.number().int().min(1).default(1),
  status: z.enum(['active', 'completed', 'cancelled', 'defaulted']).default('active'),
  notes: z.string().optional().nullable(),
});

export const AgreementUpdateSchema = AgreementSchema.partial();

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

// =================================
// NOVOS SCHEMAS PARA TAREFAS E AGENDA
// =================================

export const TaskSchema = z.object({
  title: z.string().min(3, "O título da tarefa é obrigatório."),
  description: z.string().optional().nullable(),
  assigned_to: z.string().uuid("É necessário atribuir a tarefa a um funcionário."),
  due_date: z.string().optional().nullable(),
});

export const EventSchema = z.object({
    title: z.string().min(2, "O título do evento é obrigatório."),
    start_time: z.string().datetime("A data de início é obrigatória."),
    end_time: z.string().datetime("A data de término é obrigatória."),
    employee_id: z.string().uuid(),
});

export const EventUpdateSchema = EventSchema.partial().omit({ employee_id: true });