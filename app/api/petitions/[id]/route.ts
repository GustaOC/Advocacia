// app/api/petitions/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização de uma petição
const PetitionUpdateSchema = z.object({
    title: z.string().min(3).max(255).optional(),
    description: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    status: z.enum(['pending', 'under_review', 'approved', 'corrections_needed', 'rejected']).optional(),
    assigned_to_employee_id: z.string().uuid().optional(),
});

// PUT: Atualizar uma petição (ex: mudar status ou responsável)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // await requirePermission("petitions_edit");
        const body = await req.json();
        const parsedData = PetitionUpdateSchema.parse(body);

        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from("petitions")
            .update(parsedData)
            .eq("id", params.id)
            .select()
            .single();

        if (error) throw error;

        // Opcional: Notificar sobre a mudança de status ou responsável
        if (parsedData.status && data) {
            await supabase.from('notifications').insert({
                employee_id: data.created_by_employee_id,
                title: `Status da Petição Alterado: ${parsedData.status}`,
                message: `O status da petição "${data.title}" foi atualizado para "${parsedData.status}".`,
                related_petition_id: data.id,
            });
        }

        return NextResponse.json(data);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}