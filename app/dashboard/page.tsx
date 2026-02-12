"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, LogOut, Search, Settings, Bell, UserPlus } from "lucide-react"
import CreatePostModal from "@/components/create-post-modal"
import PostCard from "@/components/post-card"
import ChatBubble from "@/components/chat-bubble"
import styles from "./dashboard.module.scss"

// --- Interfaces ---
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

  // 1. CARREGAR UTILIZADOR
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch("/api/user/settings")
        if (!res.ok) throw new Error("Erro ao carregar utilizador")
        
        const data = await res.json()
        
        const adaptedUser: User = {
            id: data.id || 0,
            name: data.nome || data.name || "Estudante",
            email: data.email || "",
            avatar: data.foto_url || data.avatar || "",
            year: data.ano_escolar || data.year || "",
            course: data.curso || data.course || ""
        }
        setUser(adaptedUser)
      } catch (error) {
        console.error("Dashboard: Erro ao carregar user", error)
      }
    }
    loadUser()
  }, [])

  // 2. CARREGAR POSTS
  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await fetch("/api/posts", { cache: 'no-store' })
        
        if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data)) {
                const safeData = data.map((p: any) => ({
                    id: p.id,
                    content: p.content || "",
                    author: p.author || "Anónimo",
                    authorAvatar: p.authorAvatar || "",
                    timestamp: p.timestamp,
                    likes: typeof p.likes === 'number' ? p.likes : 0,
                    isLiked: !!p.isLiked,
                    comments: Array.isArray(p.comments) ? p.comments : [],
                    image: p.image || null
                }))
                setPosts(safeData)
            }
        }
      } catch (error) {
        console.error("Dashboard: Erro ao carregar posts", error)
      } finally {
        setLoading(false)
      }
    }
    loadPosts()
  }, [])

  // 3. CRIAR NOVO POST
  const handleCreatePost = async (postContent: string, file: File | null) => {
    if (!user) return

    const tempImageUrl = file ? URL.createObjectURL(file) : null

    const tempPost: Post = {
        id: Date.now(),
        content: postContent,
        author: user.name,
        authorAvatar: user.avatar,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        comments: [],
        image: tempImageUrl 
    }
    
    setPosts(prev => [tempPost, ...prev])

    try {
        const formData = new FormData()
        formData.append("content", postContent)
        formData.append("userId", user.id.toString())
        if (file) formData.append("image", file)

        const res = await fetch("/api/posts", {
            method: "POST",
            body: formData 
        })

        if (!res.ok) throw new Error("Falha na API")

    } catch (error) {
        console.error("Erro ao criar post:", error)
        alert("Erro ao publicar post.")
        setPosts(prev => prev.filter(p => p.id !== tempPost.id))
    }
  }

  const handleLike = async (postId: number) => {
    setPosts(prev => prev.map(post => post.id === postId ? {
      ...post,
      isLiked: !post.isLiked,
      likes: post.isLiked ? post.likes - 1 : post.likes + 1
    } : post))

    try {
        await fetch("/api/posts/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId })
        })
    } catch (error) {
        console.error("Erro like:", error)
    }
  }

  const handleComment = async (postId: number, commentContent: string) => {
    if (!user) return

    try {
        const res = await fetch("/api/posts/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: postId, content: commentContent })
        })

        if (!res.ok) throw new Error("Erro API")
        const savedComment = await res.json()
        
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return { ...post, comments: [...post.comments, savedComment] }
            }
            return post
        }))

    } catch (error) {
        console.error("Erro ao comentar:", error)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-900 text-white">Carregando EduConnect...</div>
  
  if (!user && !loading) return (
    <div className="flex flex-col justify-center items-center h-screen gap-4 bg-slate-900 text-white">
        <p>Sessão expirada.</p>
        <Link href="/login" className="text-emerald-500 hover:underline">Ir para Login</Link>
    </div>
  )

  const safeUserForUI = user ? { ...user, name: user.name || "Utilizador", avatar: user.avatar || "" } : { id: 0, name: "", avatar: "", email: "", year: "", course: "" };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerInner}>

          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoBox}>
                <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span>EduConnect</span>
          </Link>

          <nav className={styles.desktopNav}>
            <Link href="/dashboard" className={styles.activeLink}>Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/search"><Search className="w-5 h-5" /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            <Link href="/profile">
              <Avatar className={styles.avatar}>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-slate-700 text-white">{user?.name ? user.name[0].toUpperCase() : 'U'}</AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5 hover:text-red-400" /></Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.feed}>
          <CreatePostModal user={safeUserForUI} onCreatePost={handleCreatePost} />
          
          {posts.length > 0 ? (
            posts.map(post => (
                <PostCard 
                    key={post.id} 
                    post={post} 
                    currentUser={safeUserForUI} 
                    onLike={handleLike} 
                    onComment={handleComment} 
                />
            ))
          ) : (
             <div className="text-center py-10 text-gray-500">
               {loading ? "A carregar posts..." : "Ainda não há publicações."}
             </div>
          )}
        </section>
      </main>

      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard" className={styles.activeLink}>
            <BookOpen className="w-5 h-5" />
            <span>Feed</span>
          </Link>
          <Link href="/groups">
            <BookOpen className="w-5 h-5" />
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