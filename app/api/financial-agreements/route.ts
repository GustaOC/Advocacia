// app/api/financial-agreements/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema alinhado com a nova tabela 'financial_agreements'
const AgreementSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  client_entity_id: z.number().int().positive("O ID da entidade cliente é obrigatório."),
  agreement_type: z.string().min(3, "O tipo de acordo é obrigatório."),
  total_value: z.number().positive("O valor total deve ser maior que zero."),
  entry_value: z.number().min(0).default(0),
  installments: z.number().int().min(1).default(1),
  status: z.enum(['active', 'completed', 'cancelled', 'defaulted']).default('active'),
  notes: z.string().optional().nullable(),
});

// GET: Listar todos os acordos financeiros
export async function GET(req: NextRequest) {
  try {
    await requirePermission("financial_view");
    const supabase = createAdminClient();
    
    // Query atualizada para buscar dados das tabelas relacionadas
    const { data, error } = await supabase
      .from("financial_agreements")
      .select(`
        *,
        cases (
          id,
          case_number,
          title
        ),
        entities (
          id,
          name,
          document
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}

// POST: Criar um novo acordo financeiro
export async function POST(req: NextRequest) {
  try {
    await requirePermission("financial_create"); // Supondo a existência desta permissão
    const body = await req.json();
    const parsedData = AgreementSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("financial_agreements")
      .insert(parsedData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}