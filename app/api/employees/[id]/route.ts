// app/api/employees/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização de um funcionário
const EmployeeUpdateSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório.").optional(),
  role_id: z.number().int().positive("A função é obrigatória.").optional(),
  is_active: z.boolean().optional(),
});

// PUT: Atualizar um funcionário
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // await requirePermission("employees_edit");
        const body = await req.json();
        const parsedData = EmployeeUpdateSchema.parse(body);

        const supabase = createAdminClient();

        // Atualiza os dados na tabela 'employees'
        const { data: updatedEmployee, error } = await supabase
            .from("employees")
            .update(parsedData)
            .eq("id", params.id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(updatedEmployee);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Desativar um funcionário
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // await requirePermission("employees_delete");
        const supabase = createAdminClient();

        // Em vez de deletar, vamos desativar o funcionário (soft delete)
        const { data, error } = await supabase
            .from("employees")
            .update({ is_active: false })
            .eq("id", params.id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ message: "Funcionário desativado com sucesso.", employee: data });
        
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}