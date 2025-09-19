"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, CheckCircle, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth" // Importar o hook de autenticação

interface Notification {
  id: number;
  user_id: string; // ID agora é string (UUID)
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  is_read: boolean;
  related_petition_id?: number;
  created_at: string;
}

export function NotificationsDropdown() {
  const { toast } = useToast();
  const { user } = useAuth(); // Usar o hook para obter o usuário logado
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // O ID do usuário agora vem do contexto de autenticação
  const currentUserId = user?.id;

  useEffect(() => {
    // Só executa se o ID do usuário estiver disponível
    if (!currentUserId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Busca notificações e contagem para o usuário logado
        const [notifRes, countRes] = await Promise.all([
          fetch(`/api/notifications?user_id=${currentUserId}`),
          fetch(`/api/notifications/count?user_id=${currentUserId}`)
        ]);

        if (notifRes.ok) {
          const { notifications: apiNotifications } = await notifRes.json();
          setNotifications(apiNotifications || []);
        }
        if (countRes.ok) {
          const { count } = await countRes.json();
          setUnreadCount(count || 0);
        }
      } catch (error) {
        console.error("Error loading notification data:", error);
        toast({ title: "Erro", description: "Não foi possível carregar as notificações.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Polling para novas notificações
    const interval = setInterval(loadData, 60000); // A cada 1 minuto
    return () => clearInterval(interval);

  }, [currentUserId, toast]);
  
  // As demais funções (markAsRead, getNotificationIcon, etc.) permanecem as mesmas...

  const markAsRead = async (id: number) => {
    // Lógica para marcar como lida
  };

  const getNotificationIcon = (type: string) => {
    // Lógica para obter o ícone
  };
  
  // ... (Resto do componente inalterado)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="text-base p-3">Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-4 cursor-pointer border-b last:border-b-0">
                {/* Renderização da notificação */}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}