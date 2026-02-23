"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
// Adicionei 'Users' e 'UserIcon' para o footer mobile!
import { BookOpen, LogOut, Search, Settings, Check, X, UserPlus, Bell, Users, User as UserIcon } from "lucide-react"

import styles from "./friendRequests.module.scss"

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

export default function FriendRequestsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loadingUser, setLoadingUser] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [addId, setAddId] = useState("")

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

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleResponse = async (requestId: number, action: 'accept' | 'reject') => {
    setRequests(prev => prev.filter(req => req.id !== requestId))

    try {
      const endpoint = action === 'accept' ? '/api/friends/accept' : '/api/friends/reject'
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      })
    } catch (error) {
      alert("Erro ao processar.")
    }
  }

  const handleAddFriend = async () => {
    if (!addId) return;
    try {
        const res = await fetch("/api/friends/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: addId })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("Pedido enviado com sucesso!");
            setAddId("");
        } else {
            alert("Erro: " + data.error);
        }
    } catch (error) {
        console.error(error);
        alert("Erro ao ligar ao servidor");
    }
  }

  if (loadingUser) return <div className={styles.container}><div className="p-10 text-center">Carregando...</div></div>

  const safeUser = user || { name: "User", avatar: "", year: "", course: "" }

  return (
    <div className={styles.container}>
      
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoBox}>
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span>EduConnect</span>
          </Link>

          <nav className={styles.desktopNav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/search"><Search size={20} /></Link>
            <Link href="/friends" className={styles.activeIcon}>
               <UserPlus size={20} />
               {requests.length > 0 && <span className={styles.badge}></span>}
            </Link>

            <Link href="/settings"><Settings size={20} /></Link>
            
            <Link href="/profile">
              <Avatar className="w-8 h-8">
                <AvatarImage src={safeUser.avatar} />
                <AvatarFallback>{safeUser.name ? safeUser.name[0] : 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            
            <Link href="/login" className={styles.logout}><LogOut size={20} /></Link>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className={styles.main}>
          
          {/* SIDEBAR */}
          <aside className={styles.sidebar}>
            <div className={styles.profileCard}>
              <div className={styles.cardContent}>
                <Avatar className={styles.avatarLarge}>
                  <AvatarImage src={safeUser.avatar} />
                  <AvatarFallback>{safeUser.name ? safeUser.name[0] : 'U'}</AvatarFallback>
                </Avatar>
                <h3>{safeUser.name}</h3>
                <p>{safeUser.year} — {safeUser.course}</p>
              </div>
            </div>
          </aside>

          {/* LISTA DE PEDIDOS */}
          <section className={styles.requestsSection}>
            <div className={styles.pageHeader}>
                <h1>
                    <UserPlus className="inline-block mr-2" />
                    Pedidos de Amizade
                </h1>
            </div>

            {loadingRequests ? (
                <div className={styles.loading}>A carregar pedidos...</div>
            ) : requests.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.iconCircle}>
                        <UserPlus />
                    </div>
                    <h3>Sem pedidos pendentes</h3>
                    <p>Não tens novos pedidos de amizade.</p>
                </div>
            ) : (
                <div className={styles.requestsList}>
                    {requests.map((req) => (
                        <div key={req.id} className={styles.requestCard}>
                            <div className={styles.cardInner}>
                                <div className={styles.userInfo}>
                                    <Avatar className={styles.avatar}>
                                        <AvatarImage src={req.avatar} />
                                        <AvatarFallback>{req.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className={styles.details}>
                                        <h3>{req.name}</h3>
                                        <p className={styles.course}>{req.course}</p>
                                        <p className={styles.date}>
                                            {new Date(req.timestamp).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <Button 
                                        className={styles.btnAccept}
                                        onClick={() => handleResponse(req.id, 'accept')}
                                    >
                                        <Check className="w-4 h-4 mr-2" /> Aceitar
                                    </Button>
                                    
                                    <Button 
                                        variant="outline"
                                        className={styles.btnReject}
                                        onClick={() => handleResponse(req.id, 'reject')}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Recusar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </section>
      </main>

      {/* --- FOOTER MOBILE (Adicionado aqui!) --- */}
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
          <Link href="/profile">
            <UserIcon className="w-5 h-5" />
            <span>Perfil</span>
          </Link>
        </div>
      </footer>

    </div>
  )
}