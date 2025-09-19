// lib/services/taskService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";
import { TaskSchema } from "@/lib/schemas";

export async function getTasks(user: AuthUser) {
    const supabase = createAdminClient();
    let query = supabase
        .from('tasks')
        .select(`
            *,
            assignee:employees(name) 
        `)
        .order('created_at', { ascending: false });

    // CORREÇÃO: Alterado de 'user.profile.role' para 'user.role' para corresponder à interface AuthUser.
    // A consulta agora filtra corretamente as tarefas para usuários que não são administradores.
    if (user.role !== 'admin') {
        query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Erro ao buscar tarefas:", error.message);
        throw new Error("Não foi possível buscar as tarefas.");
    }
    
    // Mapeia o resultado para um formato mais amigável no frontend
    return data.map(task => ({
        ...task,
        // Ajuste para o aninhamento correto da resposta da query
        assignee_name: task.assignee?.name || 'Desconhecido'
    }));
}

export async function createTask(taskData: unknown, user: AuthUser) {
    const parsedData = TaskSchema.parse(taskData);
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('tasks')
        .insert({ ...parsedData, created_by: user.id })
        .select()
        .single();

    if (error) {
        console.error("Erro ao criar tarefa:", error.message);
        throw new Error("Não foi possível criar a tarefa.");
    }
    return data;
}

export async function completeTask(taskId: string, user: AuthUser) {
    const supabase = createAdminClient();
    
    // Garante que apenas o usuário atribuído ou um admin possa completar a tarefa.
    let query = supabase
        .from('tasks')
        .update({ status: 'Concluída' })
        .eq('id', taskId);

    if (user.role !== 'admin') {
        query = query.eq('assigned_to', user.id);
    }

    const { data, error } = await query.select().single();
    
    if (error) {
        if (error.code === 'PGRST116') { // Nenhum registro encontrado, pode ser erro de permissão.
             throw new Error("Tarefa não encontrada ou você não tem permissão para completá-la.");
        }
        console.error(`Erro ao completar tarefa ${taskId}:`, error.message);
        throw new Error("Não foi possível marcar a tarefa como concluída.");
    }
    return data;
}