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

interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: "info" | "warning" | "error" | "success"
  is_read: boolean
  related_petition_id?: number
  created_at: string
  related_petition?: {
    title: string
  }
}

export function NotificationsDropdown() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Mock current user ID - in real app, get from auth context
  const currentUserId = 1

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Set up polling for real-time updates
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?user_id=${currentUserId}`)

      if (response.ok) {
        const { notifications } = await response.json()
        setNotifications(notifications || [])
      } else {
        const mockNotifications: Notification[] = [
          {
            id: 1,
            user_id: currentUserId,
            title: "Nova Petição Atribuída",
            message: "Você recebeu uma nova petição para revisão: 'Petição Inicial - Ação de Cobrança'",
            type: "info",
            is_read: false,
            related_petition_id: 1,
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
            related_petition: { title: "Petição Inicial - Ação de Cobrança" },
          },
          {
            id: 2,
            user_id: currentUserId,
            title: "Prazo Próximo",
            message: "Lembrete: Petição 'Contestação - Processo 123456' com prazo para 10/02/2024",
            type: "warning",
            is_read: false,
            related_petition_id: 2,
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
            related_petition: { title: "Contestação - Processo 123456" },
          },
          {
            id: 3,
            user_id: currentUserId,
            title: "Petição Revisada",
            message: "Sua petição 'Recurso de Apelação' foi aprovada!",
            type: "success",
            is_read: true,
            related_petition_id: 3,
            created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
            related_petition: { title: "Recurso de Apelação" },
          },
          {
            id: 4,
            user_id: currentUserId,
            title: "Petição Revisada",
            message: "Sua petição 'Petição de Execução' precisa de correções.",
            type: "warning",
            is_read: false,
            related_petition_id: 4,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
            related_petition: { title: "Petição de Execução" },
          },
        ]
        setNotifications(mockNotifications)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const response = await fetch(`/api/notifications/count?user_id=${currentUserId}`)

      if (response.ok) {
        const { count } = await response.json()
        setUnreadCount(count)
      } else {
        const unread = notifications.filter((n) => !n.is_read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
      const unread = notifications.filter((n) => !n.is_read).length
      setUnreadCount(unread)
    }
  }

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.is_read)

      for (const notification of unreadNotifications) {
        await markAsRead(notification.id)
      }

      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar todas as notificações como lidas",
        variant: "destructive",
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "info":
      default:
        return <FileText className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-orange-100 text-orange-800"
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      case "info":
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Agora"
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

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
        <div className="flex items-center justify-between p-3">
          <DropdownMenuLabel className="text-base">
            Notificações {unreadCount > 0 && `(${unreadCount})`}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                  !notification.is_read ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3 w-full">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 leading-tight">{notification.title}</p>
                      <Badge className={`text-xs ml-2 ${getTypeColor(notification.type)}`}>
                        {notification.type === "warning"
                          ? "Aviso"
                          : notification.type === "success"
                            ? "Sucesso"
                            : notification.type === "error"
                              ? "Erro"
                              : "Info"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 leading-relaxed">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{getTimeAgo(notification.created_at)}</p>
                      {notification.related_petition && (
                        <p className="text-xs text-blue-600 truncate max-w-32">{notification.related_petition.title}</p>
                      )}
                    </div>
                  </div>
                  {!notification.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-center text-blue-600 hover:text-blue-800 p-3">
          <Bell className="h-4 w-4 mr-2" />
          Ver todas as notificações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
