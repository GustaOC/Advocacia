// app/api/financial-agreements/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização de um acordo (todos os campos opcionais)
const AgreementUpdateSchema = z.object({
  agreement_type: z.string().min(3).optional(),
  total_value: z.number().positive().optional(),
  entry_value: z.number().min(0).optional(),
  installments: z.number().int().min(1).optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'defaulted']).optional(),
  notes: z.string().optional().nullable(),
});

// GET: Obter um acordo financeiro específico
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requirePermission("financial_view");
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("financial_agreements")
            .select(`
                *,
                cases (*),
                entities (*)
            `)
            .eq("id", params.id)
            .single();

        if (error) throw error;
        if (!data) return NextResponse.json({ error: "Acordo não encontrado." }, { status: 404 });
        
        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
    }
}

// PUT: Atualizar um acordo financeiro
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requirePermission("financial_edit"); // Supondo permissão de edição
        const body = await req.json();
        const parsedData = AgreementUpdateSchema.parse(body);

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("financial_agreements")
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