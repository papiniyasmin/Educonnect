"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea"; 
import { 
  ArrowLeft, MessageSquare, Send, X, Clock, BookOpen, Lock,
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell,
  Image as ImageIcon, MoreVertical, Trash2, Pencil
} from "lucide-react";

import styles from "./groupPage.module.scss";

// --- HELPERS ---
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
    if (avatarUrl && avatarUrl.trim() !== "") {
      return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
    }
    const textToAnalyze = (subject + " " + name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const iconProps = { className: "w-8 h-8 text-white" };
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

interface Comment { id: number; content: string; author: string; authorAvatar: string | null; timestamp: string; }
interface Post { id: number; title: string; content: string; timestamp: string; type: 'duvida' | 'dica' | 'experiencia' | 'geral'; authorName: string; authorAvatar: string | null; image?: string | null; comentarios: Comment[]; isOwner?: boolean; }
interface GroupDetails { id: number; name: string; description: string; type: string; memberCount: number; avatar: string; isJoined: boolean; }

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null); 
  const [imagePreview, setImagePreview] = useState<string | null>(null); 
  const [isPosting, setIsPosting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Estados integrados para a edição
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Estados para manipulação da imagem na edição
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false);

  async function fetchData() {
    try {
      if (!groupId) return;
      // Adicionado cache: 'no-store' para garantir dados sempre atualizados do servidor
      const [resDetails, resPosts] = await Promise.all([
        fetch(`/api/groups/${groupId}/details`, { cache: 'no-store' }), 
        fetch(`/api/groups/${groupId}/posts`, { cache: 'no-store' })
      ]);
      if (resDetails.ok) {
        const dataGroup = await resDetails.json();
        setGroup({
            id: dataGroup.id,
            name: dataGroup.name || dataGroup.nome,
            description: dataGroup.description || dataGroup.descricao,
            type: dataGroup.subject || dataGroup.materia || dataGroup.tipo || "Geral",
            memberCount: dataGroup.memberCount || dataGroup.membros || 0,
            avatar: dataGroup.avatar || dataGroup.foto_url || "",
            isJoined: !!dataGroup.isJoined
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

  useEffect(() => { fetchData(); }, [groupId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => { setSelectedImage(null); setImagePreview(null); };

  async function handleCreatePost() {
    if (!newPostContent.trim() && !selectedImage) return; 
    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", newPostContent);
      formData.append("type", "geral");
      if (selectedImage) formData.append("image", selectedImage);

      const response = await fetch(`/api/groups/${groupId}/posts`, { method: 'POST', body: formData });
      if (response.ok) {
        setNewPostContent("");
        removeImage();
        await fetchData(); 
      }
    } catch (error) { console.error(error); } finally { setIsPosting(false); }
  }

  async function handleDeletePost(postId: number) {
    if (!confirm("Tens a certeza? Esta ação apagará a mensagem permanentemente.")) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        setOpenMenuId(null);
      }
    } catch (error) { console.error(error); }
  }

  // Função handleEditPost integrada
  async function handleEditPost(postId: number) {
    // Prevenção: não permite guardar se estiver vazio (sem texto e sem imagem)
    if (!editContent.trim() && !editImagePreview) return;
    
    setIsSavingEdit(true);
    
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      
      if (editImageFile) formData.append("image", editImageFile);
      if (editImageRemoved) formData.append("removeImage", "true");
  
      // Chamada à API (método PUT para atualização)
      const response = await fetch(`/api/posts/${postId}`, { 
        method: 'PUT', 
        body: formData 
      });
      
      const result = await response.json();
  
      if (response.ok) {
        // Atualiza o estado dos posts localmente para reflexo imediato na UI
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              content: editContent,
              // Adiciona timestamp à imagem nova para evitar cache do browser, ou remove se foi apagada
              image: result.updatedImage 
                ? `${result.updatedImage}?t=${Date.now()}` 
                : (editImageRemoved ? null : post.image)
            };
          }
          return post;
        }));
  
        // Reseta os estados de edição após o sucesso
        setEditingPostId(null);
        setEditImageFile(null);
        setEditImageRemoved(false);
        
        // Opcional: Atualiza a lista completa a partir do servidor para garantir sincronia
        fetchData(); 
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsSavingEdit(false); 
    }
  }

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
      }
    } catch (error) { console.error(error); } finally { setIsSending(false); }
  }

  function formatDate(isoString: string) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString('pt-PT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }

  const getBadgeClass = (type: string) => {
    const t = type?.toLowerCase();
    if (t === 'duvida') return styles.duvida;
    if (t === 'dica') return styles.dica;
    return styles.default;
  };

  if (loading) return <div className={styles.container}>A carregar grupo...</div>;
  if (!group) return <div className={styles.container}><p>Grupo não encontrado.</p></div>;

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* CABEÇALHO DO GRUPO */}
        <div className="mb-8">
          <Link href="/groups">
              <Button variant="ghost" className={styles.backButton}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Grupos
              </Button>
          </Link>
          <div className={styles.groupHeaderCard}>
              <div className="flex items-center gap-4 mb-4">
                  <div className={`${styles.avatarBox} w-16 h-16 rounded-lg flex items-center justify-center bg-blue-600`}>
                       {getGroupIcon(group.type, group.name, group.avatar)}
                  </div>
                  <div>
                      <h1>{group.name}</h1>
                      <div className={styles.groupMeta}>
                        <span className={styles.typeTag}>{group.type}</span>
                        <span className={styles.memberCount}>{group.memberCount} Membros</span>
                      </div>
                  </div>
              </div>
              <p className="text-gray-300 ml-1">{group.description}</p>
          </div>
        </div>

        {/* ÁREA DE CRIAÇÃO DE POST */}
        {group.isJoined ? (
            <Card className="mb-8 border-slate-700 bg-slate-800 shadow-xl">
                <CardContent className="p-4">
                    <Textarea 
                        placeholder="Partilha algo com o grupo..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="mb-3 bg-slate-900 border-slate-700 text-white resize-none focus:ring-blue-500"
                        rows={3}
                    />
                    {imagePreview && (
                      <div className="relative mb-4 inline-block">
                        <img src={imagePreview} alt="Preview" className="max-h-48 rounded-md border border-slate-700 object-contain" />
                        <button onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-transform hover:scale-110">
                            <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex justify-between items-center border-t border-slate-700 pt-3">
                        <div>
                          <input type="file" accept="image/*" id="group-image-upload" className="hidden" onChange={handleImageChange} />
                          <label htmlFor="group-image-upload" className="cursor-pointer flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors p-2 rounded-md hover:bg-slate-700/50">
                              <ImageIcon className="w-5 h-5" />
                              <span className="text-sm font-medium">Foto / Documento</span>
                          </label>
                        </div>
                        <Button 
                            onClick={handleCreatePost} 
                            disabled={isPosting || (!newPostContent.trim() && !selectedImage)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                            {isPosting ? "A publicar..." : <><Send className="w-4 h-4 mr-2" /> Publicar</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Estás em modo de visualização. Junta-te ao grupo para interagir.</span>
            </div>
        )}

        {/* FEED DE POSTS */}
        <div className={styles.postsSection}>
          <div className={styles.sectionHeader}>
              <h2>Discussão Recente</h2>
          </div>
          
          {posts.length === 0 ? (
              <div className={styles.emptyState}>
                  <p>Ainda não há mensagens neste grupo. Sê o primeiro!</p>
              </div>
          ) : (
              posts.map((post) => (
                  <Card key={post.id} className={styles.postCard}>
                      <CardHeader className={styles.cardHeader}>
                          <div className="flex justify-between items-start w-full">
                            <div className={styles.headerContent}>
                              <div className={styles.authorInfo}>
                                  <Avatar className={styles.avatar}>
                                      <AvatarImage src={post.authorAvatar || ""} />
                                      <AvatarFallback>{post.authorName?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className={styles.authorText}>
                                      <p className="font-semibold">{post.authorName}</p>
                                      <div className={styles.timestamp}>
                                          <Clock className="w-3 h-3" />
                                          <span>{formatDate(post.timestamp)}</span> 
                                      </div>
                                  </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <span className={`${styles.postTypeBadge} ${getBadgeClass(post.type)}`}>
                                    {post.type || 'Geral'}
                                </span>
                                
                                {post.isOwner && (
                                    <div className="relative">
                                      <Button 
                                        variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                      >
                                        <MoreVertical className="w-5 h-5" />
                                      </Button>
                                      
                                      {openMenuId === post.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-10 overflow-hidden">
                                          <button
                                            onClick={() => {
                                              setEditingPostId(post.id);
                                              setEditContent(post.content);
                                              setEditImagePreview(post.image || null);
                                              setEditImageRemoved(false);
                                              setOpenMenuId(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2"
                                          >
                                            <Pencil className="w-4 h-4" /> Editar
                                          </button>
                                          <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                                          >
                                            <Trash2 className="w-4 h-4" /> Apagar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                )}
                            </div>
                          </div>
                      </CardHeader>

                      <CardContent>
                          <div className={styles.mainContent}>
                              {editingPostId === post.id ? (
                                <div className="mt-2 space-y-3 border border-blue-500/30 p-3 rounded-lg bg-slate-800/50">
                                  <Textarea 
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-slate-900 border-slate-600 text-white min-h-[100px]"
                                  />
                                  {editImagePreview && (
                                    <div className="relative mb-2 inline-block">
                                      {/* Usamos o timestamp aqui também para preview imediata se for link */}
                                      <img src={editImagePreview} alt="Preview" className="max-h-40 rounded border border-slate-600" />
                                      <button 
                                        onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(true); }} 
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                                      >
                                          <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <label className="cursor-pointer text-xs text-slate-400 hover:text-white flex items-center gap-1">
                                        <ImageIcon className="w-4 h-4" /> Alterar Foto
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            if(e.target.files?.[0]) {
                                                setEditImageFile(e.target.files[0]);
                                                setEditImagePreview(URL.createObjectURL(e.target.files[0]));
                                                setEditImageRemoved(false);
                                            }
                                        }} />
                                    </label>
                                    <div className="flex gap-2">
                                      <Button variant="ghost" size="sm" onClick={() => setEditingPostId(null)}>Cancelar</Button>
                                      <Button size="sm" className="bg-blue-600" onClick={() => handleEditPost(post.id)} disabled={isSavingEdit}>
                                        {isSavingEdit ? "A guardar..." : "Guardar"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="whitespace-pre-wrap">{post.content}</p>
                                  {post.image && (
                                    <div className="mt-4 rounded-lg overflow-hidden border border-slate-700/50">
                                      <img src={post.image} alt="Post" className="max-w-full h-auto max-h-96 object-contain bg-slate-900/50" />
                                    </div>
                                  )}
                                </>
                              )}
                          </div>

                          {/* SECÇÃO DE RESPOSTAS */}
                          {post.comentarios?.length > 0 && (
                              <div className={styles.commentsSection}>
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

                          {/* INPUT DE RESPOSTA */}
                          <div className={styles.replyArea}>
                              {group.isJoined ? (
                                  replyingTo !== post.id ? (
                                      <Button 
                                          variant="ghost" size="sm" className={styles.btnReplyToggle}
                                          onClick={() => { setOpenMenuId(null); setReplyingTo(post.id); }} 
                                      >
                                          <MessageSquare className="w-4 h-4 mr-2" /> 
                                          {post.comentarios?.length ? "Responder" : "Ser o primeiro a responder"}
                                      </Button>
                                  ) : (
                                      <div className={styles.replyInputWrapper}>
                                          <Textarea 
                                              placeholder="Escreve a tua resposta..."
                                              value={commentText}
                                              onChange={(e) => setCommentText(e.target.value)}
                                              autoFocus
                                              className="bg-slate-900 border-slate-700"
                                          />
                                          <div className={styles.actionButtons}>
                                              <Button variant="ghost" size="sm" onClick={() => { setReplyingTo(null); setCommentText(""); }}>Cancelar</Button>
                                              <Button size="sm" className="bg-blue-600" onClick={() => handleSendComment(post.id)} disabled={isSending || !commentText.trim()}>
                                                  {isSending ? "A enviar..." : "Responder"}
                                              </Button>
                                          </div>
                                      </div>
                                  )
                              ) : (
                                  <p className="text-xs text-slate-500 italic mt-2 flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> Junta-te ao grupo para responder.
                                  </p>
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