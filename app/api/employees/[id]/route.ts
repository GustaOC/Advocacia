// app/api/employees/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para atualização de um funcionário
const EmployeeUpdateSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório.").optional(),
  // Renomeado para role_id para corresponder ao banco de dados e ao schema
  role_id: z.number().int().positive("A função é obrigatória.").optional(),
  is_active: z.boolean().optional(),
});

// PUT: Atualizar um funcionário
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Permissão ATIVADA: Apenas usuários com 'employees_edit' podem editar.
        await requirePermission("employees_edit");
        const body = await req.json();
        
        // Pequena correção: o frontend envia roleId como string, convertemos para número.
        if (body.roleId) {
            body.role_id = Number(body.roleId);
            delete body.roleId;
        }

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
        if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Desativar um funcionário
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        // Permissão ATIVADA: Apenas usuários com 'employees_delete' podem desativar.
        await requirePermission("employees_delete");
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
        if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
            return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}