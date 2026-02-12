"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea"; 
import { 
  ArrowLeft, MessageSquare, Send, X, Clock, BookOpen,
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell
} from "lucide-react";

import styles from "./groupPage.module.scss";

// --- FUNÇÃO DE ÍCONES CORRIGIDA (Verifica Nome + Matéria) ---
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
    // 1. Imagem personalizada
    if (avatarUrl && avatarUrl.trim() !== "") {
      return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
    }
    
    // 2. Analisa Texto completo
    const textToAnalyze = (subject + " " + name)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const iconProps = { className: "w-8 h-8 text-white" }; // Ícone maior

    if (textToAnalyze.includes("matem") || textToAnalyze.includes("calc")) return <Calculator {...iconProps} />;
    if (textToAnalyze.includes("fisic")) return <Atom {...iconProps} />;
    if (textToAnalyze.includes("biolog") || textToAnalyze.includes("naturais") || textToAnalyze.includes("saude")) return <Dna {...iconProps} />;
    if (textToAnalyze.includes("quimic") || textToAnalyze.includes("laborator")) return <FlaskConical {...iconProps} />;
    if (textToAnalyze.includes("histori")) return <Landmark {...iconProps} />;
    if (textToAnalyze.includes("geografi") || textToAnalyze.includes("mundo")) return <Globe {...iconProps} />;
    if (textToAnalyze.includes("portugu") || textToAnalyze.includes("literatura") || textToAnalyze.includes("leitura") || textToAnalyze.includes("escrita")) return <BookType {...iconProps} />;
    if (textToAnalyze.includes("ingl") || textToAnalyze.includes("frances") || textToAnalyze.includes("lingua")) return <MessageSquare {...iconProps} />;
    if (textToAnalyze.includes("program") || textToAnalyze.includes("tic") || textToAnalyze.includes("informat") || textToAnalyze.includes("computa") || textToAnalyze.includes("robot")) return <Code {...iconProps} />;
    if (textToAnalyze.includes("art") || textToAnalyze.includes("desenh") || textToAnalyze.includes("pintura")) return <Palette {...iconProps} />;
    if (textToAnalyze.includes("music") || textToAnalyze.includes("banda")) return <Music {...iconProps} />;
    if (textToAnalyze.includes("filosof") || textToAnalyze.includes("psicol")) return <BrainCircuit {...iconProps} />;
    if (textToAnalyze.includes("desporto") || textToAnalyze.includes("futebol") || textToAnalyze.includes("futsal")) return <Dumbbell {...iconProps} />;

    return <BookOpen {...iconProps} />;
};

interface Comment {
  id: number;
  content: string;
  author: string;
  authorAvatar: string | null;
  timestamp: string;
}

interface Post {
  id: number;
  title: string;
  content: string;
  timestamp: string;
  type: 'duvida' | 'dica' | 'experiencia' | 'geral'; 
  authorName: string;
  authorAvatar: string | null;
  comentarios: Comment[];
}

