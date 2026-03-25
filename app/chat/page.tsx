"use client"; 

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Send, MessageCircle, Users, BookOpen, LogOut,
  Search, Settings, Bell, ChevronLeft,UserPlus
} from "lucide-react";
import styles from "./chat.module.scss";

// =========================================================================
// INTERFACES (Tipagens do TypeScript para garantir que os dados têm o formato certo)
// =========================================================================

interface ChatItem {
  id: number;
  name: string;
  avatar: string | null;
  type: 'private' | 'group'; // Define se é um chat com uma pessoa ou um grupo
  subtitle?: string; // Última mensagem ou tipo de grupo para mostrar na lista lateral
}

interface Message {
  id: number;
  content: string;
  timestamp: string;
  senderId: number;
  senderName?: string;
  senderAvatar?: string;
  isMine: boolean; // Flag crucial para saber se a mensagem fica à direita (minha) ou à esquerda (deles)
}

interface User {
  id: number;
  name: string;
  avatar: string | null;
}

export default function ChatPage() {
  // =========================================================================
  // ESTADOS (Variáveis que, quando mudam, fazem o ecrã atualizar)
  // =========================================================================
  
  const [currentUser, setCurrentUser] = useState<User | null>(null); 
  const [chatList, setChatList] = useState<ChatItem[]>([]); 
  const [activeTab, setActiveTab] = useState<'private' | 'group'>('private'); 
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  

  const messagesEndRef = useRef<HTMLDivElement>(null);


  const getInitials = (name: string | undefined) => {
    if (!name) return "U"; 
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // =========================================================================
  // EFFECTS (Ações que correm em momentos específicos do ciclo de vida do componente)
  // =========================================================================

  // 1. Executa APENAS UMA VEZ ao carregar a página: Vai buscar quem é o utilizador logado
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

  // 2. Executa sempre que a aba ('private' ou 'group') muda: Atualiza a lista lateral
  useEffect(() => {
    setChatList([]); // Limpa a lista antes de carregar a nova para não mostrar dados antigos
    fetch(`/api/chat/list?type=${activeTab}`)
      .then(res => res.json())
      .then(data => {
        if (data.items) {
          // Mapeia os dados da BD para o formato que o Frontend espera (ChatItem)
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

  // 3. Executa sempre que clicas num chat diferente: Carrega o histórico de mensagens
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

  // 4. Executa sempre que a lista de mensagens sofre alterações: Faz scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =========================================================================
  // HANDLERS (Funções acionadas por eventos do utilizador)
  // =========================================================================

  // Função para enviar uma nova mensagem
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); //
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const contentToSend = newMessage;
    setNewMessage(""); 

    // OPTIMISTIC UI: Adiciona a mensagem ao ecrã ANTES de o servidor responder.
    // Dá a sensação de que a app é super rápida.
    const optimisticMsg: Message = {
      id: Date.now(), 
      content: contentToSend,
      timestamp: new Date().toISOString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      isMine: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    // Envia o pedido real para a base de dados em background
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

  // =========================================================================
  // RENDERIZAÇÃO DO JSX (A interface visual)
  // =========================================================================
  return (
    <div className={styles.container}>
      
      {/* HEADER DESKTOP (Topo da página) */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoLink}>
            <Image 
              src="/logo.png" 
              alt="Logo EduConnect" 
              width={160} 
              height={40} 
              priority
              className={styles.logoImage} 
            />
          </Link>
          
          <nav className={styles.desktopNav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat" className={styles.activeLink}>Chat</Link>
          </nav>
          
          <div className={styles.actions}>
            <Link href="/search"><Search /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings /></Link>
            
            <Link href="/notification" className={styles.activeIcon}>
              <Bell className="w-5 h-5" />
            </Link>
            
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

      {/* ÁREA PRINCIPAL DO CHAT */}
      <div className={styles.mainContent}>
        
        {/* ================= BARRA LATERAL (LISTA DE CHATS) ================= */}
        {/* A classe 'hiddenOnMobile' esconde a lista nos telemóveis se houver um chat aberto */}
        <div className={`${styles.sidebar} ${selectedChat ? styles.hiddenOnMobile : ""}`}>
          
          {/* Botões para alternar entre conversas Privadas e de Grupo */}
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
          
          {/* Lista scrollável de conversas */}
          <div className={styles.chatList}>
            {chatList.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChat(chat)} // Define o chat clicado como ativo
                className={`${styles.chatItem} ${selectedChat?.id === chat.id && selectedChat?.type === chat.type ? styles.selected : ""}`}
              >
                {/* Foto / Iniciais do utilizador ou grupo */}
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
            
            {/* Mensagem de estado vazio (se não tiver amigos/grupos) */}
            {chatList.length === 0 && (
              <p className={styles.emptyList}>{activeTab === 'private' ? "Nenhuma conversa." : "Nenhum grupo."}</p>
            )}
          </div>
        </div>

        {/* ================= JANELA DO CHAT ATIVO (DIREITA) ================= */}
        {/* Escondida nos telemóveis se NÃO houver nenhum chat selecionado (mostra a lista) */}
        <div className={`${styles.chatWindow} ${!selectedChat ? styles.hiddenOnMobile : ""}`}>
          
          {selectedChat ? (
            <>
              {/* CABEÇALHO DO CHAT */}
              <div className={styles.chatHeader}>
                {/* Botão Voltar: Muito importante para UX em dispositivos móveis (Mobile) */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={styles.backBtn}
                  onClick={() => setSelectedChat(null)} // Tira o chat selecionado, voltando à lista
                >
                  <ChevronLeft size={24} />
                </Button>

                {/* Avatar e Informações de quem estamos a falar */}
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

              {/* LISTA DE MENSAGENS */}
              <div className={styles.messagesContainer}>
                {messages.map((msg, idx) => (
                  <div key={idx} className={`${styles.messageRow} ${msg.isMine ? styles.mine : styles.theirs}`}>
                    
                    {/* Se for num grupo e a mensagem não for minha, mostra o nome de quem enviou */}
                    {selectedChat.type === 'group' && !msg.isMine && (
                      <span className={styles.senderName}>{msg.senderName}</span>
                    )}
                    
                    {/* A bolha da mensagem */}
                    <div className={styles.bubble}>{msg.content}</div>
                    
                    {/* A hora da mensagem formatada (ex: 14:30) */}
                    <span className={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                ))}
                
                {/* Esta div invisível serve como âncora para o scroll descer até ao fim automaticamente */}
                <div ref={messagesEndRef} />
              </div>

              {/* ÁREA DE INPUT (Onde se escreve) */}
              <div className={styles.inputArea}>
                <form onSubmit={handleSendMessage}>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)} // Atualiza o estado enquato se escreve
                    placeholder="Escreva a sua mensagem..."
                    className={styles.inputField}
                    disabled={!currentUser} 
                    autoComplete="off"
                  />
                  {/* Botão desativo se não houver texto ou utilizador */}
                  <Button type="submit" className={styles.sendBtn} disabled={!currentUser || !newMessage.trim()} size="icon">
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            // ESTADO VAZIO (Nenhum chat selecionado na versão Desktop)
            <div className={styles.emptyState}>
              <MessageCircle size={64} strokeWidth={1.5} />
              <p>Selecione uma conversa ou grupo para começar.</p>
            </div>
          )}
        </div> 
      </div>

      {/* FOOTER NAV PARA DISPOSITIVOS MÓVEIS */}
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
          {/* Notei que aqui o ícone do Chat é um Bell (Sino). Podes querer trocar para MessageCircle no futuro */}
          <Link href="/chat" className={styles.activeLink}>
            <Bell className="w-5 h-5" />
            <span>Chat</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}