"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Send, Share2, X } from "lucide-react" // Adicionei o ícone X
import { Input } from "@/components/ui/input"
import { formatDistanceToNow } from "date-fns"
import { pt } from "date-fns/locale"

interface PostCardProps {
  post: any
  currentUser: any
  onLike: (id: number) => void
  onComment: (id: number, text: string) => void
}

export default function PostCard({ post, currentUser, onLike, onComment }: PostCardProps) {
  const [commentText, setCommentText] = useState("")
  // Novo estado para controlar se a imagem está aberta em ecrã cheio
  const [isImageOpen, setIsImageOpen] = useState(false)

  const handleSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!commentText.trim()) return
    onComment(post.id, commentText)
    setCommentText("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmitComment()
    }
  }

  return (
    <>
      <Card className="mb-6 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        
        {/* CABEÇALHO */}
        <CardHeader className="flex flex-row items-center gap-3 p-4 pb-2">
          <Avatar>
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback>{post.author?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{post.author}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {post.timestamp ? formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: pt }) : 'Agora'}
            </span>
          </div>
        </CardHeader>

        {/* CONTEÚDO DE TEXTO */}
        {post.content && (
          <CardContent className="p-4 py-2">
            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>
          </CardContent>
        )}

        {/* ÁREA DA IMAGEM (MINIATURA NO POST) */}
        {post.image && (
          <div 
            className="w-full bg-slate-50 dark:bg-slate-900 flex justify-center items-center border-y border-slate-100 dark:border-slate-700 mt-2 cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setIsImageOpen(true)} // Abre o modal ao clicar
          >
            {/* REDUZI PARA 250px para ficar mais pequena no feed */}
            <img 
              src={post.image} 
              alt="Conteúdo do post" 
              className="w-full h-auto max-h-[250px] object-contain block"
            />
          </div>
        )}

        {/* RODAPÉ */}
        <CardFooter className="flex flex-col p-4 gap-4">
          <div className="flex items-center gap-4 w-full border-t border-slate-100 dark:border-slate-700 pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 ${post.isLiked ? "text-red-500 hover:text-red-600" : "text-slate-500 hover:text-red-500"}`}
              onClick={() => onLike(post.id)}
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? "fill-current" : ""}`} />
              <span>{post.likes}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="gap-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments?.length || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="ml-auto text-slate-500 hover:text-blue-600">
               <Share2 className="w-5 h-5" />
            </Button>
          </div>

          {post.comments && post.comments.length > 0 && (
            <div className="w-full space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border border-slate-100 dark:border-slate-700">
              {post.comments.slice(-3).map((comment: any, idx: number) => (
                <div key={idx} className="text-sm">
                  <span className="font-bold mr-2 text-slate-800 dark:text-slate-200">{comment.author}:</span>
                  <span className="text-slate-600 dark:text-slate-300">{comment.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmitComment} className="flex gap-2 w-full">
            <Input 
              placeholder="Escreva um comentário..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-visible:ring-emerald-500"
            />
            <Button type="submit" size="icon" disabled={!commentText.trim()} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-transparent shadow-none">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>

      {/* --- MODAL DE IMAGEM FULL SCREEN --- */}
      {isImageOpen && post.image && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageOpen(false)}
        >
          {/* Botão Fechar */}
          <button 
            onClick={() => setIsImageOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Imagem Grande */}
          <img 
            src={post.image} 
            alt="Conteúdo expandido" 
            className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  )
}