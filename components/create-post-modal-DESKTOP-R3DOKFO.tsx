"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ImageIcon, FileText } from "lucide-react"

interface CreatePostModalProps {
  user: {
    id: number
    name: string
    year: string
    course: string
    avatar: string
  }
  onCreatePost: (post: any) => void
}

export default function CreatePostModal({ user, onCreatePost }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [category, setCategory] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsLoading(true)

    let imageUrl: string | null = null

    // Se houver imagem, faz upload
    if (imageFile) {
      const formData = new FormData()
      formData.append("file", imageFile)

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url // URL retornada pelo backend
      } catch (err) {
        console.error("Erro ao fazer upload da imagem:", err)
      }
    }

    // Criar post no backend
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aluno_id: user.id,
          conteudo: content.trim(),
          tipo: category || "geral",
          imagem_url: imageUrl, // opcional
        }),
      })

      const newPost = await res.json()
      onCreatePost(newPost)

      // Resetar campos
      setContent("")
      setCategory("")
      setImageFile(null)
      setImagePreview(null)
      setIsOpen(false)
    } catch (err) {
      console.error("Erro ao criar post:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors">
          <CardContent className="p-4 flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <p className="text-slate-400 flex-1">Compartilhe algo com seus colegas...</p>
            <Plus className="w-5 h-5 text-slate-400" />
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Publicação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Perfil do usuário */}
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback className="bg-emerald-600 text-white">
                {user.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-semibold">{user.name}</h4>
              <div className="flex space-x-2">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 text-xs">{user.year}</Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">{user.course}</Badge>
              </div>
            </div>
          </div>

          {/* Categoria */}
          <Select onValueChange={setCategory}>
            <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
              <SelectValue placeholder="Selecione uma categoria (opcional)" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="duvida">Dúvida Acadêmica</SelectItem>
              <SelectItem value="ajuda">Pedido de Ajuda</SelectItem>
              <SelectItem value="dica">Dica de Estudo</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="evento">Evento</SelectItem>
              <SelectItem value="geral">Geral</SelectItem>
            </SelectContent>
          </Select>

          {/* Conteúdo */}
          <textarea
            placeholder="O que você gostaria de compartilhar?"
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full min-h-[120px] bg-slate-700/50 border-slate-600 text-white p-2 rounded resize-none"
            maxLength={500}
          />
          <div className="text-right text-sm text-slate-400">{content.length}/500</div>

          {/* Upload de imagem */}
          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept="image/*"
              id="imageUpload"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const file = e.target.files[0]
                  setImageFile(file)
                  setImagePreview(URL.createObjectURL(file))
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => document.getElementById("imageUpload")?.click()}
            >
              <ImageIcon className="w-4 h-4 mr-1" />
              Imagem
            </Button>
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-24 h-24 object-contain rounded-lg" />
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={!content.trim() || isLoading}
            >
              {isLoading ? "Publicando..." : "Publicar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
