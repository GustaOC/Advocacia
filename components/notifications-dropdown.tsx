// components/notifications-dropdown.tsx
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // MELHORIA: A função só será executada se o 'user' estiver carregado.
    if (!user?.id) {
        setLoading(false);
        return;
    };

    const loadData = async () => {
      setLoading(true);
      try {
        const [notifRes, countRes] = await Promise.all([
          fetch(`/api/notifications?user_id=${user.id}`),
          fetch(`/api/notifications/count?user_id=${user.id}`)
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
    const interval = setInterval(loadData, 60000); // Recarrega a cada 1 minuto
    return () => clearInterval(interval);

  }, [user?.id, toast]); // A dependência agora é user.id
  
  const markAsRead = async (id: number) => {
     try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível marcar a notificação como lida.", variant: "destructive" });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <FileText className="h-5 w-5 text-blue-500" />;
    }
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
              <DropdownMenuItem key={notification.id} onSelect={() => !notification.is_read && markAsRead(notification.id)} className={`p-4 cursor-pointer border-b last:border-b-0 flex items-start gap-3 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                <div>{getNotificationIcon(notification.type)}</div>
                <div className="flex-1">
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}