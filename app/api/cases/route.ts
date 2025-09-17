// app/api/cases/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema de validação para a tabela 'cases'
const CaseSchema = z.object({
  case_number: z.string().max(100).optional().nullable(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(255),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'archived', 'suspended', 'completed']).default('active'),
  court: z.string().max(255).optional().nullable(),
});

// GET: Listar todos os casos
export async function GET(req: NextRequest) {
  try {
    await requirePermission("cases_view");
    const supabase = createAdminClient();
    
    // Agora, vamos buscar os casos e também as partes associadas a ele
    const { data, error } = await supabase
      .from("cases")
      .select(`
        *,
        case_parties (
          role,
          entities (
            id,
            name,
            document
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}

// POST: Criar um novo caso
export async function POST(req: NextRequest) {
  try {
    await requirePermission("cases_create");
    const body = await req.json();
    const parsedData = CaseSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cases")
      .insert(parsedData)
      .select()
      .single();

    if (error) {
        if (error.code === '23505') { // Código de violação de unicidade
            return NextResponse.json({ error: "Já existe um caso com este número de processo." }, { status: 409 });
        }
        throw error;
    }
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}