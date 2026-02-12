"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Heart, MessageCircle, Users, Award, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Notification {
  id: number
  type: "like" | "comment" | "message" | "group" | "mentorship" | "system"
  title: string
  description: string
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  avatar?: string
  actionRequired?: boolean
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "like",
      title: "Maria Santos curtiu o seu post",
      description: "sobre exercícios de derivadas",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isRead: false,
      avatar: "/student-girl.jpg",
      actionUrl: "/dashboard",
    },
    {
      id: 2,
      type: "comment",
      title: "Pedro Costa comentou no seu post",
      description: '"Excelente explicação! Muito obrigado pela ajuda."',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      avatar: "/student-boy-2.jpg",
      actionUrl: "/dashboard",
    },
    {
      id: 3,
      type: "message",
      title: "Nova mensagem de Ana Silva",
      description: "Conseguiste resolver o exercício de História?",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      isRead: true,
      avatar: "/student-girl-2.jpg",
      actionUrl: "/chat",
    },
    {
      id: 4,
      type: "mentorship",
      title: "Pedido de mentoria aceite",
      description: "Pedro Costa aceitou o seu pedido de mentoria em Matemática",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      isRead: false,
      avatar: "/student-boy-2.jpg",
      actionUrl: "/mentorship",
      actionRequired: true,
    },
    {
      id: 5,
      type: "group",
      title: "Novo membro no grupo",
      description: "Carlos Mendes juntou-se ao grupo Matemática 11º Ano",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      isRead: true,
      avatar: "/student-boy.jpg",
      actionUrl: "/groups/1",
    },
    {
      id: 6,
      type: "system",
      title: "Bem-vindo ao EduConnect!",
      description: "Complete o seu perfil para começar a conectar-se com outros alunos",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isRead: true,
      actionUrl: "/profile",
      actionRequired: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (notificationId: number) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  const removeNotification = (notificationId: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-red-400" />
      case "comment":
        return <MessageCircle className="w-4 h-4 text-blue-400" />
      case "message":
        return <MessageCircle className="w-4 h-4 text-green-400" />
      case "group":
        return <Users className="w-4 h-4 text-purple-400" />
      case "mentorship":
        return <Award className="w-4 h-4 text-orange-400" />
      case "system":
        return <Bell className="w-4 h-4 text-slate-400" />
      default:
        return <Bell className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 bg-slate-800 border-slate-700 p-0" align="end">
        <Card className="border-0 bg-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">Notificações</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-emerald-400 hover:text-emerald-300 text-xs"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer border-l-2 ${
                      notification.isRead ? "border-transparent" : "border-emerald-500"
                    } ${!notification.isRead ? "bg-slate-700/30" : ""}`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {notification.avatar ? (
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={notification.avatar || "/placeholder.svg"} alt="Avatar" />
                            <AvatarFallback className="bg-emerald-600 text-white text-xs">
                              {notification.title.split(" ")[0].charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                            {getNotificationIcon(notification.type)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{notification.title}</p>
                            <p className="text-slate-400 text-sm mt-1 line-clamp-2">{notification.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-slate-500 text-xs">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: ptBR })}
                              </span>
                              {notification.actionRequired && (
                                <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 text-xs">
                                  Ação necessária
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-emerald-400 hover:text-emerald-300 p-1 h-auto"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeNotification(notification.id)
                              }}
                              className="text-slate-400 hover:text-red-400 p-1 h-auto"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma notificação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
