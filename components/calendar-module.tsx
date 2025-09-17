// components/calendar-module.tsx
"use client";

import React, { useState } from 'react';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Clock } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const localizer = momentLocalizer(moment);

const initialEvents = [
  {
    id: 1,
    title: 'Audiência - Processo 001/2024',
    start: new Date(2024, 6, 20, 10, 0, 0),
    end: new Date(2024, 6, 20, 11, 0, 0),
    type: 'hearing',
    description: 'Audiência de conciliação no caso da Empresa Exemplo vs. João da Silva.'
  },
  {
    id: 2,
    title: 'Prazo Final - Contestação ABC',
    start: new Date(2024, 6, 22, 23, 59, 0),
    end: new Date(2024, 6, 22, 23, 59, 0),
    type: 'deadline',
    description: 'Último dia para apresentar a contestação no processo ABC.'
  },
  {
    id: 3,
    title: 'Reunião com Maria Souza',
    start: new Date(2024, 6, 25, 15, 0, 0),
    end: new Date(2024, 6, 25, 16, 0, 0),
    type: 'meeting',
    description: 'Reunião para discutir os próximos passos no divórcio consensual.'
  },
];

export function CalendarModule() {
  const [events, setEvents] = useState(initialEvents);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'meeting',
    start: new Date(),
    end: new Date(),
    description: ''
  });

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    setNewEvent({ ...newEvent, start, end });
    setModalOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setDetailsModalOpen(true);
  };

  const saveNewEvent = () => {
    if (newEvent.title) {
      setEvents([...events, { ...newEvent, id: events.length + 1 }]);
      setModalOpen(false);
      setNewEvent({ title: '', type: 'meeting', start: new Date(), end: new Date(), description: '' });
    }
  };

  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: '#3b82f6', // Cor padrão
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block'
    };
    if (event.type === 'deadline') {
      style.backgroundColor = '#ef4444'; // Vermelho para Prazos
    } else if (event.type === 'hearing') {
      style.backgroundColor = '#f97316'; // Laranja para Audiências
    } else if (event.type === 'meeting') {
      style.backgroundColor = '#16a34a'; // Verde para Reuniões
    }
    return { style };
  };

  return (
    <div className="space-y-6">
       <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold mb-2">Agenda Jurídica</h2>
            <p className="text-slate-300 text-lg">Visualize e gerencie todos os seus compromissos.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="bg-white text-slate-900 hover:bg-slate-100">
            <Plus className="mr-2 h-4 w-4" /> Novo Evento
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
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
        </CardContent>
      </Card>

      {/* Modal de Criação de Evento */}
      <Dialog open={isModalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Novo Evento</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Evento</Label>
              <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="hearing">Audiência</SelectItem>
                  <SelectItem value="deadline">Prazo Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} />
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveNewEvent}>Salvar Evento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de Detalhes do Evento */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedEvent?.title}</DialogTitle></DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                    {selectedEvent.type === 'deadline' && <Badge className="bg-red-100 text-red-800">Prazo Final</Badge>}
                    {selectedEvent.type === 'hearing' && <Badge className="bg-orange-100 text-orange-800">Audiência</Badge>}
                    {selectedEvent.type === 'meeting' && <Badge className="bg-green-100 text-green-800">Reunião</Badge>}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>De: {moment(selectedEvent.start).format('DD/MM/YYYY HH:mm')}</span>
                    <span>Até: {moment(selectedEvent.end).format('DD/MM/YYYY HH:mm')}</span>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <p>{selectedEvent.description || "Nenhuma descrição fornecida."}</p>
                </div>
            </div>
          )}
           <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}