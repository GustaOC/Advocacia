// app/api/petitions/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema alinhado com a nova tabela 'petitions'
const PetitionSchema = z.object({
  case_id: z.number().int().positive("O ID do caso é obrigatório."),
  title: z.string().min(3, "O título é obrigatório.").max(255),
  description: z.string().optional().nullable(),
  file_path: z.string().min(1, "O caminho do arquivo é obrigatório."), // Em uma implementação real, o upload seria tratado aqui
  deadline: z.string().optional().nullable(),
  status: z.enum(['pending', 'under_review', 'approved', 'corrections_needed', 'rejected']).default('pending'),
  created_by_employee_id: z.string().uuid("ID do criador inválido."),
  assigned_to_employee_id: z.string().uuid("ID do responsável inválido."),
});

// GET: Listar todas as petições
export async function GET(req: NextRequest) {
  try {
    // Supondo que a visualização de petições requer uma permissão
    // await requirePermission("petitions_view"); 
    const supabase = createAdminClient();
    
    // Query para buscar petições com dados do caso e dos funcionários
    const { data, error } = await supabase
      .from("petitions")
      .select(`
        *,
        cases (id, title, case_number),
        created_by_employee:employees!created_by_employee_id (id, name, email),
        assigned_to_employee:employees!assigned_to_employee_id (id, name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ petitions: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar uma nova petição
export async function POST(req: NextRequest) {
  try {
    // await requirePermission("petitions_create");
    const body = await req.json();
    const parsedData = PetitionSchema.parse(body);

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("petitions")
      .insert(parsedData)
      .select()
      .single();

    if (error) throw error;
    
    // Opcional: Criar uma notificação para o funcionário responsável
    await supabase.from('notifications').insert({
        user_id: parsedData.assigned_to_employee_id,
        title: 'Nova Petição Atribuída',
        message: `Você foi designado para revisar a petição: "${parsedData.title}"`,
        related_petition_id: data.id,
    });

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}