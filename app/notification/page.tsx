"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image" 
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  BookOpen, LogOut, Search, Settings, UserPlus, Bell, Users, CheckCircle2, Heart, MessageSquare
} from "lucide-react"

import styles from "./notification.module.scss"

interface User {
  id: number
  name: string
  avatar: string
  year: string
  course: string
}

interface Notification {
  id: number
  type: string
  content: string
  is_read: number | boolean
  created_at: string
  actor_name: string
  actor_avatar: string | null
}

// --- FUNÇÕES AUXILIARES ---
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarUrl = (url: string | undefined | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  // 1. Carrega o Utilizador
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/user/settings")
        if (res.ok) {
          const data = await res.json()
          setUser({
            id: data.id || 0,
            name: data.nome || data.name || "Estudante",
            avatar: data.foto_url || data.avatar || "",
            year: data.ano_escolar || data.year || "",
            course: data.curso || data.course || ""
          })
        }
      } catch (error) {
        console.error("Erro user", error)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
  }, [])

  // 2. Carrega as Notificações
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error("Erro notificações", error)
    } finally {
      setLoadingNotifs(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // 3. Marca como Lidas
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PUT" })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      }
    } catch (error) {
      console.error("Erro ao marcar como lidas:", error)
    }
  }

  // Define o Ícone da notificação
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "LIKE": return <Heart size={14} className="text-red-500 fill-red-500" />
      case "COMENTARIO": return <MessageSquare size={14} className="text-blue-500" />
      case "PEDIDO_AMIZADE": return <UserPlus size={14} className="text-emerald-500" />
      default: return <Bell size={14} className="text-slate-400" />
    }
  }

  // Formata Data
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (loadingUser) return <div className={styles.container}><div className="p-10 text-center">Carregando...</div></div>

  const safeUser = user || { name: "User", avatar: "", year: "", course: "" }
  const unreadCount = notifications.filter(n => !n.is_read).length
  const userAvatarUrl = getAvatarUrl(safeUser.avatar);

  return (
    <div className={styles.container}>
      
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/logo.png" 
              alt="Logo EduConnect" 
              width={160} 
              height={40} 
              priority
              className={styles.logoImage} 
            />
          </Link>

          <nav className={styles.desktopNav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/search"><Search size={20} /></Link>
            <Link href="/friends/requests"><UserPlus size={20} /></Link>
            
            {/* O ícone do sino fica verde (ativo) nesta página */}
            <Link href="/notification" className={styles.activeIcon}>
               <Bell size={20} />
               {unreadCount > 0 && <span className={styles.badge}></span>}
            </Link>

            <Link href="/settings"><Settings size={20} /></Link>
            
            <Link href="/profile">
              <Avatar className="w-8 h-8 border border-slate-700">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} className="object-cover" />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                  {getInitials(safeUser.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <Link href="/login" className={styles.logout}><LogOut size={20} /></Link>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.main}>
          {/* LISTA DE NOTIFICAÇÕES CENTRADA */}
          <section className={styles.notificationsSection}>
            <div className={styles.pageHeader}>
                <h1>
                    <Bell className="inline-block mr-2" />
                    Notificações
                </h1>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className={styles.markReadBtn}>
                    <CheckCircle2 size={16} /> Marcar como lidas
                  </button>
                )}
            </div>

            {loadingNotifs ? (
                <div className={styles.loading}>A carregar notificações...</div>
            ) : notifications.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.iconCircle}>
                        <Bell />
                    </div>
                    <h3>Sem notificações</h3>
                    <p>Quando alguém interagir contigo, vai aparecer aqui.</p>
                </div>
            ) : (
                <div className={styles.notificationsList}>
                    {notifications.map((notif) => {
                        const actorAvatarUrl = getAvatarUrl(notif.actor_avatar);
                        
                        return (
                          <div key={notif.id} className={`${styles.notificationCard} ${!notif.is_read ? styles.unread : ''}`}>
                              <div className={styles.cardInner}>
                                  <div className={styles.userInfo}>
                                      <div className={styles.avatarWrapper}>
                                        <Avatar className={styles.avatar}>
                                            {actorAvatarUrl && <AvatarImage src={actorAvatarUrl} className="object-cover" />}
                                            <AvatarFallback className="bg-emerald-600 text-white font-medium">
                                              {getInitials(notif.actor_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={styles.iconBadge}>
                                          {getIcon(notif.type)}
                                        </div>
                                      </div>
                                      <div className={styles.details}>
                                          <p className={styles.text}>
                                            <strong>{notif.actor_name}</strong> {notif.content}
                                          </p>
                                          <p className={styles.date}>
                                              {formatDate(notif.created_at)}
                                          </p>
                                      </div>
                                  </div>

                                  {!notif.is_read && <div className={styles.unreadDot}></div>}
                              </div>
                          </div>
                        );
                    })}
                </div>
            )}
          </section>
      </main>

      {/* --- FOOTER MOBILE --- */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard">
            <BookOpen className="w-5 h-5" />
            <span>Feed</span>
          </Link>
          <Link href="/groups">
            <Users className="w-5 h-5" />
            <span>Grupos</span>
          </Link>
          <Link href="/chat">
            <Bell className="w-5 h-5" />
            <span>Chat</span>
          </Link>
        </div>
      </footer>

    </div>
  )
}