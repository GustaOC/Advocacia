// lib/services/eventService.ts
import { createAdminClient } from "@/lib/supabase/server";
import { AuthUser } from "@/lib/auth";
import { EventSchema, EventUpdateSchema } from "@/lib/schemas";

export async function getEvents(user: AuthUser) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('employee_id', user.id) // Filtro principal: apenas eventos do usuário logado
        .order('start_time', { ascending: true });

    if (error) {
        console.error("Erro ao buscar eventos:", error.message);
        throw new Error("Não foi possível buscar os eventos.");
    }
    return data;
}

export async function createEvent(eventData: unknown, user: AuthUser) {
    // Adiciona o ID do usuário aos dados do evento antes de validar
    const dataWithUser = { ...eventData as object, employee_id: user.id };
    const parsedData = EventSchema.parse(dataWithUser);
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('events')
        .insert(parsedData)
        .select()
        .single();

    if (error) {
        console.error("Erro ao criar evento:", error.message);
        throw new Error("Não foi possível criar o evento.");
    }
    return data;
}

export async function updateEvent(eventId: string, eventData: unknown, user: AuthUser) {
    const parsedData = EventUpdateSchema.parse(eventData);
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from('events')
        .update(parsedData)
        .eq('id', eventId)
        .eq('employee_id', user.id) // Garante que o usuário só possa editar seus próprios eventos
        .select()
        .single();

    if (error) {
        console.error(`Erro ao atualizar evento ${eventId}:`, error.message);
        throw new Error("Não foi possível atualizar o evento.");
    }
    return data;
}