interface GroupDetails {
  id: number;
  name: string; 
  description: string;
  type: string;
  memberCount: number;
  avatar: string; 
}

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Comentários
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // --- BUSCAR DADOS ---
  async function fetchData() {
    try {
      if (!groupId) return;
      
      const [resDetails, resPosts] = await Promise.all([
        fetch(`/api/groups/${groupId}/details`), 
        fetch(`/api/groups/${groupId}/posts`)
      ]);

      if (resDetails.ok) {
        const dataGroup = await resDetails.json();
        // Normalização de dados
        setGroup({
            id: dataGroup.id,
            name: dataGroup.name || dataGroup.nome,
            description: dataGroup.description || dataGroup.descricao,
            type: dataGroup.subject || dataGroup.materia || dataGroup.tipo || "Geral",
            memberCount: dataGroup.memberCount || dataGroup.membros || 0,
            avatar: dataGroup.avatar || dataGroup.foto_url || ""
        });
      }

      if (resPosts.ok) {
        const dataPosts = await resPosts.json();
        setPosts(dataPosts);
      }
      
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [groupId]);

  // --- ENVIAR COMENTÁRIO ---
  async function handleSendComment(postId: number) {
    if (!commentText.trim()) return;
    setIsSending(true);

    try {
      const response = await fetch('/api/posts/comment', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: commentText }),
      });

      if (response.ok) {
        setCommentText("");
        setReplyingTo(null);
        await fetchData(); 
      } else {
        const err = await response.json();
        alert(err.error || "Erro ao enviar comentário");
      }
    } catch (error) {
      console.error("Erro ao comentar:", error);
    } finally {
      setIsSending(false);
    }
  }

  // --- HELPERS ---
  function formatDate(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-PT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  }

  const getBadgeClass = (type: string) => {
    const t = type?.toLowerCase();
    if (t === 'duvida') return styles.duvida;
    if (t === 'dica') return styles.dica;
    return styles.default;
  };

  if (loading) return <div className={styles.container}>A carregar grupo...</div>;
  
  if (!group) return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        <p>Grupo não encontrado.</p>
        <Link href="/groups">
           <Button variant="outline" className="mt-4">Voltar à lista</Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* --- CABEÇALHO DO GRUPO --- */}
        <div className="mb-8">
          <Link href="/groups">
              <Button variant="ghost" className={styles.backButton}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Grupos
              </Button>
          </Link>
          
          <div className={styles.groupHeaderCard}>
              <div className="flex items-center gap-4 mb-4">
                  {/* Ícone Grande */}
                  <div className={`${styles.avatarBox} w-16 h-16 rounded-lg flex items-center justify-center bg-blue-600`}>
                       {getGroupIcon(group.type, group.name, group.avatar)}
                  </div>
                  <div>
                      <h1>{group.name}</h1>
                      <div className={styles.groupMeta}>
                        <span className={styles.typeTag}>
                            {group.type}
                        </span>
                        <span className={styles.memberCount}>
                            {group.memberCount} Membros
                        </span>
                      </div>
                  </div>
              </div>
              <p className="text-gray-300 ml-1">{group.description}</p>
          </div>
        </div>

        {/* --- LISTA DE POSTS --- */}
        <div className={styles.postsSection}>
          <div className={styles.sectionHeader}>
              <h2>Discussão Recente</h2>
          </div>
          
          {posts.length === 0 ? (
              <div className={styles.emptyState}>
                  <p>Ainda não há mensagens neste grupo.</p>
                  <p>Sê o primeiro a partilhar algo!</p>
              </div>
          ) : (
              posts.map((post) => (
                  <Card key={post.id} className={styles.postCard}>
                      <CardHeader className={styles.cardHeader}>
                          <div className={styles.headerContent}>
                            <div className={styles.authorInfo}>
                                <Avatar className={styles.avatar}>
                                    <AvatarImage src={post.authorAvatar || ""} />
                                    <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className={styles.authorText}>
                                    <p>{post.authorName}</p>
                                    <div className={styles.timestamp}>
                                        <Clock className="w-3 h-3" />
                                        <span>{formatDate(post.timestamp)}</span> 
                                    </div>
                                </div>
                            </div>
                            <span className={`${styles.postTypeBadge} ${getBadgeClass(post.type)}`}>
                                {post.type || 'Geral'}
                            </span>
                          </div>
                      </CardHeader>

                      <CardContent>
                          <div className={styles.mainContent}>
                              {post.title && <h3>{post.title}</h3>}
                              <p>{post.content}</p>
                          </div>

                          {/* Comentários */}
                          {post.comentarios && post.comentarios.length > 0 && (
                              <div className={styles.commentsSection}>
                                  <h4>{post.comentarios.length} Respostas</h4>
                                  <div className={styles.commentList}>
                                    {post.comentarios.map((com) => (
                                        <div key={com.id} className={styles.commentItem}>
                                            <Avatar className={styles.commentAvatar}>
                                                <AvatarImage src={com.authorAvatar || ""} />
                                                <AvatarFallback>{com.author.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className={styles.commentBubble}>
                                                <div className={styles.bubbleHeader}>
                                                    <span className={styles.author}>{com.author}</span>
                                                    <span className={styles.date}>{formatDate(com.timestamp)}</span>
                                                </div>
                                                <p>{com.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                  </div>
                              </div>
                          )}

                          {/* Área de Resposta */}
                          <div className={styles.replyArea}>
                              {replyingTo !== post.id ? (
                                  <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className={styles.btnReplyToggle}
                                      onClick={() => setReplyingTo(post.id)}
                                  >
                                      <MessageSquare className="w-4 h-4 mr-2" /> 
                                      {post.comentarios?.length ? "Adicionar resposta" : "Ser o primeiro a responder"}
                                  </Button>
                              ) : (
                                  <div className={styles.replyInputWrapper}>
                                      <span className={styles.replyLabel}>A responder a {post.authorName}...</span>
                                      <Textarea 
                                          placeholder="Escreve a tua resposta aqui..."
                                          value={commentText}
                                          onChange={(e) => setCommentText(e.target.value)}
                                          autoFocus
                                      />
                                      <div className={styles.actionButtons}>
                                          <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={() => {
                                                  setReplyingTo(null);
                                                  setCommentText("");
                                              }}
                                              className={styles.btnCancel}
                                          >
                                              <X className="w-4 h-4 mr-2" /> Cancelar
                                          </Button>
                                          <Button 
                                              size="sm" 
                                              onClick={() => handleSendComment(post.id)}
                                              disabled={isSending || !commentText.trim()}
                                              className={styles.btnSend}
                                          >
                                              {isSending ? "A enviar..." : (
                                                  <> <Send className="w-4 h-4 mr-2" /> Enviar </>
                                              )}
                                          </Button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              )) 
          )}
        </div>
      </div>
    </div>
  );
}