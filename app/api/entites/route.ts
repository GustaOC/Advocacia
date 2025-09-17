// app/api/entities/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema de validação para a nova tabela 'entities'
const EntitySchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres.").max(255),
  document: z.string().max(20).optional().nullable(),
  email: z.string().email("Email inválido.").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
});

// GET: Listar todas as entidades
export async function GET(req: NextRequest) {
  try {
    await requirePermission("entities_view");
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("entities").select("*").order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message === "FORBIDDEN" ? 403 : 500 });
  }
}

// POST: Criar uma nova entidade
export async function POST(req: NextRequest) {
  try {
    await requirePermission("entities_create");
    const body = await req.json();
    const parsedData = EntitySchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase.from("entities").insert(parsedData).select().single();

    if (error) {
        // Trata erro de violação de unicidade (ex: email ou documento duplicado)
        if (error.code === '23505') {
            return NextResponse.json({ error: "Já existe uma entidade com este email ou documento." }, { status: 409 });
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