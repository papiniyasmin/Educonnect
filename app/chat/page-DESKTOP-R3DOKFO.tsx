"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, Bell, Settings, LogOut, Send, MessageCircle } from "lucide-react";

interface User {
  id: number;
  name: string;
  year: string;
  course: string;
  avatar: string | null;
  isOnline?: boolean;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  participant: User;
  messages: Message[];
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pegar usuário logado
  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  
  useEffect(() => {
    if (!user) return;
    fetch("/api/chat/users")
      .then(res => res.json())
      .then(data => {
        const convs: Conversation[] = data.users.map((u: User) => ({
          participant: { ...u, isOnline: true },
          messages: [],
        }));
        setConversations(convs);
        if (convs.length > 0) setSelectedConversation(convs[0]);
      });
  }, [user]);

  // Pegar mensagens da conversa selecionada
  useEffect(() => {
    if (!selectedConversation || !user) return;

    fetch(`/api/chat/messages?otherId=${selectedConversation.participant.id}`)
      .then(res => res.json())
      .then(data => {
        setConversations(prev =>
          prev.map(conv =>
            conv.participant.id === selectedConversation.participant.id
              ? { ...conv, messages: data.messages }
              : conv
          )
        );
        setSelectedConversation(prev => prev ? { ...prev, messages: data.messages } : null);
      });
  }, [selectedConversation?.participant.id, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const payload = {
      senderId: user.id,
      receiverId: selectedConversation.participant.id,
      content: newMessage.trim(),
    };

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const sentMessage: Message = await res.json();

    setConversations(prev =>
      prev.map(conv =>
        conv.participant.id === selectedConversation.participant.id
          ? { ...conv, messages: [...conv.messages, sentMessage] }
          : conv
      )
    );
    setSelectedConversation(prev => prev ? { ...prev, messages: [...prev.messages, sentMessage] } : null);
    setNewMessage("");
  };

  const handleSelectConversation = (conv: Conversation) => setSelectedConversation(conv);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">EduConnect</h1>
            </Link>

            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white">Feed</Link>
              <Link href="/groups" className="text-slate-300 hover:text-white">Grupos</Link>
              <Link href="/chat" className="text-emerald-400 hover:text-emerald-300">Chat</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/search"><Search className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/notifications"><Bell className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/settings"><Settings className="w-4 h-4" /></Link>
            </Button>

            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
                <Link href="/login"><LogOut className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* SIDEBAR DE USUÁRIOS */}
        <div className="w-80 border-r border-slate-700/50 bg-slate-900/50">
          <div className="p-4 border-b border-slate-700/50">
            <Input
              placeholder="Procurar conversas..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-3 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
            />
          </div>
          <div className="overflow-y-auto h-full">
            {conversations.filter(c => c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(conv => (
                <div
                  key={conv.participant.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`p-4 border-b border-slate-700/30 cursor-pointer hover:bg-slate-800/50 transition-colors ${
                    selectedConversation?.participant.id === conv.participant.id ? "bg-slate-800/70" : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={conv.participant.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {conv.participant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{conv.participant.name}</h3>
                      <div className="flex space-x-1 mt-1">
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">{conv.participant.year}</span>
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded">{conv.participant.course}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* CHAT */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedConversation.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}>
                    <div className={`px-4 py-2 rounded-2xl ${msg.senderId === user.id ? "bg-emerald-600 text-white" : "bg-slate-700 text-white"}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 flex space-x-2">
                <Input
                  placeholder="Escreva uma mensagem..."
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button type="submit" disabled={!newMessage.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center text-slate-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4" />
              Selecione uma conversa
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
