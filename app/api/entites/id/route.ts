// app/api/entities/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização (todos os campos são opcionais)
const EntityUpdateSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(255).optional(),
  document: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido.").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
});

// GET: Obter uma entidade específica
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requirePermission("entities_view");
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("entities").select("*").eq("id", params.id).single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Entidade não encontrada." }, { status: 404 });
    
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}

// PUT: Atualizar uma entidade
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requirePermission("entities_edit");
        const body = await req.json();
        const parsedData = EntityUpdateSchema.parse(body);

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("entities")
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

// DELETE: Excluir uma entidade
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await requirePermission("entities_delete"); // Supondo que exista essa permissão
        const supabase = createAdminClient();
        const { error } = await supabase.from("entities").delete().eq("id", params.id);

        if (error) throw error;
        return NextResponse.json({ message: "Entidade excluída com sucesso." }, { status: 200 });
        
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
    }
}