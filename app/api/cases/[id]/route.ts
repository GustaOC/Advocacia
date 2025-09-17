// app/api/cases/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização (todos os campos são opcionais)
const CaseUpdateSchema = z.object({
  case_number: z.string().max(100).optional().nullable(),
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres.").max(255).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['active', 'archived', 'suspended', 'completed']).optional(),
  court: z.string().max(255).optional().nullable(),
});

// GET: Obter um caso específico com suas partes
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("cases_view");
    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from("cases")
      .select(`
        *,
        case_parties (
          role,
          entities (
            *
          )
        )
      `)
      .eq("id", params.id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Caso não encontrado." }, { status: 404 });
    
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}

// PUT: Atualizar um caso
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requirePermission("cases_edit");
        const body = await req.json();
        const parsedData = CaseUpdateSchema.parse(body);

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("cases")
            .update(parsedData)
            .eq("id", params.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
    }
}