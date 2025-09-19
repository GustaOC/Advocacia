// components/calendar-module.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";

const localizer = momentLocalizer(moment);

// Interface para os eventos da agenda
interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  type: 'meeting' | 'hearing' | 'deadline';
  description?: string;
  userId: string; // Para vincular o evento a um usuário
}

export function CalendarModule() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting' as CalendarEvent['type'],
    start: new Date(),
    end: new Date(),
    description: ''
  });

  // Simula o ID do usuário logado. Em um app real, viria de um contexto de autenticação.
  const currentUserId = "user_123"; 

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    // No futuro, isso seria: await apiClient.getCalendarEvents(currentUserId);
    console.log(`Buscando eventos para o usuário: ${currentUserId}`);
    // Usando dados mocados por enquanto
    const mockEvents: CalendarEvent[] = [
      { id: 1, title: 'Minha Audiência - Processo 001/2024', start: new Date(2025, 8, 20, 10, 0), end: new Date(2025, 8, 20, 11, 0), type: 'hearing', userId: 'user_123' },
      { id: 2, title: 'Meu Prazo Final - Contestação ABC', start: new Date(2025, 8, 22, 23, 59), end: new Date(2025, 8, 22, 23, 59), type: 'deadline', userId: 'user_123' },
      { id: 3, title: 'Reunião com Outro Advogado', start: new Date(2025, 8, 25, 15, 0), end: new Date(2025, 8, 25, 16, 0), type: 'meeting', userId: 'outro_user' },
    ];
    
    setEvents(mockEvents.filter(event => event.userId === currentUserId));
    setIsLoading(false);
  }, [currentUserId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);


  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setNewEvent({ ...newEvent, start, end, title: '', description: '', type: 'meeting' });
    setModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setDetailsModalOpen(true);
  };

  const saveNewEvent = () => {
    if (!newEvent.title) {
        toast({ title: "Erro", description: "O título do evento é obrigatório.", variant: "destructive" });
        return;
    }
    // No futuro, isso seria: await apiClient.createCalendarEvent({ ...newEvent, userId: currentUserId });
    const eventToSave: CalendarEvent = {
        ...newEvent,
        id: Math.random(),
        userId: currentUserId,
    };
    setEvents([...events, eventToSave]);
    toast({ title: "Sucesso!", description: "Evento adicionado à sua agenda." });
    setModalOpen(false);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const style = {
      backgroundColor: '#3b82f6',
      borderRadius: '5px',
      opacity: 0.9,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    if (event.type === 'deadline') style.backgroundColor = '#ef4444';
    if (event.type === 'hearing') style.backgroundColor = '#f97316';
    if (event.type === 'meeting') style.backgroundColor = '#16a34a';
    return { style };
  };

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold mb-2">Minha Agenda</h2>
            <p className="text-slate-300 text-lg">Visualize e gerencie seus compromissos individuais.</p>
        </div>
        <Button onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })} className="bg-white text-slate-900 hover:bg-slate-100">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>
          ) : (
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={{
                  next: "Próximo",
                  previous: "Anterior",
                  today: "Hoje",
                  month: "Mês",
                  week: "Semana",
                  day: "Dia",
                  agenda: "Agenda",
                  date: "Data",
                  time: "Hora",
                  event: "Evento",
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Evento</DialogTitle></DialogHeader>
          {/* ... (conteúdo do modal de criação) ... */}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDetailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          {/* ... (conteúdo do modal de detalhes) ... */}
        </DialogContent>
      </Dialog>
    </div>
  );
}