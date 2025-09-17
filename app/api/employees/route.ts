// app/api/employees/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";

// Schema para criar um novo funcionário (convite)
const EmployeeCreateSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("O email fornecido é inválido."),
  role_id: z.number().int().positive("A função é obrigatória."),
});

// GET: Listar todos os funcionários com suas funções
export async function GET(req: NextRequest) {
  try {
    // await requirePermission("employees_view"); // Ajuste a permissão conforme necessário
    const supabase = createAdminClient();
    
    // Busca funcionários e faz o join com a tabela de roles
    const { data, error } = await supabase
      .from("employees")
      .select(`
        id,
        name,
        is_active,
        created_at,
        roles (
          id,
          name
        ),
        users:auth_users (
            email
        )
      `)
      .order("name", { ascending: true });

    if (error) throw error;
    
    // Formata a resposta para ser mais amigável no frontend
    const formattedData = data.map(emp => ({
        ...emp,
        email: emp.users?.email, // Pega o email da tabela auth.users
        role: emp.roles?.name,   // Pega o nome da função
        role_id: emp.roles?.id,
        users: undefined,        // Remove o objeto aninhado desnecessário
        roles: undefined,
    }));

    return NextResponse.json(formattedData);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Criar/Convidar um novo funcionário
export async function POST(req: NextRequest) {
  try {
    // await requirePermission("employees_create");
    const body = await req.json();
    const parsedData = EmployeeCreateSchema.parse(body);

    const supabase = createAdminClient();

    // 1. Convidar o usuário para o Supabase Auth
    const { data: { user }, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(parsedData.email);

    if (inviteError) {
        if (inviteError.message.includes("User already registered")) {
            return NextResponse.json({ error: "Um usuário com este email já existe no sistema." }, { status: 409 });
        }
        throw inviteError;
    }

    if (!user) {
        throw new Error("Não foi possível criar o usuário no sistema de autenticação.");
    }
    
    // 2. Inserir os dados do funcionário na tabela 'employees' vinculando com o ID do Auth
    const { data: newEmployee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        id: user.id, // Vincula o UUID do auth.users com a tabela employees
        name: parsedData.name,
        role_id: parsedData.role_id,
        is_active: true,
      })
      .select()
      .single();

    if (employeeError) {
      // Se a inserção falhar, deleta o usuário do Auth para evitar inconsistência
      await supabase.auth.admin.deleteUser(user.id);
      throw employeeError;
    }
    
    return NextResponse.json(newEmployee, { status: 201 });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos.", issues: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}