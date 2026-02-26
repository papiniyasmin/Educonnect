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

// CORREÇÃO: Certifique-se que o nome do ficheiro na pasta é dashboard.module.scss
import styles from "./dashboard.module.scss"

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
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editContent, setEditContent] = useState<string>("")

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          fetch("/api/user/settings"),
          fetch("/api/posts", { cache: 'no-store' })
        ])

        if (userRes.ok) {
          const data = await userRes.json()
          setUser({
            id: data.id || 0,
            name: data.nome || data.name || "Estudante",
            email: data.email || "",
            avatar: data.foto_url || data.avatar || "",
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
    loadData()
  }, [])

  const handleDeletePost = async (postId: number) => {
    if (!confirm("Desejas eliminar esta publicação?")) return
    setPosts(prev => prev.filter(p => p.id !== postId))
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
    } catch (error) {
      alert("Erro ao eliminar post.")
    }
  }

  const handleStartEdit = (post: Post) => {
    setEditingPostId(post.id)
    setEditContent(post.content)
    setActiveMenu(null)
  }

  // CORREÇÃO: Enviando FormData para coincidir com a API
  const handleSaveEdit = async (postId: number) => {
    if (!editContent.trim()) return

    const previousPosts = [...posts]
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p))
    setEditingPostId(null)

    try {
      const formData = new FormData()
      formData.append("content", editContent)

      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        body: formData // Não definir headers manualmente para FormData
      })

      if (!res.ok) throw new Error("Erro na resposta do servidor")
    } catch (error) {
      alert("Erro ao guardar a edição.")
      setPosts(previousPosts)
    }
  }

  const handleCreatePost = async (postContent: string, file: File | null) => {
    if (!user) return
    const formData = new FormData()
    formData.append("content", postContent)
    if (file) formData.append("image", file)

    try {
      const res = await fetch("/api/posts", { method: "POST", body: formData })
      if (res.ok) {
        const newPost = await res.json()
        setPosts(prev => [newPost, ...prev])
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleLike = async (postId: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p))
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
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    }
  }

  if (loading) return <div className={styles.loadingState}>Carregando EduConnect...</div>
  if (!user) return <div className={styles.errorState}><Link href="/login">Ir para Login</Link></div>

  const safeUserUI = { ...user, name: user.name || "Utilizador", avatar: user.avatar || "" }

  return (
    <div className={styles.container}>
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
            <Link href="/settings"><Settings className={styles.icon} /></Link>
            <Link href="/profile">
              <Avatar className={styles.avatar}>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className={styles.logoutIcon} /></Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.feed}>
          <CreatePostModal user={safeUserUI} onCreatePost={handleCreatePost} />
          
          <div className={styles.postsList}>
            {posts.map(post => (
              <div key={post.id} className={styles.postWrapper}>
                {editingPostId === post.id ? (
                  <div className={styles.editForm}>
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className={styles.editInput}
                      autoFocus
                    />
                    <div className={styles.editActions}>
                      <button onClick={() => setEditingPostId(null)} className={styles.cancelBtn}>Cancelar</button>
                      <button onClick={() => handleSaveEdit(post.id)} className={styles.saveBtn}>Guardar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {user.name === post.author && (
                      <div className={styles.optionsMenu} ref={activeMenu === post.id ? menuRef : null}>
                        <button className={styles.dotsBtn} onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}>
                          <MoreHorizontal size={20} />
                        </button>
                        {activeMenu === post.id && (
                          <div className={styles.dropdown}>
                            <button onClick={() => handleStartEdit(post)} className={styles.editMenuBtn}>
                              <Edit2 size={16} /> <span>Editar</span>
                            </button>
                            <button onClick={() => handleDeletePost(post.id)} className={styles.deleteBtn}>
                              <Trash2 size={16} /> <span>Apagar</span>
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
        </section>
      </main>
    </div>
  )
}