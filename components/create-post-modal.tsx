"use client"

import { useState, useEffect, useRef } from "react"
import { Image as ImageIcon, Send, X, Loader2 } from "lucide-react"

interface CreatePostModalProps {
  user: any
  onCreatePost: (content: string, file: File | null, topicId: number) => Promise<void>
}

export default function CreatePostModal({ user, onCreatePost }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
      await onCreatePost(content, file, selectedTopicId)
      setContent("")
      removeImage()
      if (topics.length > 0) setSelectedTopicId(topics[0].id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 w-full">
      <div className="flex flex-col">
        <textarea
          placeholder={`O que estás a pensar, ${user.name.split(' ')[0]}?`}
          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-emerald-500 resize-none outline-none dark:text-white min-h-[50px] max-h-[150px]"
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            e.target.style.height = "auto"
            e.target.style.height = `${e.target.scrollHeight}px`
          }}
          disabled={isSubmitting}
          autoFocus
        />
        
        {previewUrl && (
          <div className="relative mt-2 inline-block self-start">
            <img src={previewUrl} alt="Preview" className="h-24 rounded-md object-cover border border-slate-200 dark:border-slate-700" />
            <button onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-900 shadow-md">
              <X size={12} />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <label className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors">
            <ImageIcon size={18} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} ref={fileInputRef} disabled={isSubmitting}/>
          </label>
          
          <select 
            value={selectedTopicId}
            onChange={(e) => setSelectedTopicId(Number(e.target.value))}
            disabled={isSubmitting}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none rounded-md px-2 py-1 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500 h-8"
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
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 h-8"
        >
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span>Publicar</span>
        </button>
      </div>
    </div>
  )
}