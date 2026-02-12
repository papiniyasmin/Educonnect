"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Image as ImageIcon, X, Loader2 } from "lucide-react"

interface CreatePostModalProps {
  user: any
  // MUDANÇA: Agora aceita texto E arquivo, e retorna uma Promise
  onCreatePost: (content: string, file: File | null) => Promise<void>
}

export default function CreatePostModal({ user, onCreatePost }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // --- MUDANÇA PRINCIPAL: O fetch saiu daqui e foi para o pai ---
  const handleSubmit = async () => {
    if (!content.trim() && !selectedFile) return

    setIsSubmitting(true)

    try {
      // Passamos os dados para o pai processar
      await onCreatePost(content, selectedFile)
      
      // Se deu certo (não deu erro no await), limpamos o form
      setContent("")
      removeImage()
      setIsOpen(false)

    } catch (error) {
      console.error("Erro ao criar post:", error)
      // Não fechamos o modal se der erro, para o user tentar de novo
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- Função para pegar inicial do nome com segurança ---
  const getInitial = (name: string) => name ? name[0].toUpperCase() : 'U'

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-6 cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>{getInitial(user?.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-10 rounded-full flex items-center px-4 text-slate-500">
              No que você está pensando, {user?.name?.split(' ')[0]}?
            </div>
          </div>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar publicação</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-3 py-4">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{getInitial(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea 
              placeholder="Escreva algo..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-none focus-visible:ring-0 p-0 text-base"
              disabled={isSubmitting}
            />

            {/* Preview da Imagem */}
            {previewUrl && (
              <div className="relative mt-2">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full max-h-[300px] object-cover rounded-md border"
                />
                <button 
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageSelect}
              disabled={isSubmitting}
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-slate-500 hover:text-emerald-600"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
            >
              <ImageIcon className="w-5 h-5 mr-2" />
              Foto
            </Button>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={(!content.trim() && !selectedFile) || isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A publicar...
              </>
            ) : (
              "Publicar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}