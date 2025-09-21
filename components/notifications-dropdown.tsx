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
import { apiClient } from "@/lib/api-client"

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
        const [notifRes, countRes] = await Promise.all([
          apiClient.getNotifications(currentUserId),
          apiClient.getUnreadNotificationCount(currentUserId)
        ]);

        setNotifications(notifRes.notifications || []);
        setUnreadCount(countRes.count || 0);

      } catch (error) {
        console.error("Error loading notification data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);

  }, [currentUserId, toast]);
  
  const markAsRead = async (id: number) => {
    // Implementar lógica para marcar como lida
  };

  const getNotificationIcon = (type: string) => {
    switch(type) {
        case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
        default: return <FileText className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-10 w-10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-gold-400 rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="text-base p-3">Notificações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
                <Bell className="h-10 w-10 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">Nenhuma notificação</p>
                <p className="text-sm">Você está em dia!</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="p-4 cursor-pointer border-b last:border-b-0">
                <div className="flex items-start space-x-3">
                    <div>{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800">{notification.title}</p>
                        <p className="text-xs text-slate-600">{notification.message}</p>
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