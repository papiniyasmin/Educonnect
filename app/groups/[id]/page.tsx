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

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Escolhe dinamicamente um ícone com base no nome ou disciplina do grupo.
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
    if (avatarUrl && avatarUrl.trim() !== "") {
      return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
    }
    const textToAnalyze = (subject + " " + name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const iconProps = { className: "w-8 h-8 text-white" };
    
    // Mapeamento de palavras-chave para ícones (Lucide React)
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

// =========================================================================
// INTERFACES (Tipagens TypeScript)
// =========================================================================

interface Comment { id: number; content: string; author: string; authorAvatar: string | null; timestamp: string; }
interface Post { id: number; title: string; content: string; timestamp: string; type: 'duvida' | 'dica' | 'experiencia' | 'geral'; authorName: string; authorAvatar: string | null; image?: string | null; comentarios: Comment[]; isOwner?: boolean; }
interface GroupDetails { id: number; name: string; description: string; type: string; memberCount: number; avatar: string; isJoined: boolean; }

export default function GroupPage() {
  // Puxa o ID do grupo diretamente do URL (ex: /groups/123 -> groupId = "123")
  const params = useParams();
  const groupId = params.id as string;

  // =========================================================================
  // ESTADOS GERAIS DO GRUPO
  // =========================================================================
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // =========================================================================
  // ESTADOS PARA CRIAR NOVO POST
  // =========================================================================
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null); // O ficheiro físico da imagem
  const [imagePreview, setImagePreview] = useState<string | null>(null); // O URL gerado para mostrar no ecrã antes de enviar
  const [isPosting, setIsPosting] = useState(false); // Estado de loading para o botão "Publicar"

  // =========================================================================
  // ESTADOS PARA COMENTAR (RESPONDER A POST)
  // =========================================================================
  const [replyingTo, setReplyingTo] = useState<number | null>(null); // Guarda o ID do post onde o user clicou em "Responder"
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // Controla qual post tem os "3 pontinhos" abertos

  // =========================================================================
  // ESTADOS PARA EDITAR UM POST
  // =========================================================================
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editImageRemoved, setEditImageRemoved] = useState(false); // Flag para saber se o utilizador apagou a foto que já lá estava

  // =========================================================================
  // EFFECTS & FETCHING
  // =========================================================================

  // Função para buscar os dados do grupo e os posts associados
  async function fetchData() {
    try {
      if (!groupId) return;
      // Promise.all carrega as duas rotas ao mesmo tempo.
      // cache: 'no-store' força a ir buscar os dados atualizados à Base de Dados em vez de usar cache antiga.
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
            isJoined: !!dataGroup.isJoined // Muito importante: define se o user está no grupo ou é só "visitante"
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

  // Corre a pesquisa inicial quando o componente monta (e sempre que o ID mudar)
  useEffect(() => { fetchData(); }, [groupId]);

  // =========================================================================
  // HANDLERS (Ações do utilizador)
  // =========================================================================

  // PREVIEW DE IMAGEM: Executa quando se seleciona uma imagem no input de ficheiro
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); // Cria um URL temporário para mostrar a imagem no ecrã imediatamente
    }
  };

  // Remove a imagem selecionada antes de publicar
  const removeImage = () => { setSelectedImage(null); setImagePreview(null); };

  // CRIAR NOVO POST (Com suporte para imagens via FormData)
  async function handleCreatePost() {
    if (!newPostContent.trim() && !selectedImage) return; // Valida que tem texto ou imagem
    setIsPosting(true);
    
    try {
      const formData = new FormData();
      formData.append("content", newPostContent);
      formData.append("type", "geral");
      if (selectedImage) formData.append("image", selectedImage);

      const response = await fetch(`/api/groups/${groupId}/posts`, { method: 'POST', body: formData });
      
      if (response.ok) {
        setNewPostContent(""); // Limpa o input
        removeImage(); // Limpa a imagem escolhida
        await fetchData(); // Recarrega os posts para mostrar o novo
      }
    } catch (error) { console.error(error); } 
    finally { setIsPosting(false); }
  }

  // APAGAR POST
  async function handleDeletePost(postId: number) {
    if (!confirm("Tens a certeza? Esta ação apagará a mensagem permanentemente.")) return;
    try {
      const response = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId)); // Remove localmente (Optimistic update)
        setOpenMenuId(null);
      }
    } catch (error) { console.error(error); }
  }

  // EDITAR POST (Com suporte para mudar/remover a foto)
  async function handleEditPost(postId: number) {
    if (!editContent.trim() && !editImagePreview) return; // Não permite deixar o post 100% vazio
    
    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      formData.append("content", editContent);
      if (editImageFile) formData.append("image", editImageFile); // Se adicionou foto nova
      if (editImageRemoved) formData.append("removeImage", "true"); // Se mandou apagar a que lá estava
  
      const response = await fetch(`/api/posts/${postId}`, { 
        method: 'PUT', 
        body: formData 
      });
      
      const result = await response.json();
  
      if (response.ok) {
        // Atualiza a interface instantaneamente sem precisar de fazer fetch a todos os posts outra vez
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              content: editContent,
              // O truque ?t=Date.now() serve para obrigar o browser a não usar cache se a imagem tiver o mesmo nome
              image: result.updatedImage 
                ? `${result.updatedImage}?t=${Date.now()}` 
                : (editImageRemoved ? null : post.image)
            };
          }
          return post;
        }));
  
        // Reseta tudo
        setEditingPostId(null);
        setEditImageFile(null);
        setEditImageRemoved(false);
      }
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsSavingEdit(false); 
    }
  }

  // RESPONDER AO POST (Comentário)
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
        setCommentText(""); // Limpa caixa de texto
        setReplyingTo(null); // Fecha a área de resposta
        await fetchData(); // Atualiza os dados
      }
    } catch (error) { console.error(error); } finally { setIsSending(false); }
  }

  // Formatador de datas para PT-pt
  function formatDate(isoString: string) {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString('pt-PT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  }

  // Cores dinâmicas para as "badges" (etiquetas de Dúvida, Dica, etc.)
  const getBadgeClass = (type: string) => {
    const t = type?.toLowerCase();
    if (t === 'duvida') return styles.duvida;
    if (t === 'dica') return styles.dica;
    return styles.default;
  };

  // Ecrãs de transição
  if (loading) return <div className={styles.container}>A carregar grupo...</div>;
  if (!group) return <div className={styles.container}><p>Grupo não encontrado.</p></div>;

  // =========================================================================
  // RENDERIZAÇÃO
  // =========================================================================
  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        {/* === SECÇÃO 1: CABEÇALHO DO GRUPO === */}
        <div className="mb-8">
          <Link href="/groups">
              <Button variant="ghost" className={styles.backButton}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar aos Grupos
              </Button>
          </Link>
          <div className={styles.groupHeaderCard}>
              <div className="flex items-center gap-4 mb-4">
                  {/* Avatar do grupo (Foto real ou ícone dinâmico) */}
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

        {/* === SECÇÃO 2: CAIXA DE CRIAÇÃO DE POST === */}
        {/* A caixa de criar post SÓ aparece se o user pertencer ao grupo (group.isJoined) */}
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
                    
                    {/* Visualizador de Imagem (Aparece se o utilizador escolher uma imagem) */}
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
                          {/* Input file escondido - o "label" atua como botão */}
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
            // Mensagem de bloqueio se o utilizador estiver só a visualizar o grupo
            <div className="mb-8 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center flex items-center justify-center gap-2">
                <Lock className="w-5 h-5" />
                <span>Estás em modo de visualização. Junta-te ao grupo para interagir.</span>
            </div>
        )}

        {/* === SECÇÃO 3: FEED DE PUBLICAÇÕES (POSTS) === */}
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
                      
                      {/* --- CABEÇALHO DO POST (Info do autor, data, badge e menu) --- */}
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
                                {/* Tag: Dica, Dúvida ou Experiência */}
                                <span className={`${styles.postTypeBadge} ${getBadgeClass(post.type)}`}>
                                    {post.type || 'Geral'}
                                </span>
                                
                                {/* Menu de opções (3 pontinhos) - Apenas se fores o Dono do post */}
                                {post.isOwner && (
                                    <div className="relative">
                                      <Button 
                                        variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} // Abre o menu deste post específico
                                      >
                                        <MoreVertical className="w-5 h-5" />
                                      </Button>
                                      
                                      {/* Dropdown do Menu */}
                                      {openMenuId === post.id && (
                                        <div className="absolute right-0 mt-1 w-36 bg-slate-800 border border-slate-700 rounded-md shadow-xl z-10 overflow-hidden">
                                          {/* Botão EDITAR (Ativa o modo de edição e preenche os states) */}
                                          <button
                                            onClick={() => {
                                              setEditingPostId(post.id);
                                              setEditContent(post.content);
                                              setEditImagePreview(post.image || null);
                                              setEditImageRemoved(false);
                                              setOpenMenuId(null); // Fecha o menu
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-blue-400 hover:bg-slate-700 flex items-center gap-2"
                                          >
                                            <Pencil className="w-4 h-4" /> Editar
                                          </button>
                                          {/* Botão APAGAR */}
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

                      {/* --- CORPO DO POST (Conteúdo da mensagem e Imagens) --- */}
                      <CardContent>
                          <div className={styles.mainContent}>
                              
                              {/* Se este post estiver no Modo de Edição, mostra as ferramentas de input em vez do texto */}
                              {editingPostId === post.id ? (
                                <div className="mt-2 space-y-3 border border-blue-500/30 p-3 rounded-lg bg-slate-800/50">
                                  <Textarea 
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-slate-900 border-slate-600 text-white min-h-[100px]"
                                  />
                                  
                                  {/* Preview da Imagem no Modo Edição */}
                                  {editImagePreview && (
                                    <div className="relative mb-2 inline-block">
                                      <img src={editImagePreview} alt="Preview" className="max-h-40 rounded border border-slate-600" />
                                      <button 
                                        onClick={() => { setEditImagePreview(null); setEditImageFile(null); setEditImageRemoved(true); }} // Assinala que a imagem foi apagada
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
                                                setEditImageFile(e.target.files[0]); // Guarda ficheiro
                                                setEditImagePreview(URL.createObjectURL(e.target.files[0])); // Preview instantânea
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
                                // MODO DE VISUALIZAÇÃO NORMAL DO POST
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

                          {/* --- SECÇÃO DE COMENTÁRIOS DO POST --- */}
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

                          {/* --- CAIXA DE TEXTO PARA RESPONDER --- */}
                          <div className={styles.replyArea}>
                              {/* Só pode responder se estiver no grupo */}
                              {group.isJoined ? (
                                  // Se ainda não tiver clicado para responder, mostra o botão simples "Responder"
                                  replyingTo !== post.id ? (
                                      <Button 
                                          variant="ghost" size="sm" className={styles.btnReplyToggle}
                                          onClick={() => { setOpenMenuId(null); setReplyingTo(post.id); }} 
                                      >
                                          <MessageSquare className="w-4 h-4 mr-2" /> 
                                          {post.comentarios?.length ? "Responder" : "Ser o primeiro a responder"}
                                      </Button>
                                  ) : (
                                      // Se clicou para responder, mostra a caixa de texto
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
                                  // Bloqueado para "Visitantes"
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