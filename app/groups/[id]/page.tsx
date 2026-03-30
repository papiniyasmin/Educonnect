"use client"; 

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, MessageCircle, Send, X, Clock, BookOpen, Lock,
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell,
  Image as ImageIcon, MoreVertical, Trash2, Pencil, Loader2
} from "lucide-react";

import styles from "./groupPage.module.scss";

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

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
    if (textToAnalyze.includes("ingl") || textToAnalyze.includes("frances") || textToAnalyze.includes("lingua")) return <MessageCircle {...iconProps} />;
    if (textToAnalyze.includes("program") || textToAnalyze.includes("tic") || textToAnalyze.includes("informat") || textToAnalyze.includes("computa") || textToAnalyze.includes("robot")) return <Code {...iconProps} />;
    if (textToAnalyze.includes("art") || textToAnalyze.includes("desenh") || textToAnalyze.includes("pintura")) return <Palette {...iconProps} />;
    if (textToAnalyze.includes("music") || textToAnalyze.includes("banda")) return <Music {...iconProps} />;
    if (textToAnalyze.includes("filosof") || textToAnalyze.includes("psicol")) return <BrainCircuit {...iconProps} />;
    if (textToAnalyze.includes("desporto") || textToAnalyze.includes("futebol") || textToAnalyze.includes("futsal")) return <Dumbbell {...iconProps} />;
    
    return <BookOpen {...iconProps} />;
};

const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// =========================================================================
// INTERFACES
// =========================================================================

interface Comment { id: number; content: string; author: string; authorAvatar: string | null; timestamp: string; }
interface Post { id: number; title: string; content: string; timestamp: string; type: 'duvida' | 'dica' | 'experiencia' | 'geral'; authorName: string; authorAvatar: string | null; image?: string | null; comentarios: Comment[]; isOwner?: boolean; }
interface GroupDetails { id: number; name: string; description: string; type: string; memberCount: number; avatar: string; isJoined: boolean; }
interface CurrentUser { name: string; avatar: string | null; }

