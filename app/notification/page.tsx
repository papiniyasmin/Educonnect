"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image" 
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  BookOpen, LogOut, Search, Settings, UserPlus, Bell, Users, CheckCircle2, Heart, MessageSquare
} from "lucide-react"

import styles from "./notification.module.scss"

// =========================================================================
// INTERFACES (Tipagens do TypeScript para estrutura de dados)
// =========================================================================

interface User {
  id: number
  name: string
  avatar: string
  year: string
  course: string
}

interface Notification {
  id: number
  type: string // Ex: "LIKE", "COMENTARIO", "PEDIDO_AMIZADE"
  content: string // O texto da notificação
  is_read: number | boolean // Flag que diz se o utilizador já viu a notificação (0 ou 1, false ou true)
  created_at: string
  actor_name: string // O nome de quem gerou a notificação (ex: "João Santos")
  actor_avatar: string | null // A foto de quem gerou
}

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Extrai as iniciais do nome caso o utilizador não tenha uma foto de perfil
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Constrói o caminho correto da imagem de perfil (links externos, base64 ou pasta local uploads)
const getAvatarUrl = (url: string | undefined | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

export default function NotificationsPage() {
  // =========================================================================
  // ESTADOS DO COMPONENTE
  // =========================================================================
  const [user, setUser] = useState<User | null>(null) // Informação do utilizador logado
  const [notifications, setNotifications] = useState<Notification[]>([]) // A lista de notificações
  
  // Loading states separados para permitir carregar o menu logo, mesmo que as notificações demorem
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  // =========================================================================
  // EFFECTS (Carregamento de Dados Iniciais)
  // =========================================================================

  // 1. Carrega o Utilizador (Para popular o Header e o Avatar)
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
        setLoadingUser(false) // Desliga o loader global
      }
    }
    loadUser()
  }, [])

  // 2. Carrega a Lista de Notificações do utilizador
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data) // Guarda as notificações no estado local
      }
    } catch (error) {
      console.error("Erro notificações", error)
    } finally {
      setLoadingNotifs(false) // Desliga o loader específico da lista de notificações
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // =========================================================================
  // HANDLERS (Ações do Utilizador)
  // =========================================================================

  // 3. Marca TODAS as notificações como Lidas
  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", { method: "PUT" }) // Rota PUT para atualizar o estado no Backend
      if (res.ok) {
        // Optimistic UI: Em vez de fazer novo fetch, atualiza instantaneamente a lista no Front-End mudando `is_read` para 1
        setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })))
      }
    } catch (error) {
      console.error("Erro ao marcar como lidas:", error)
    }
  }

  // =========================================================================
  // FORMATADORES VISUAIS
  // =========================================================================

  // Define qual Ícone mostrar dependendo do TIPO de notificação
  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "LIKE": return <Heart size={14} className="text-red-500 fill-red-500" /> // Coração vermelho
      case "COMENTARIO": return <MessageSquare size={14} className="text-blue-500" /> // Balão de fala azul
      case "PEDIDO_AMIZADE": return <UserPlus size={14} className="text-emerald-500" /> // Bonequinho verde
      default: return <Bell size={14} className="text-slate-400" /> // Sino padrão para tipos desconhecidos
    }
  }

  // Formata a data para formato Português (Ex: 02 fev, 14:30)
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
  }

  // =========================================================================
  // RENDERIZAÇÃO ECRÃ DE LOADING
  // =========================================================================
  if (loadingUser) return <div className={styles.container}><div className="p-10 text-center">Carregando...</div></div>

  // Garante que o User não é nulo para evitar erros ao desenhar a UI
  const safeUser = user || { name: "User", avatar: "", year: "", course: "" }
  
  // Conta quantas notificações existem com a flag is_read a falso/0
  const unreadCount = notifications.filter(n => !n.is_read).length
  
  const userAvatarUrl = getAvatarUrl(safeUser.avatar);

  // =========================================================================
  // RENDERIZAÇÃO DA PÁGINA (JSX)
  // =========================================================================
  return (
    <div className={styles.container}>
      
      {/* --- HEADER (Menu Superior) --- */}
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
            
            {/* O ícone do sino fica verde/ativo porque estamos atualmente nesta página */}
            <Link href="/notification" className={styles.activeIcon}>
               <Bell size={20} />
               {/* Se houver notificações por ler, mostra a bolinha vermelha no ícone */}
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

      {/* --- CONTEÚDO PRINCIPAL (MAIN) --- */}
      <main className={styles.main}>
          
          {/* LISTA DE NOTIFICAÇÕES (Centralizada no ecrã) */}
          <section className={styles.notificationsSection}>
            
            <div className={styles.pageHeader}>
                <h1>
                    <Bell className="inline-block mr-2" />
                    Notificações
                </h1>
                
                {/* O botão "Marcar como lidas" só aparece se houver realmente algo por ler */}
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllAsRead} className={styles.markReadBtn}>
                    <CheckCircle2 size={16} /> Marcar como lidas
                  </button>
                )}
            </div>

            {/* Condições de renderização da lista: 1. A carregar / 2. Lista Vazia / 3. Lista Preenchida */}
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
                          // A classe 'styles.unread' (geralmente usada para deixar o fundo com um azul clarinho) 
                          // é aplicada apenas se a notificação ainda não foi lida
                          <div key={notif.id} className={`${styles.notificationCard} ${!notif.is_read ? styles.unread : ''}`}>
                              <div className={styles.cardInner}>
                                  <div className={styles.userInfo}>
                                      
                                      {/* Área do Avatar e Ícone (Ex: Foto da pessoa com um coração pequeno sobreposto) */}
                                      <div className={styles.avatarWrapper}>
                                        <Avatar className={styles.avatar}>
                                            {actorAvatarUrl && <AvatarImage src={actorAvatarUrl} className="object-cover" />}
                                            <AvatarFallback className="bg-emerald-600 text-white font-medium">
                                              {getInitials(notif.actor_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={styles.iconBadge}>
                                          {getIcon(notif.type)} {/* Chama a função que devolve o ícone certo */}
                                        </div>
                                      </div>

                                      {/* Área do Texto da Notificação */}
                                      <div className={styles.details}>
                                          <p className={styles.text}>
                                            {/* Coloca o nome da pessoa a Negrito, seguido do texto. Ex: "João gostou do teu post" */}
                                            <strong>{notif.actor_name}</strong> {notif.content}
                                          </p>
                                          <p className={styles.date}>
                                              {formatDate(notif.created_at)}
                                          </p>
                                      </div>
                                  </div>

                                  {/* Pontinho azul lateral que indica visualmente que a notificação não foi lida */}
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