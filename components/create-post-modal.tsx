"use client"

import { useState, useEffect, useRef } from "react"
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CreatePostModalProps {
  user: any
  // Atualizado para receber o ID do tópico (number)
  onCreatePost: (content: string, file: File | null, topicId: number) => Promise<void>
}

export default function CreatePostModal({ user, onCreatePost }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // TÓPICOS DA TUA BD
  const [topics, setTopics] = useState<{id: number, nome: string}[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number>(0)

  useEffect(() => {
    const fetchTopics = async () => {
      const res = await fetch("/api/topics")
      if (res.ok) {
        const data = await res.json()
        setTopics(data)
        if (data.length > 0) setSelectedTopicId(data[0].id)
      }
    }
    fetchTopics()
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const removeImage = () => {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
    if (!content.trim() && !file) return
    setIsSubmitting(true)
    
    try {
      // Passa o ID do tópico selecionado para a função
      await onCreatePost(content, file, selectedTopicId)
      
      setContent("")
      removeImage()
      if (topics.length > 0) setSelectedTopicId(topics[0].id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <textarea
            placeholder={`O que estás a pensar, ${user.name.split(' ')[0]}?`}
            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg p-3 text-sm focus:ring-0 resize-none outline-none dark:text-white min-h-[60px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          
          {previewUrl && (
            <div className="relative mt-2 inline-block">
              <img src={previewUrl} alt="Preview" className="h-32 rounded-md object-cover border" />
              <button onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-900">
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <label className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors">
            <ImageIcon size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} disabled={isSubmitting}/>
          </label>
          
          {/* SELECT DO TÓPICO (LIGADO À BD) */}
          <select 
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(Number(e.target.value))}
            disabled={isSubmitting}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded-md px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
          >
            {topics.length === 0 && <option value={0}>A carregar...</option>}
            {topics.map(t => (
              <option key={t.id} value={t.id}>{t.nome}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={(!content.trim() && !file) || isSubmitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>Publicar</span>
        </button>
      </div>
    </div>
  )
}