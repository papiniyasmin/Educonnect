"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, MessageCircle, Users, BookOpen, LogOut,
  Search, Settings, Bell, ChevronLeft
} from "lucide-react";
import styles from "./chat.module.scss";

// --- Interfaces ---
interface ChatItem {
  id: number;
  name: string;
  avatar: string | null;
  type: 'private' | 'group';
  subtitle?: string;
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  isMine: boolean;
}

interface User {
  id: number;
  name: string;
  avatar: string | null;
}

export default function ChatPage() {
  // --- Estados ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('private');
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  const getInitials = (name: string | undefined) => {
    if (!name) return "U"; 
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // --- Effects ---
  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setCurrentUser({
            id: data.id,
            name: data.nome || data.name,
            avatar: data.foto_url || data.avatar || null
          });
        }
      })
      .catch(err => console.error("Erro ao carregar user:", err));
  }, []);

  useEffect(() => {
    setChatList([]); 
    fetch(`/api/chat/list?type=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          setChatList(data.items.map((item: any) => ({
            id: item.id,
            name: item.nome, 
            avatar: item.foto_url,
            type: activeTab,
            subtitle: activeTab === 'group' ? item.tipo : item.sub 
          })));
        }
      })
      .catch(err => console.error("Erro ao carregar lista:", err));
  }, [activeTab]);

  useEffect(() => {
    if (!selectedChat || !currentUser) return;
    setMessages([]); 

    fetch(`/api/chat/messages?type=${selectedChat.type}&id=${selectedChat.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages.map((msg: any) => {
            const fromId = msg.senderId || msg.senderid || msg.remetente_id || msg.sender_id || msg.id_remetente;
            return {
              id: msg.id,
              content: msg.conteudo || msg.content,
              timestamp: msg.timestamp,
              senderId: fromId,
              senderName: msg.senderName,
              senderAvatar: msg.senderAvatar,
              isMine: Number(fromId) === Number(currentUser.id) 
            };
          }));
        }
      })
      .catch(err => console.error("Erro ao carregar mensagens:", err));
  }, [selectedChat, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const contentToSend = newMessage;
    setNewMessage(""); 

    const optimisticMsg: Message = {
      id: Date.now(),
      content: contentToSend,
      timestamp: new Date().toISOString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      isMine: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      await fetch("/api/chat/messages", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedChat.type,
          targetId: selectedChat.id,
          content: contentToSend
        }),
      });
    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER DESKTOP */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoArea}>
            <div className={styles.logoIcon}><BookOpen /></div>
            <span>EduConnect</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat" className={styles.activeLink}>Chat</Link>
          </nav>
          <div className={styles.actions}>
            <Link href="/search"><Search /></Link>
            <Link href="/settings"><Settings /></Link>
            <Link href="/profile">
              <Avatar className="w-8 h-8 cursor-pointer border border-slate-700">
                {currentUser?.avatar && <AvatarImage src={currentUser.avatar} />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                    {getInitials(currentUser?.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut /></Link>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        
        {/* SIDEBAR (Esconde no mobile se houver um chat selecionado) */}
        <div className={`${styles.sidebar} ${selectedChat ? styles.hiddenOnMobile : ""}`}>
          <div className={styles.tabs}>
            <button 
              onClick={() => { setActiveTab('private'); setSelectedChat(null); }}
              className={activeTab === 'private' ? styles.activeTab : ''}
            >Privadas</button>
            <button 
              onClick={() => { setActiveTab('group'); setSelectedChat(null); }}
              className={activeTab === 'group' ? styles.activeTab : ''}
            >Grupos</button>
          </div>
          <div className={styles.chatList}>
            {chatList.map((chat) => (
              <div key={chat.id} onClick={() => setSelectedChat(chat)}
                className={`${styles.chatItem} ${selectedChat?.id === chat.id && selectedChat?.type === chat.type ? styles.selected : ""}`}
              >
                <Avatar>
                  <AvatarImage src={chat.avatar || ""} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {chat.type === 'group' ? <Users size={16}/> : getInitials(chat.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.chatInfo}>
                  <h4>{chat.name}</h4>
                  <p>{chat.subtitle || "Sem mensagens"}</p>
                </div>
              </div>
            ))}
            {chatList.length === 0 && (
              <p className={styles.emptyList}>{activeTab === 'private' ? "Nenhuma conversa." : "Nenhum grupo."}</p>
            )}
          </div>
        </div>

        {/* JANELA DE CHAT (Esconde no mobile se NÃO houver chat selecionado) */}
        <div className={`${styles.chatWindow} ${!selectedChat ? styles.hiddenOnMobile : ""}`}>
          {selectedChat ? (
            <>
              <div className={styles.chatHeader}>
                {/* Botão de Voltar (Só aparece no mobile) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={styles.backBtn}
                  onClick={() => setSelectedChat(null)}
                >
                  <ChevronLeft size={24} />
                </Button>

                <Avatar>
                  <AvatarImage src={selectedChat.avatar || ""} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {selectedChat.type === 'group' ? <Users /> : getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.headerInfo}>
                  <h2>{selectedChat.name}</h2>
                  <span>{selectedChat.type === 'group' ? 'Grupo de Estudo' : 'Privado'}</span>
                </div>
              </div>

              <div className={styles.messagesContainer}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${styles.messageRow} ${msg.isMine ? styles.mine : styles.theirs}`}>
                    {selectedChat.type === 'group' && !msg.isMine && (
                      <span className={styles.senderName}>{msg.senderName}</span>
                    )}
                    <div className={styles.bubble}>{msg.content}</div>
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputArea}>
                <form onSubmit={handleSendMessage}>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva a sua mensagem..."
                    className={styles.inputField}
                    disabled={!currentUser} 
                    autoComplete="off"
                  />
                  <Button type="submit" className={styles.sendBtn} disabled={!currentUser || !newMessage.trim()} size="icon">
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <MessageCircle size={64} strokeWidth={1.5} />
              <p>Selecione uma conversa ou grupo para começar.</p>
            </div>
          )}
        </div> 
      </div>

      {/* FOOTER MOBILE NAV */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard">
            <BookOpen className="w-5 h-5" />
            <span>Feed</span>
          </Link>
          <Link href="/groups">
            <Users className="w-5 h-5" />
            <span>Grupos</span>
          </Link>
          <Link href="/chat" className={styles.activeLink}>
            <Bell className="w-5 h-5" />
            <span>Chat</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}