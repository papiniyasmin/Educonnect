"use client"

import { useState } from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { UserPlus, Check, Loader2, Clock } from "lucide-react"

interface User {
  id: number
  name: string
  avatar?: string
  course?: string
  year?: string
}

export default function UserCard({ user }: { user: User }) {
  // Estados: 'idle' (normal), 'loading' (a enviar), 'sent' (sucesso)
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')

  const handleAddFriend = async () => {
    setStatus('loading')

    try {
      // Substitui '/api/friends/add' pela tua rota real de enviar pedido
      const res = await fetch("/api/friends/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: user.id }),
      })

      if (res.ok) {
        setStatus('sent') // Sucesso: Muda o botão visualmente
      } else {
        setStatus('idle') // Falha: Volta ao normal para tentar de novo
        alert("Erro ao enviar pedido.")
      }
    } catch (error) {
      console.error(error)
      setStatus('idle')
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all mb-3">
      
      {/* Informações do Utilizador */}
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-blue-100 text-blue-600">
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-semibold text-gray-800">{user.name}</h3>
          <p className="text-sm text-gray-500">
            {user.course} {user.year && `• ${user.year}`}
          </p>
        </div>
      </div>

      {/* Botão com Lógica de Estado Local */}
      <div>
        {status === 'sent' ? (
          // ESTADO: PEDIDO ENVIADO
          <Button 
            disabled 
            variant="outline" 
            className="bg-yellow-50 text-yellow-700 border-yellow-200 cursor-not-allowed opacity-100"
          >
            <Clock className="w-4 h-4 mr-2" />
            Pendente
          </Button>
        ) : (
          // ESTADO: NORMAL ou CARREGANDO
          <Button 
            onClick={handleAddFriend} 
            disabled={status === 'loading'}
            className="bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}