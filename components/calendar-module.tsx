"use client"

import { useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { Calendar as BigCalendar, momentLocalizer } from "react-big-calendar"
import moment from "moment"
import "react-big-calendar/lib/css/react-big-calendar.css"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"

// Modal para eventos
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton" // CAMINHO CORRIGIDO AQUI

const localizer = momentLocalizer(moment)

export function CalendarModule() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventTitle, setEventTitle] = useState("")

  const {
    data: events,
    isLoading,
  } = useQuery({
    queryKey: ["calendarEvents", user?.id],
    queryFn: async () => {
      // A API buscará apenas eventos do usuário logado
      const response = await apiClient.get("/events") 
      return response.data.map((event: any) => ({
        ...event,
        start: new Date(event.start_time),
        end: new Date(event.end_time),
      }))
    },
    enabled: !!user, // Só executa a query quando o usuário estiver carregado
  })

  const eventMutation = useMutation({
    mutationFn: (newEvent: any) => {
      if (selectedEvent?.id) {
        return apiClient.put(`/events/${selectedEvent.id}`, newEvent)
      }
      return apiClient.post("/events", newEvent)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents", user?.id] })
      toast({ title: `Evento ${selectedEvent ? 'atualizado' : 'criado'} com sucesso!` })
      setIsModalOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar evento",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedEvent({ start: slotInfo.start, end: slotInfo.end })
    setEventTitle("")
    setIsModalOpen(true)
  }

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event)
    setEventTitle(event.title)
    setIsModalOpen(true)
  }

  const handleSaveEvent = () => {
    if (!eventTitle) {
        toast({ title: "O título é obrigatório", variant: "destructive" });
        return;
    }
    const payload = {
      title: eventTitle,
      start_time: selectedEvent.start.toISOString(),
      end_time: selectedEvent.end.toISOString(),
    }
    eventMutation.mutate(payload)
  }

  if (isLoading) {
    return <Skeleton className="h-full w-full" />
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Agenda Pessoal</CardTitle>
              <CardDescription>
                Gerencie seus compromissos e rotinas.
              </CardDescription>
            </div>
            <Button onClick={() => handleSelectSlot({start: new Date(), end: new Date()})}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <BigCalendar
            localizer={localizer}
            events={events || []}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
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
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEvent?.id ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Título</Label>
              <Input
                id="title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEvent} disabled={eventMutation.isPending}>
                {eventMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}