export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para Criar Novo Post
  const [isCreateOpen, setIsCreateOpen] = useState(false); // <--- Lógica adicionada
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Comentar
  const [expandedComments, setExpandedComments] = useState<number[]>([]); 
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({}); 
  const [isSendingComment, setIsSendingComment] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Estados para Editar
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false);
  
  // Imagem expandida
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  async function fetchData() {
    try {
      if (!groupId) return;
      // Adicionei a chamada para obter o utilizador atual (ajusta o endpoint de acordo com o teu backend)
      const [resDetails, resPosts, resUser] = await Promise.all([
        fetch(`/api/groups/${groupId}/details`, { cache: 'no-store' }), 
        fetch(`/api/groups/${groupId}/posts`, { cache: 'no-store' }),
        fetch('/api/user/settings', { cache: 'no-store' }) // Usando o mesmo endpoint do teu Dashboard
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
      if (resUser.ok) {
        const userData = await resUser.json();
        setCurrentUser({
            name: userData.nome || userData.name || "Utilizador",
            avatar: userData.foto_url || userData.avatar || null
        });
      }
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, [groupId]);

  // AÇÕES DO UTILIZADOR
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => { 
    setSelectedImage(null); 
    setImagePreview(null); 
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        setIsCreateOpen(false); // Fecha a área ao publicar com sucesso
        await fetchData();
      }
    } catch (error) { console.error(error); } 
    finally { setIsPosting(false); }
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

  async function handleEditPost(postId: number) {
    if (!editContent.trim() && !editImagePreview) return;
    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      if (editImageFile) formData.append("image", editImageFile);
      if (editImageRemoved) formData.append("removeImage", "true");
  
      const response = await fetch(`/api/posts/${postId}`, { method: 'PUT', body: formData });
      const result = await response.json();
  
      if (response.ok) {
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              content: editContent,
              image: result.updatedImage ? `${result.updatedImage}?t=${Date.now()}` : (editImageRemoved ? null : post.image)
            };
          }
          return post;
        }));
        setEditingPostId(null);
        setEditImageFile(null);
        setEditImageRemoved(false);
      }
    } catch (error) { console.error(error); } finally { setIsSavingEdit(false); }
  }

  const toggleComments = (postId: number) => {
    setExpandedComments(prev => prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]);
  };

  async function handleSendComment(postId: number, e?: React.FormEvent) {
    if (e) e.preventDefault();
    const text = commentTexts[postId] || "";
    if (!text.trim()) return;
    
    setIsSendingComment(postId);
    try {
      const response = await fetch('/api/posts/comment', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content: text }),
      });
      if (response.ok) {
        setCommentTexts(prev => ({ ...prev, [postId]: "" }));
        await fetchData(); 
      }
    } catch (error) { console.error(error); } finally { setIsSendingComment(null); }
  }

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, postId: number) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendComment(postId);
    }
  }

  function formatDate(isoString: string) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    
    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <div className={styles.container}>A carregar grupo...</div>;
  if (!group) return <div className={styles.container}><p>Grupo não encontrado.</p></div>;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 pb-10 ${styles.container}`}>
      <div className="max-w-2xl mx-auto w-full pt-6 px-4">
        
        {/* === CABEÇALHO DO GRUPO === */}
        <div className="mb-6">
          <Link href="/groups">
              <Button variant="ghost" size="sm" className="mb-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pl-0">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Grupos
              </Button>
          </Link>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-emerald-500 overflow-hidden shadow-inner">
                   {getGroupIcon(group.type, group.name, group.avatar)}
              </div>
              <div className="flex-1">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1">{group.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{group.type}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">• {group.memberCount} Membros</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{group.description}</p>
              </div>
          </div>
        </div>

        {/* === CAIXA DE CRIAÇÃO DE POST === */}
        {group.isJoined ? (
            !isCreateOpen ? (
              // ESTADO FECHADO
              <div 
                onClick={() => setIsCreateOpen(true)}
                className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex items-center gap-3 cursor-text hover:border-slate-300 dark:hover:border-slate-600 transition-all"
              >
                <Avatar className="w-10 h-10 border border-slate-100 dark:border-slate-700">
                  <AvatarImage src={currentUser?.avatar || ""} className="object-cover" />
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                    {getInitials(currentUser?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-full px-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none">
                  Partilha algo com o grupo{currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ""}...
                </div>
              </div>
            ) : (
              // ESTADO ABERTO
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 w-full mb-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nova Publicação</span>
                  <button 
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors uppercase tracking-wider"
                  >
                    Cancelar
                  </button>
                </div>
                
                <div className="flex flex-col">
                  <textarea
                    placeholder="Escreve aqui..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-emerald-500 resize-none outline-none dark:text-white min-h-[50px] max-h-[150px] transition-all"
                    value={newPostContent}
                    onChange={(e) => {
                      setNewPostContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    disabled={isPosting}
                    autoFocus
                  />
                  
                  {imagePreview && (
                    <div className="relative mt-2 inline-block self-start animate-in fade-in zoom-in duration-200">
                      <img src={imagePreview} alt="Preview" className="h-24 rounded-md object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                      <button onClick={removeImage} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1 hover:bg-slate-900 shadow-md">
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-md cursor-pointer transition-colors flex items-center gap-1.5">
                    <ImageIcon size={18} />
                    <span className="text-xs font-medium">Foto</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} ref={fileInputRef} disabled={isPosting}/>
                  </label>
          
                  <button 
                    onClick={handleCreatePost}
                    disabled={(!newPostContent.trim() && !selectedImage) || isPosting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 h-8 shadow-sm"
                  >
                    {isPosting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>Publicar</span>
                  </button>
                </div>
              </div>
            )
        ) : (
            <div className="mb-6 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm text-center flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Modo de visualização. Junta-te ao grupo para publicar e comentar.</span>
            </div>
        )}

        {/* === FEED DE PUBLICAÇÕES === */}
        <div className="flex flex-col gap-3">
          {posts.length === 0 ? (
              <div className="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Ainda não há mensagens neste grupo. Sê o primeiro!</p>
              </div>
          ) : (
              posts.map((post) => (
                  <Card key={post.id} className="w-full overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                      
                      {/* --- CABEÇALHO DO POST --- */}
                      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                              <AvatarImage src={post.authorAvatar || ""} />
                              <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{post.authorName}</span>
                                {post.type && (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${post.type === 'duvida' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : post.type === 'dica' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {post.type}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" /> {formatDate(post.timestamp)}
                              </span>
                          </div>
                        </div>

                        {/* Menu Editar/Apagar */}
                        {post.isOwner && (
                            <div className="relative">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                              {openMenuId === post.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl z-10 overflow-hidden">
                                  <button onClick={() => {
                                      setEditingPostId(post.id); setEditContent(post.content); setEditImagePreview(post.image || null); setEditImageRemoved(false); setOpenMenuId(null);
                                    }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <Pencil className="w-4 h-4" /> Editar
                                  </button>
                                  <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" /> Apagar
                                  </button>
                                </div>
                              )}
                            </div>
                        )}
                      </CardHeader>

                      {/* --- CORPO DO POST --- */}
                      <CardContent className="px-3 py-1 mt-1">
                          {editingPostId === post.id ? (
                            <div className="mt-2 space-y-2 border border-blue-200 dark:border-blue-900/50 p-3 rounded-lg bg-blue-50/50 dark:bg-slate-900/50">
                              <textarea 
                                value={editContent}
                                onChange={(e) => { setEditContent(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none min-h-[60px]"
                              />
                              {editImagePreview && (
                                <div className="relative mb-2 inline-block">
                                  <img src={editImagePreview} alt="Preview" className="max-h-32 rounded border border-slate-200 dark:border-slate-700" />
                                  <button onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(true); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm">
                                      <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                              <div className="flex justify-between items-center mt-2">
                                <label className="cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <ImageIcon className="w-4 h-4" /> Mudar Imagem
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                        if(e.target.files?.[0]) { setEditImageFile(e.target.files[0]); setEditImagePreview(URL.createObjectURL(e.target.files[0])); setEditImageRemoved(false); }
                                    }} />
                                </label>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="h-7 px-3 text-xs" onClick={() => setEditingPostId(null)}>Cancelar</Button>
                                  <Button size="sm" className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => handleEditPost(post.id)} disabled={isSavingEdit}>
                                    {isSavingEdit ? "A guardar..." : "Guardar"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                          )}
                      </CardContent>

                      {/* --- IMAGEM DO POST --- */}
                      {!editingPostId && post.image && (
                        <div 
                          className="w-full bg-slate-50 dark:bg-slate-900 flex justify-center items-center border-y border-slate-100 dark:border-slate-700 mt-2 cursor-pointer transition-opacity hover:opacity-95"
                          onClick={() => setExpandedImage(post.image as string)}
                        >
                          <img src={post.image} alt="Conteúdo" className="w-full h-auto max-h-[200px] object-contain block" />
                        </div>
                      )}

                      {/* --- RODAPÉ E COMENTÁRIOS --- */}
                      <CardFooter className="flex flex-col p-2 gap-1">
                        <div className="flex items-center gap-4 w-full border-t border-slate-100 dark:border-slate-700 pt-2 px-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`gap-1.5 h-8 px-2 ${expandedComments.includes(post.id) ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"}`}
                            onClick={() => toggleComments(post.id)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-xs">{post.comentarios?.length || 0} {post.comentarios?.length === 1 ? 'Comentário' : 'Comentários'}</span>
                          </Button>
                        </div>

                        {/* Expandir Secção de Comentários */}
                        {expandedComments.includes(post.id) && (
                          <div className="w-full flex flex-col mt-1 border-t border-slate-100 dark:border-slate-700 pt-2 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
                            
                            {/* Lista de Comentários Inline (Bolhas) */}
                            {post.comentarios && post.comentarios.length > 0 && (
                              <div className="w-full flex flex-col gap-2 mb-2">
                                {post.comentarios.map((com) => (
                                  <div key={com.id} className="flex gap-2 items-start">
                                    <Avatar className="w-6 h-6 mt-0.5">
                                      <AvatarImage src={com.authorAvatar || ""} />
                                      <AvatarFallback className="text-[10px]">{getInitials(com.author)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col bg-slate-100 dark:bg-slate-900/80 px-3 py-2 rounded-2xl rounded-tl-none text-xs w-auto max-w-[90%]">
                                      <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-bold text-slate-900 dark:text-slate-100">{com.author}</span>
                                          <span className="text-[9px] text-slate-500 font-medium">{formatDate(com.timestamp)}</span>
                                      </div>
                                      <span className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{com.content}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Caixa para Escrever Comentário */}
                            {group.isJoined ? (
                              <form onSubmit={(e) => handleSendComment(post.id, e)} className="flex gap-2 w-full items-end mt-1 relative">
                                <Avatar className="w-6 h-6 absolute left-1 bottom-1.5 hidden sm:block">
                                  <AvatarImage src={currentUser?.avatar || ""} />
                                  <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 font-bold">
                                    {getInitials(currentUser?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <textarea 
                                  placeholder="Escreve uma resposta..." 
                                  value={commentTexts[post.id] || ""}
                                  rows={1}
                                  onChange={(e) => {
                                    setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }));
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  onKeyDown={(e) => handleCommentKeyDown(e, post.id)}
                                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded-2xl sm:pl-9 px-3 py-1.5 text-xs resize-none min-h-[30px] max-h-[100px] overflow-y-auto"
                                />
                                <Button type="submit" size="icon" disabled={!commentTexts[post.id]?.trim() || isSendingComment === post.id} className="text-emerald-600 hover:bg-emerald-50 bg-transparent shadow-none h-8 w-8 mb-0 rounded-full flex-shrink-0">
                                  {isSendingComment === post.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                              </form>
                            ) : (
                                <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-center flex items-center justify-center gap-1.5">
                                    <Lock className="w-3 h-3" /> Apenas membros podem responder.
                                </p>
                            )}
                          </div>
                        )}
                      </CardFooter>
                  </Card>
              )) 
          )}
        </div>
      </div>

      {/* MODAL DE IMAGEM EXPANDIDA */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setExpandedImage(null)}>
          <button onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black/50 rounded-full p-2 transition-transform hover:scale-110">
            <X className="w-6 h-6" />
          </button>
          <img src={expandedImage} alt="Expandido" className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}