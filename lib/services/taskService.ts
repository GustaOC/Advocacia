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
            assignee:profiles(name)
        `)
        .order('created_at', { ascending: false });

    // Se o usuário não for admin, filtre para mostrar apenas as tarefas atribuídas a ele
    if (user.profile.role !== 'admin') {
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
    const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'Concluída' })
        .eq('id', taskId)
        .select()
        .single();
    
    if (error) {
        console.error(`Erro ao completar tarefa ${taskId}:`, error.message);
        throw new Error("Não foi possível marcar a tarefa como concluída.");
    }
    return data;
}