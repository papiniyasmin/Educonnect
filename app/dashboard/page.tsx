"use client" 

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image" 
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  BookOpen, LogOut, Search, Settings, Bell, 
  UserPlus, Users, MoreHorizontal, Trash2, Edit2
} from "lucide-react" 
import CreatePostModal from "@/components/create-post-modal"
import PostCard from "@/components/post-card"
import styles from "./dashboard.module.scss"

// =========================================================================
// INTERFACES 
// =========================================================================

interface User {
  id: number
  name: string
  avatar: string
  email: string
  year: string
  course: string
}

interface Post {
  id: number
  content: string
  author: string
  authorAvatar: string
  timestamp: string | Date
  likes: number
  isLiked: boolean
  comments: any[]
  image?: string | null
  topic?: string
}

export default function DashboardPage() {
  // =========================================================================
  // ESTADOS
  // =========================================================================
  const [user, setUser] = useState<User | null>(null) 
  const [posts, setPosts] = useState<Post[]>([]) 
  const [loading, setLoading] = useState(true) 
  
  // Controlo visual
  const [activeMenu, setActiveMenu] = useState<number | null>(null) 
  const menuRef = useRef<HTMLDivElement | null>(null) 
  const [editingPostId, setEditingPostId] = useState<number | null>(null) 
  const [editContent, setEditContent] = useState<string>("") 
  
  // Controla se a área de criar post está aberta ou fechada
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // =========================================================================
  // FUNÇÕES AUXILIARES
  // =========================================================================
  const getInitials = (name: string | undefined) => {
    if (!name) return "U"; 
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadData = async () => {
    try {
      const [userRes, postsRes] = await Promise.all([
        fetch("/api/user/settings"),
        fetch("/api/posts", { cache: 'no-store' }) 
      ])

      if (userRes.ok) {
        const data = await userRes.json()
        const fetchedFotoUrl = data.foto_url || data.avatar;
        const finalAvatarUrl = fetchedFotoUrl 
          ? (fetchedFotoUrl.startsWith("http") || fetchedFotoUrl.startsWith("data:")) 
            ? fetchedFotoUrl 
            : `/uploads/${fetchedFotoUrl}`
          : ""; 

        setUser({
          id: data.id || 0,
          name: data.nome || data.name || "Estudante",
          email: data.email || "",
          avatar: finalAvatarUrl,
          year: data.ano_escolar || data.year || "",
          course: data.curso || data.course || ""
        })
      }

      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false) 
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const handleDeletePost = async (postId: number) => {
    if (!confirm("Desejas eliminar esta publicação?")) return 
    setPosts(prev => prev.filter(p => p.id !== postId))
    setActiveMenu(null)
    try {
      await fetch(`/api/posts/${postId}`, { method: "DELETE" })
    } catch (error) {
      alert("Erro ao eliminar post.")
    }
  }

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id) 
    setEditContent(post.content) 
    setActiveMenu(null)
  }

  const handleSaveEdit = async (postId: number) => {
    if (!editContent.trim()) return 
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p))
    setEditingPostId(null)
    try {
      await fetch(`/api/posts/${postId}`, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent })
      })
    } catch (error) {
      alert("Erro ao guardar a edição.")
    }
  }

  const handleCreatePost = async (postContent: string, file: File | null, topicId: number) => {
    if (!user) return
    const formData = new FormData()
    formData.append("content", postContent)
    formData.append("topicId", topicId.toString())
    if (file) formData.append("image", file)

    try {
      await fetch("/api/posts", { method: "POST", body: formData })
      loadData() 
      // Fecha a área de criar post depois de publicar com sucesso!
      setIsCreateOpen(false) 
    } catch (error) {
      console.error(error)
    }
  }

  const handleLike = async (postId: number) => {
    setPosts(prev => prev.map(p => 
      p.id === postId 
        ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } 
        : p
    ))
    fetch("/api/posts/like", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ postId }) 
    })
  }

  const handleComment = async (postId: number, content: string) => {
    const res = await fetch("/api/posts/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, content })
    })
    if (res.ok) {
      const comment = await res.json()
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p
      ))
    }
  }

  // =========================================================================
  // RENDERIZAÇÃO
  // =========================================================================
  if (loading) return <div className={styles.loadingState}>Carregando EduConnect...</div>
  if (!user) return <div className={styles.errorState}><Link href="/login">Ir para Login</Link></div>
  const safeUserUI = { ...user, name: user.name || "Utilizador", avatar: user.avatar || "" }

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <Image src="/logo.png" alt="Logo" width={160} height={40} priority className={styles.logoImage} />
          </Link>
          <nav className={styles.desktopNav}>
            <Link href="/dashboard" className={styles.activeLink}>Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>
          <div className={styles.actions}>
            <Link href="/search"><Search className={styles.icon} /></Link>
            <Link href="/friends/requests"><UserPlus className={styles.icon} /></Link>
            <Link href="/notification"><Bell className={styles.icon} /></Link>
            <Link href="/settings"><Settings className={styles.icon} /></Link>
            <Link href="/profile">
              <Avatar className={`${styles.avatar} border border-slate-700`}>
                {user.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className={styles.logoutIcon} /></Link>
          </div>
        </div>
      </header>

      {/* FEED */}
      <main className={styles.main}>
        <section className={styles.feed}>
          <div className="max-w-2xl mx-auto w-full px-4">
            
            {/* === ÁREA DE CRIAÇÃO COMPACTA / EXPANDIDA === */}
            {!isCreateOpen ? (
              // ESTADO 1: FECHADO (mb-4 para separar um pouquinho do primeiro post)
              <div 
                onClick={() => setIsCreateOpen(true)}
                className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 flex items-center gap-3 cursor-text hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-700">
                  {user.avatar && <AvatarImage src={user.avatar} className="object-cover" />}
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-full px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none">
                  Partilha algo com a turma, {user.name.split(' ')[0]}...
                </div>
              </div>
            ) : (
              // ESTADO 2: ABERTO
              <div className="mb-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-end mb-2 px-1">
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
                  >
                    Cancelar publicação
                  </button>
                </div>
                <CreatePostModal 
                  user={safeUserUI} 
                  onCreatePost={handleCreatePost} 
                />
              </div>
            )}
            {/* ======================================= */}

            <div className={styles.postsList}>
              {posts.map(post => (
                // Margem SUPER REDUZIDA aqui: mb-2 (8px de espaço)
                <div key={post.id} className="relative mb-2">
                  {editingPostId === post.id ? (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <textarea 
                        value={editContent}
                        rows={1}
                        ref={(el) => {
                          if (el) {
                            el.style.height = "auto"
                            el.style.height = `${el.scrollHeight}px`
                          }
                        }}
                        onChange={(e) => {
                          setEditContent(e.target.value)
                          e.target.style.height = "auto"
                          e.target.style.height = `${e.target.scrollHeight}px`
                        }}
                        className="w-full px-3 py-1.5 text-sm leading-tight bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none min-h-[32px] max-h-[150px] overflow-y-auto"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingPostId(null)} className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-md transition-colors">
                          Cancelar
                        </button>
                        <button onClick={() => handleSaveEdit(post.id)} className="px-3 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors">
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {user.name === post.author && (
                        <div className="absolute top-4 right-4 z-10" ref={activeMenu === post.id ? menuRef : null}>
                          <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}>
                            <MoreHorizontal size={20} />
                          </button>
                          {activeMenu === post.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                              <button onClick={() => handleStartEdit(post)} className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 gap-2">
                                <Edit2 size={16} />
                                <span>Editar</span>
                              </button>
                              <button onClick={() => handleDeletePost(post.id)} className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2">
                                <Trash2 size={16} />
                                <span>Apagar</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <PostCard 
                        post={post} 
                        currentUser={safeUserUI} 
                        onLike={handleLike} 
                        onComment={handleComment} 
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
            
          </div>
        </section>
      </main>

      {/* MENU INFERIOR */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard" className={styles.activeLink}>
            <BookOpen size={20} />
            <span>Feed</span>
          </Link>
          <Link href="/groups">
            <Users size={20} />
            <span>Grupos</span>
          </Link>
          <Link href="/chat">
            <Bell size={20} />
            <span>Chat</span>
          </Link>
        </div>
      </footer>
    </div>
  )
}