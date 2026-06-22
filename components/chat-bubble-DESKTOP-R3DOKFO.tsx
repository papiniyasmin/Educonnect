"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface ChatBubbleProps {
  user: {
    name: string
    avatar: string
  }
  unreadCount?: number
}

export default function ChatBubble({ user, unreadCount = 0 }: ChatBubbleProps) {
  const [isMinimized, setIsMinimized] = useState(true)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg relative"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </Button>
      ) : (
        <div className="w-80 h-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl flex flex-col">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="text-white font-semibold">Chat</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/chat">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white text-xs">
                  Expandir
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-4">Acesso rápido ao chat</p>
              <Link href="/chat">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Abrir Chat Completo</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
