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
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client" // Importando o apiClient

interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  is_read: boolean;
  related_petition_id?: number;
  created_at: string;
}

export function NotificationsDropdown() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const currentUserId = user?.id;

  useEffect(() => {
    if (!currentUserId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // --- CÓDIGO ATUALIZADO AQUI ---
        // Usando o apiClient em vez de fetch direto
        const [notifRes, countRes] = await Promise.all([
          apiClient.getNotifications(currentUserId),
          apiClient.getUnreadNotificationCount(currentUserId)
        ]);

        setNotifications(notifRes.notifications || []);
        setUnreadCount(countRes.count || 0);
        // --- FIM DA ATUALIZAÇÃO ---

      } catch (error) {
        console.error("Error loading notification data:", error);
        // Não mostraremos o toast de erro aqui para não poluir a interface
        // em caso de falha de conexão, que é o problema mais comum.
        // toast({ title: "Erro", description: "Não foi possível carregar as notificações.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);

  }, [currentUserId, toast]);
  
  const markAsRead = async (id: number) => {
    // Lógica para marcar como lida (a ser implementada)
  };

  const getNotificationIcon = (type: string) => {
    // Lógica para obter o ícone (a ser implementada)
  };
  
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
                {/* A renderização de cada notificação pode ser implementada aqui */}
                <div className="flex items-start space-x-3">
                    <div><CheckCircle className="h-4 w-4 text-green-500" /></div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        <p className="text-xs text-gray-600">{notification.message}</p>
                    </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}