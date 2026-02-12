"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  MessageCircle, 
  Users, 
  BookOpen, 
  Search, 
  Bell, 
  Settings, 
  LogOut 
} from "lucide-react";

// Importando SCSS
import styles from "./chat.module.scss";

interface ChatItem {
  id: number;
  name: string;
  avatar: string | null;
  type: 'direct' | 'group';
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

export default function ChatPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [chatList, setChatList] = useState<ChatItem[]>([]);
  const [activeTab, setActiveTab] = useState<'direct' | 'group'>('direct');
  
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Carregar Usuário Logado
  useEffect(() => {
    fetch("/api/user").then(res => res.json()).then(data => {
       setCurrentUser(data.user || data); 
    });
  }, []);

  // 2. Carregar Lista Lateral
  useEffect(() => {
    if (!currentUser) return;
    setChatList([]); 

    if (activeTab === 'direct') {
      fetch("/api/chat/users")
        .then(res => res.json())
        .then(data => {
          if (data.users) {
            setChatList(data.users.map((u: any) => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              type: 'direct',
              subtitle: u.course
            })));
          }
        });
    } else {
      fetch("/api/groups/mine")
        .then(res => res.json())
        .then(data => {
          if (data.groups) {
            setChatList(data.groups.map((g: any) => ({
              id: g.id,
              name: g.nome,
              avatar: g.foto_url,
              type: 'group',
              subtitle: g.tipo
            })));
          }
        });
    }
  }, [currentUser, activeTab]);

  // 3. Carregar Mensagens
  useEffect(() => {
    if (!selectedChat || !currentUser) return;
    
    setMessages([]); 

    let url = "";
    if (selectedChat.type === 'direct') {
      url = `/api/chat/messages?otherId=${selectedChat.id}`;
    } else {
      url = `/api/groups/${selectedChat.id}/messages`;
    }

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content || msg.conteudo,
            timestamp: msg.timestamp,
            senderId: msg.senderId,
            senderName: msg.senderName,
            senderAvatar: msg.senderAvatar,
            isMine: msg.senderId === currentUser.id
          })));
        }
      });
  }, [selectedChat, currentUser]);

  // Scroll automático
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Enviar Mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const tempContent = newMessage;
    setNewMessage("");

    try {
      if (selectedChat.type === 'direct') {
        await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderId: currentUser.id,
            receiverId: selectedChat.id,
            content: tempContent
          }),
        });
      } else {
        await fetch(`/api/groups/${selectedChat.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: tempContent }),
        });
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        content: tempContent,
        timestamp: new Date().toISOString(),
        senderId: currentUser.id,
        isMine: true
      }]);

    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
  };

  if (!currentUser) return <div className={styles.loading}>Carregando...</div>;

  return (
    <div className={styles.container}>
      
      {/* --- HEADER --- */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span>EduConnect</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat" className={styles.activeLink}>Chat</Link>
          </nav>

          <div className={styles.actions}>
            <Link href="/search"><Search className="w-4 h-4 md:w-5 md:h-5" /></Link>
            <Link href="/notifications"><Bell className="w-4 h-4 md:w-5 md:h-5" /></Link>
            <Link href="/settings"><Settings className="w-4 h-4 md:w-5 md:h-5" /></Link>
            <Link href="/profile">
              <Avatar className="w-6 h-6 md:w-8 md:h-8">
                <AvatarImage src={currentUser.avatar || ""} />
                <AvatarFallback className="bg-emerald-600 text-white text-xs">{currentUser.name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-4 h-4 md:w-5 md:h-5" /></Link>
          </div>
        </div>
      </header>

      {/* ÁREA PRINCIPAL */}
      <div className={styles.mainContent}>
        
        {/* SIDEBAR */}
        <div className={styles.sidebar}>
          
          {/* Botões de Aba */}
          <div className={styles.tabs}>
            <button 
              onClick={() => { setActiveTab('direct'); setSelectedChat(null); }}
              className={activeTab === 'direct' ? styles.activeTab : styles.inactiveTab}
            >
              Privadas
            </button>
            <button 
              onClick={() => { setActiveTab('group'); setSelectedChat(null); }}
              className={activeTab === 'group' ? styles.activeTab : styles.inactiveTab}
            >
              Grupos
            </button>
          </div>

          {/* Lista de Chats */}
          <div className={styles.chatList}>
            {chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`${styles.chatItem} ${
                  selectedChat?.id === chat.id && selectedChat?.type === chat.type ? styles.selected : ""
                }`}
              >
                <Avatar>
                  <AvatarImage src={chat.avatar || ""} />
                  <AvatarFallback>
                    {chat.type === 'group' ? <Users size={16}/> : chat.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.chatInfo}>
                  <h4>{chat.name}</h4>
                  <p>{chat.subtitle}</p>
                </div>
              </div>
            ))}
            {chatList.length === 0 && (
              <p className={styles.emptyList}>Nenhuma conversa encontrada.</p>
            )}
          </div>
        </div>

        {/* AREA DO CHAT */}
        <div className={styles.chatWindow}>
          {selectedChat ? (
            <>
              {/* Header do Chat */}
              <div className={styles.chatHeader}>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedChat.avatar || ""} />
                  <AvatarFallback>
                    {selectedChat.type === 'group' ? <Users /> : selectedChat.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.headerInfo}>
                  <h2>{selectedChat.name}</h2>
                  <span>
                    {selectedChat.type === 'group' ? 'Grupo' : 'Mensagem Privada'}
                  </span>
                </div>
              </div>

              {/* Mensagens */}
              <div className={styles.messagesContainer}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${styles.messageRow} ${msg.isMine ? styles.mine : styles.theirs}`}>
                    
                    {selectedChat.type === 'group' && !msg.isMine && (
                      <span className={styles.senderName}>{msg.senderName}</span>
                    )}

                    <div className={`${styles.bubble} ${msg.isMine ? styles.bubbleMine : styles.bubbleTheirs}`}>
                      {msg.content}
                    </div>
                    
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={styles.inputArea}>
                <form onSubmit={handleSendMessage}>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escreva sua mensagem..."
                    className={styles.inputField}
                  />
                  <Button type="submit" className={styles.sendBtn}>
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <MessageCircle size={64} />
              <p>Selecione uma conversa ou grupo para começar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}