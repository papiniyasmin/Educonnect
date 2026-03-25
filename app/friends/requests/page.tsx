"use client" 

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image" 
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, LogOut, Search, Settings, Check, X, 
  UserPlus, Bell, Users 
} from "lucide-react"

import styles from "./friendRequests.module.scss"

// =========================================================================
// INTERFACES (Definição dos tipos de dados para o TypeScript)
// =========================================================================

interface User {
  id: number
  name: string
  avatar: string
  year: string
  course: string
}

interface FriendRequest {
  id: number
  requesterId: number
  name: string
  avatar: string
  course: string
  timestamp: string
}

// =========================================================================
// FUNÇÕES AUXILIARES (Tratamento de dados visuais)
// =========================================================================

// Extrai as iniciais do nome para mostrar no Avatar quando não há foto
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Garante que o URL da imagem do avatar está correto (local vs externo)
const getAvatarUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

// Formata a data para ficar no formato "Dia/Mês, Hora:Minuto" (ex: 24/03, 00:36)
const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString)).replace(',', '')
}

export default function FriendRequestsPage() {
  // =========================================================================
  // ESTADOS (Variáveis reativas do componente)
  // =========================================================================
  
  // Dados do utilizador logado
  const [user, setUser] = useState<User | null>(null) 
  // Lista de pedidos de amizade pendentes
  const [requests, setRequests] = useState<FriendRequest[]>([])   
  // Controlos de estado de carregamento (loading spinners/text)
  const [loadingUser, setLoadingUser] = useState(true) 
  const [loadingRequests, setLoadingRequests] = useState(true) 
  
  // Contador para a bolinha vermelha no ícone do sino (notificações não lidas)
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0)

  // =========================================================================
  // EFFECTS (Carregamento de dados ao iniciar a página)
  // =========================================================================

  // Vai buscar os dados do utilizador ativo
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

  // Vai buscar a lista de pedidos de amizade
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends/request")
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (error) {
      console.error("Erro pedidos", error)
    } finally {
      setLoadingRequests(false)
    }
  }

  // Verifica se há notificações não lidas apenas para atualizar a badge (bolinha vermelha)
  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        const unread = data.filter((n: any) => !n.is_read).length
        setUnreadNotifsCount(unread)
      }
    } catch (error) {
      console.error("Erro a buscar badge de notificações", error)
    }
  }

  // Chama as funções de fetch apenas uma vez, quando o componente é montado
  useEffect(() => {
    fetchRequests()
    fetchUnreadNotifications() 
  }, [])

  // =========================================================================
  // HANDLERS (Ações baseadas em cliques do utilizador)
  // =========================================================================

  // Função para aceitar ou recusar um pedido
  const handleResponse = async (requestId: number, action: 'accept' | 'reject') => {
    // 1. Atualização Otimista: Remove logo o pedido da lista no ecrã para parecer mais rápido
    setRequests(prev => prev.filter(req => req.id !== requestId))

    // 2. Envia o pedido real para a API
    try {
      const endpoint = action === 'accept' ? '/api/friends/accept' : '/api/friends/reject'
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      })
    } catch (error) {
      alert("Erro ao processar o pedido.")
    }
  }

  // =========================================================================
  // RENDERIZAÇÃO DA PÁGINA
  // =========================================================================

  // Ecrã de carregamento inicial escuro para evitar um flash branco
  if (loadingUser) return <div className="min-h-screen bg-[#0b1120] flex justify-center items-center text-slate-300">A carregar...</div>

  // Garante que temos valores válidos caso o fetch do user falhe
  const safeUser = user || { name: "User", avatar: "", year: "", course: "" }
  const userAvatarUrl = getAvatarUrl(safeUser.avatar);

  return (
    // bg-[#0b1120]: Define o fundo principal super escuro de toda a página
    <div className="min-h-screen bg-[#0b1120] text-slate-200 font-sans">
      
      {/* --- HEADER --- */}
      <header className={`${styles.header} bg-[#0f172a] border-b border-slate-800`}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <Image src="/logo.png" alt="Logo EduConnect" width={160} height={40} priority className={styles.logoImage} />
          </Link>

          <nav className={styles.desktopNav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          {/* Ícones de Ação e Navegação do Topo */}
          <div className={styles.actions}>
            <Link href="/search"><Search size={20} /></Link>
            
            {/* Ícone de Pedidos de Amizade (com indicador vermelho se houver pedidos) */}
            <Link href="/friends/requests" className="text-emerald-500 relative">
               <UserPlus size={20} />
               {requests.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </Link>
            
            {/* Ícone de Notificações Gerais */}
            <Link href="/notification" className="relative">
               <Bell size={20} />
               {unreadNotifsCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </Link>
            
            <Link href="/settings"><Settings size={20} /></Link>
            <Link href="/profile">
              <Avatar className="w-8 h-8 cursor-pointer border border-slate-700">
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
      {/* max-w-3xl mx-auto: Centraliza o conteúdo e restringe a largura máxima para leitura confortável */}
      <main className="max-w-3xl mx-auto w-full px-4 py-10 flex flex-col gap-4">
          
         
          <div className="bg-[#151f2b] border border-[#1f3836] rounded-xl p-5 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                  <UserPlus className="text-[#10b981]" size={22} />
                  <h1 className="text-xl font-bold text-white">Pedidos de Amizade</h1>
              </div>
              <span className="text-sm text-[#10b981] cursor-pointer hover:underline flex items-center gap-2">
                  <Check size={16} /> Aceitar todos
              </span>
          </div>

          {loadingRequests ? (
              // Estado: A carregar pedidos
              <div className="text-center py-10 text-slate-400">A carregar pedidos...</div>
          ) : requests.length === 0 ? (
              // Estado: Lista vazia 
              <div className="bg-[#151f2b] border border-[#1f3836] rounded-xl flex flex-col items-center justify-center text-center py-16">
                  <UserPlus size={40} className="text-slate-500 mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold text-white mb-1">Sem pedidos pendentes</h3>
                  <p className="text-slate-400 text-sm">Não tens novos pedidos de amizade no momento.</p>
              </div>
          ) : (
              // Estado: Lista de pedidos
              <div className="flex flex-col gap-3">
                  {requests.map((req) => {
                      const reqAvatarUrl = getAvatarUrl(req.avatar);
                      return (
                       
                        <div key={req.id} className="bg-[#151f2b] border border-[#1f3836] rounded-xl p-4 flex items-center justify-between shadow-sm transition-all hover:bg-[#1a2533]">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-11 h-11 border border-slate-700">
                                    {reqAvatarUrl && <AvatarImage src={reqAvatarUrl} className="object-cover" />}
                                    <AvatarFallback className="bg-emerald-600 text-white font-medium text-sm">
                                      {getInitials(req.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-[15px] text-slate-300">
                                        <strong className="text-white font-semibold">{req.name}</strong> enviou-te um pedido de amizade.
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {formatDate(req.timestamp)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                                <Button 
                                    size="sm"
                                    className="bg-transparent border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white h-8 px-3 rounded-lg transition-colors"
                                    onClick={() => handleResponse(req.id, 'accept')}
                                >
                                    Aceitar
                                </Button>
                                <Button 
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 rounded-lg transition-colors"
                                    onClick={() => handleResponse(req.id, 'reject')}
                                >
                                    Recusar
                                </Button>
                            </div>

                        </div>
                      );
                  })}
              </div>
          )}
      </main>

      {/* --- FOOTER MOBILE (Aparece apenas em ecrãs pequenos) --- */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard"><BookOpen className="w-5 h-5" /><span>Feed</span></Link>
          <Link href="/groups"><Users className="w-5 h-5" /><span>Grupos</span></Link>
          <Link href="/chat"><Bell className="w-5 h-5" /><span>Chat</span></Link>
        </div>
      </footer>

    </div>
  )
}