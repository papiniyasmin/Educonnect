"use client"

import { Button } from "@/components/ui/button"
import { MessageCircle, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import clsx from "clsx"

interface ChatBubbleProps {
  user: {
    name: string
    avatar: string
  }
  unreadCount?: number
  className?: string
}

export default function ChatBubble({
  user,
  unreadCount = 0,
  className,
}: ChatBubbleProps) {
  const [isMinimized, setIsMinimized] = useState(true)

  return (
    <div
      className={clsx(
        "fixed z-50 right-3 bottom-20 sm:bottom-4",
        className
      )}
    >
      {isMinimized ? (
        <Button
          onClick={() => setIsMinimized(false)}
          className="
            w-12 h-12 sm:w-14 sm:h-14
            rounded-full bg-emerald-600 hover:bg-emerald-700
            text-white shadow-lg relative
          "
        >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          {unreadCount > 0 && (
            <span className="
              absolute -top-1 -right-1
              w-5 h-5 text-[10px]
              bg-red-500 rounded-full
              flex items-center justify-center font-bold
            ">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      ) : (
        <div
          className="
            bg-slate-800 border border-slate-700 rounded-xl shadow-xl
            w-[calc(100vw-1.5rem)] max-w-sm
            h-[70vh] max-h-[420px]
            flex flex-col
          "
        >
          {/* HEADER */}
          <div className="p-3 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Chat</h3>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/chat">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-slate-400 hover:text-white px-2"
                >
                  Expandir
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* BODY */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm mb-4">
                Acesso rápido ao chat
              </p>
              <Link href="/chat">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                  Abrir Chat Completo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
