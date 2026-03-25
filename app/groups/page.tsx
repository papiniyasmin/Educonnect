"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Search, Settings, LogOut, Users, Plus, Filter, MessageCircle, X, Bell, UserPlus, Trash2, AlertTriangle,
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell
} from "lucide-react";

import styles from "./groups.module.scss";

// =========================================================================
// INTERFACES (Tipagens TypeScript)
// =========================================================================

interface User {
  id: number;
  name: string;
  avatar: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  subject: string;
  year: string;
  memberCount: number;
  isJoined: boolean; // Diz-nos se o utilizador logado pertence a este grupo
  isPrivate: boolean;
  avatar: string;
  posts: number;
}

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Geração dinâmica de ícones com base na "subject" (matéria) ou no nome do grupo
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
  // Se o grupo tiver uma foto real na base de dados, mostra a foto
  if (avatarUrl && avatarUrl.trim() !== "") {
    return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
  }

  // Remove acentos e caracteres especiais para facilitar a deteção das palavras-chave
  const textToAnalyze = (subject + " " + name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const iconProps = { className: "w-6 h-6 text-white" }; 

  // Mapeamento de palavras-chave da educação para ícones visuais (ex: Matemática -> Calculadora)
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
  if (textToAnalyze.includes("desporto") || textToAnalyze.includes("futebol") || textToAnalyze.includes("futsal") || textToAnalyze.includes("ginasi")) return <Dumbbell {...iconProps} />;

  return <BookOpen {...iconProps} />; // Ícone genérico se não detetar a matéria
};

export default function GroupsPage() {
  // =========================================================================
  // ESTADOS GERAIS DA PÁGINA
  // =========================================================================
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para controlo de ações de botões (Loading states específicos)
  const [joining, setJoining] = useState<number | null>(null); // ID do grupo onde o utilizador clicou em "Participar"
  const [deleting, setDeleting] = useState<number | null>(null); // ID do grupo que está a ser apagado ativamente
  
  // Estado para controlo do Modal de Confirmação de Apagar Grupo
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null); 

  // =========================================================================
  // ESTADOS DOS FILTROS E PESQUISA
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("todos");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false); // Toggle "Meus Grupos" vs "Todos os Grupos"

  // Tópicos dinâmicos que vêm da Base de Dados (para usar no form de criação)
  const [availableTopics, setAvailableTopics] = useState<{id: number, nome: string}[]>([]);

  // =========================================================================
  // ESTADOS DE CRIAÇÃO DE GRUPO (Modal)
  // =========================================================================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false); 
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    subject: "Matemática", // Default
    year: "10º Ano",       // Default
    avatar: "",
    topicId: 0 
  });

  // Função utilitária para gerar avatar de letras
  const getInitials = (name: string | undefined) => {
    if (!name) return "U"; 
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // =========================================================================
  // EFFECTS (Carregar Dados Iniciais)
  // =========================================================================

  // 1. Carregar Tópicos disponíveis (para a dropdown do modal de criar grupo)
  useEffect(() => {
    fetch("/api/topics")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setAvailableTopics(data);
            if (data.length > 0) {
                // Define o primeiro tópico da BD como selecionado por defeito no formulário
                setNewGroupData(prev => ({ ...prev, topicId: data[0].id }));
            }
        }
      })
      .catch(err => console.error("Erro ao carregar tópicos:", err));
  }, []);

  // 2. Carregar informações do utilizador logado (para o menu do topo e permissões)
  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        const userData = data.user || data;
        const fetchedFotoUrl = userData.foto_url || userData.avatar;
        
        // Verifica se a imagem é externa, base64 ou um ficheiro local e formata a URL
        const finalAvatarUrl = fetchedFotoUrl 
          ? (fetchedFotoUrl.startsWith("http") || fetchedFotoUrl.startsWith("data:")) 
            ? fetchedFotoUrl 
            : `/uploads/${fetchedFotoUrl}`
          : "";

        setUser({
          id: userData.id,
          name: userData.name || userData.nome || "Utilizador", 
          avatar: finalAvatarUrl 
        });
      })
      .catch(err => {
        console.error("Erro ao carregar user:", err);
        setUser({ id: 0, name: "Convidado", avatar: "" }); 
      });
  }, []);

  // 3. Carregar a lista de todos os Grupos
  // Só executa depois de sabermos quem é o utilizador (depende de `user`)
  useEffect(() => {
    if (user === null) return; 

    const userId = user.id || 0;

    async function loadGroups() {
      try {
        // Envia o userId na query string para o backend saber quais grupos o utilizador já participa
        const res = await fetch(`/api/groups?userId=${userId}`);
        const data = await res.json();
        
        let rawList: any[] = [];
        if (Array.isArray(data)) rawList = data;
        else if (data.groups && Array.isArray(data.groups)) rawList = data.groups;

        // Normalização dos dados vindos da BD para o formato que o TypeScript espera
        const formattedGroups: Group[] = rawList.map((item: any) => ({
            id: item.id,
            name: item.name || item.nome || "Grupo sem nome", 
            description: item.description || item.descricao || "", 
            subject: item.subject || item.materia || item.tipo || "Geral",
            year: item.year || item.ano || "-",
            memberCount: item.memberCount || item.membros || 0,
            isJoined: !!item.isJoined,
            isPrivate: !!item.isPrivate,
            avatar: item.avatar || item.foto_url || "",
            posts: item.posts || 0,
        }));

        setGroups(formattedGroups);
      } catch (err) {
        console.error("Erro ao buscar grupos:", err);
        setGroups([]); 
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, [user]);

  // =========================================================================
  // HANDLERS (Ações)
  // =========================================================================

  // ENTRAR OU SAIR DE UM GRUPO
  const handleJoinGroup = async (groupId: number, currentlyJoined: boolean) => {
    setJoining(groupId); // Ativa o loading state apenas neste botão

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Envia instrução inversa (Se já está no grupo, pede para sair. Se não está, pede para entrar)
        body: JSON.stringify({ groupId, join: !currentlyJoined }), 
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Ocorreu um erro: ${errorData.error || "Tenta recarregar a página."}`);
        setJoining(null);
        return; 
      }

      // Atualiza o estado localmente sem precisar de novo fetch: altera botão e ajusta contador de membros
      setGroups(prev =>
        prev.map(g => g.id === groupId ? { ...g, isJoined: !currentlyJoined, memberCount: currentlyJoined ? g.memberCount - 1 : g.memberCount + 1 } : g)
      );
    } catch (err) {
      console.error("Erro ao atualizar grupo:", err);
    } finally {
      setJoining(null); // Desliga o loading
    }
  };

  // APAGAR GRUPO (Executado após confirmação no Modal)
  const confirmDeleteGroup = async () => {
    if (groupToDelete === null) return;

    setDeleting(groupToDelete); // Botão do modal fica a dizer "A apagar..."

    try {
      const res = await fetch("/api/groups/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupToDelete }), 
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Ação Bloqueada: ${errorData.error}`);
        setDeleting(null);
        setGroupToDelete(null); 
        return; 
      }

      // Remove o grupo apagado da lista de grupos visualizada no ecrã
      setGroups(prev => prev.filter(g => g.id !== groupToDelete));
      setGroupToDelete(null); // Fecha o modal

    } catch (err) {
      console.error("Erro ao apagar grupo:", err);
      alert("Erro de ligação ao servidor.");
    } finally {
      setDeleting(null);
    }
  };

  // CRIAR NOVO GRUPO
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || !user || !user.id) return; 

    setIsCreating(true); 

    try {
        const res = await fetch("/api/groups/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGroupData)
        });

        if (!res.ok) {
            const error = await res.json();
            alert(`Erro: ${error.error}`);
            return;
        }

        const createdGroup = await res.json();
        
        // Cria localmente o objeto do novo grupo para injetar na UI
        const newGroupFormatted: Group = {
            id: createdGroup.id || Date.now(),
            name: newGroupData.name,
            description: newGroupData.description,
            subject: newGroupData.subject,
            year: newGroupData.year,
            memberCount: 1, // Começa com 1 membro (o criador)
            isJoined: true, // O criador entra automaticamente no grupo
            isPrivate: false,
            avatar: newGroupData.avatar, 
            posts: 0
        };
        
        // Coloca o novo grupo no topo da lista atual de grupos
        setGroups([newGroupFormatted, ...groups]);
        setIsCreateModalOpen(false); // Fecha o modal
        
        // Reseta o formulário para a próxima vez
        setNewGroupData({ 
            name: "", 
            description: "", 
            subject: "Matemática", 
            year: "10º Ano", 
            avatar: "", 
            topicId: availableTopics.length > 0 ? availableTopics[0].id : 0 
        });
    } catch (error) {
        console.error("Erro ao criar grupo", error);
    } finally {
        setIsCreating(false); 
    }
  };

  if (loading && !user) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando utilizador...</div>;

  // =========================================================================
  // MOTOR DE PESQUISA E FILTRAGEM (Corre tudo no Client-Side / Front-end)
  // =========================================================================
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  // Array derivado: Contém apenas os grupos que passam nas regras dos filtros
  const filteredGroups = safeGroups.filter(g => {
    const name = (g.name || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    // Regra 1: Bate certo com a palavra de pesquisa (no nome ou na descrição)
    const matchesSearch = name.includes(query) || desc.includes(query);
    
    // Regra 2: Bate certo com o dropdown da disciplina (Ex: Se escolheu "Matemática", só mostra grupos com "matemática" na subject ou nome)
    const subjectMatch = subjectFilter === "todos" || 
                         (g.subject + " " + g.name).toLowerCase().includes(subjectFilter.toLowerCase());

    // Regra 3: Bate certo com o botão "Meus Grupos" (Se estiver ativo, só mostra grupos onde 'isJoined' é true)
    return matchesSearch && subjectMatch && (!showJoinedOnly || g.isJoined);
  });
  
  // Lista fixa de matérias para o Dropdown de filtros e criação de grupos
  const predefinedSubjects = [
    "Matemática", "Física", "Química", "Biologia", "História", 
    "Geografia", "Português", "Inglês", "Programação", "Artes", "Música", "Filosofia"
  ];

  // =========================================================================
  // RENDERIZAÇÃO
  // =========================================================================
  return (
    <div className={styles.container}>
      
      {/* HEADER PRINCIPAL */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
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
            
            <nav className={styles.nav}>
                <Link href="/dashboard">Feed</Link>
                <Link href="/groups" className={styles.active}>Grupos</Link>
                <Link href="/chat">Chat</Link>
            </nav>

            <div className={styles.userActions}>
                <Link href="/search"><Search className="w-4 h-4 md:w-5 md:h-5" /></Link>
                 <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
                <Link href="/notification"><Bell className="w-4 h-4 md:w-5 md:h-5" /></Link>
                <Link href="/settings"><Settings className="w-4 h-4 md:w-5 md:h-5" /></Link>
                
                <Link href="/profile">
                    <Avatar className="w-8 h-8 cursor-pointer border border-slate-700">
                        {user?.avatar && (
                          <AvatarImage src={user.avatar} className="object-cover" />
                        )}
                        <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                            {getInitials(user?.name)}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <Link href="/login"><LogOut className={`w-4 h-4 md:w-5 md:h-5 ${styles.logoutIcon}`} /></Link>
            </div>
        </div>
      </header>

      {/* CONTEÚDO DA PÁGINA */}
      <div className={styles.mainWrapper}>
        <div className={styles.pageHeader}>
          <h2>Grupos e Comunidades</h2>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className={styles.btnCreate}
          >
            <Plus className="w-4 h-4 mr-2" /> Criar Grupo
          </Button>
        </div>

        {/* BARRA DE FILTROS E PESQUISA */}
        <Card className={styles.filterCard}>
            <CardContent className={styles.filterContent}>
                
                {/* 1. Barra de texto (Pesquisa) */}
                <div className={styles.searchContainer}>
                    <Search className="w-4 h-4" />
                    <Input 
                        placeholder="Procurar grupos..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} // Atualiza o state e filtra instantaneamente
                    />
                </div>
                
                {/* 2. Dropdown de matérias */}
                <select 
                    value={subjectFilter} 
                    onChange={e => setSubjectFilter(e.target.value)} 
                    className={styles.selectInput}
                >
                    <option value="todos">Todas as matérias</option>
                    {predefinedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                
                {/* 3. Botão Toggle "Meus Grupos" */}
                <Button 
                    variant={showJoinedOnly ? "default" : "outline"} 
                    onClick={() => setShowJoinedOnly(!showJoinedOnly)} 
                    className={`${styles.btnFilter} ${showJoinedOnly ? styles.active : ''}`}
                >
                    <Filter className="w-4 h-4 mr-2" /> {showJoinedOnly ? "Meus Grupos" : "Todos Grupos"}
                </Button>
            </CardContent>
        </Card>

        {/* ========================================================== */}
        {/* GRID DE RESULTADOS (Mostra o array 'filteredGroups')       */}
        {/* ========================================================== */}
        {loading ? (
           <div className={styles.loadingText}>A processar grupos...</div>
        ) : (
          <div className={styles.groupsGrid}>
            {filteredGroups.map(group => (
              <Card key={group.id} className={styles.groupCard}>
                
                {/* Cabeçalho do Card (Foto, Nome e Etiquetas) */}
                <CardHeader className={styles.cardHeader}>
                    <div className={`${styles.avatarBox} flex items-center justify-center bg-blue-600 rounded-md`}>
                          {getGroupIcon(group.subject, group.name, group.avatar)}
                    </div>
                    <div className={styles.headerInfo}>
                        <CardTitle className={styles.title}>{group.name}</CardTitle>
                        <div className={styles.badges}>
                            <Badge variant="secondary" className={styles.badgeBlue}>{group.subject}</Badge>
                            <Badge variant="secondary" className={styles.badgePurple}>{group.year}</Badge>
                        </div>
                    </div>
                </CardHeader>

                {/* Corpo do Card (Descrição e Estatísticas) */}
                <CardContent className="flex-1 flex flex-col p-4 pt-2">
                    <CardDescription className={styles.description}>{group.description}</CardDescription>
                    
                    <div className={styles.statsContainer}>
                        <div className={styles.stat}><Users className="w-4 h-4" /><span>{group.memberCount}</span></div>
                        <div className={styles.stat}><MessageCircle className="w-4 h-4" /><span>{group.posts} posts</span></div>
                    </div>
                    
                    {/* Botões de Ação na base do Card */}
                    <div className={styles.footerActions}>
                        
                        {/* Botão de Entrar / Sair */}
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleJoinGroup(group.id, group.isJoined)}
                            disabled={joining === group.id} // Desativa só este botão específico durante o loading
                            className={group.isJoined ? styles.btnLeave : styles.btnJoin}
                        >
                            {joining === group.id ? "..." : (group.isJoined ? "Sair" : "Participar")}
                        </Button>
                        
                        {/* Botão de Aceder à página do grupo */}
                        <Link href={`/groups/${group.id}`} className={styles.linkAccess}>
                            <Button variant="ghost" size="sm" className={styles.btnAccess}>Acessar</Button>
                        </Link>
                        
                        {/* Botão de Apagar (Vermelho do caixote do lixo) - Só aparece se estiveres no grupo */}
                        {group.isJoined && (
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setGroupToDelete(group.id)} // Abre o Modal de confirmação passando o ID
                                title="Apagar Grupo"
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 border-red-200 ml-auto p-2 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL BONITO DE CONFIRMAÇÃO DE APAGAR (Aviso crítico)      */}
      {/* ========================================================== */}
      {groupToDelete !== null && (
        <div className={styles.modalOverlay}>
            <Card className={`${styles.modalCard} max-w-sm`}>
                <CardHeader className="pb-3">
                    <CardTitle className="text-red-600 flex items-center gap-2 text-xl">
                        <AlertTriangle className="w-6 h-6" />
                        Apagar Grupo
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                    <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                        Tens a certeza que queres apagar este grupo <strong>permanentemente</strong>? Esta ação não pode ser desfeita e todos os dados serão perdidos.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setGroupToDelete(null)} // Fecha sem apagar
                            disabled={deleting === groupToDelete}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                            onClick={confirmDeleteGroup} // Executa de facto a função de apagar
                            disabled={deleting === groupToDelete}
                        >
                            {deleting === groupToDelete ? "A apagar..." : "Sim, Apagar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL DE CRIAR GRUPO (Formulário)                          */}
      {/* ========================================================== */}
      {isCreateModalOpen && (
        <div className={styles.modalOverlay}>
            <Card className={styles.modalCard}>
                <CardHeader className={styles.modalHeader}>
                    <CardTitle>Criar Novo Grupo</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsCreateModalOpen(false)} className={styles.btnClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={handleCreateGroup}>
                        <div className={styles.formGroup}>
                            <label>Nome do Grupo</label>
                            <Input 
                                required
                                value={newGroupData.name}
                                onChange={e => setNewGroupData({...newGroupData, name: e.target.value})}
                                placeholder="Ex: Sistemas de Informação"
                            />
                        </div>

                        {/* Dropdown alimentado pela tabela Topics */}
                        <div className={styles.formGroup}>
                            <label>Tópico Principal</label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border text-sm text-slate-600 bg-white"
                                value={newGroupData.topicId}
                                onChange={e => setNewGroupData({...newGroupData, topicId: Number(e.target.value)})}
                            >
                                {availableTopics.length === 0 && <option value={0}>A carregar tópicos...</option>}
                                {availableTopics.map(t => (
                                    <option key={t.id} value={t.id}>{t.nome}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown Fixo de Matérias */}
                        <div className={styles.formGroup}>
                            <label>Matéria Principal</label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border text-sm text-slate-600 bg-white"
                                value={newGroupData.subject}
                                onChange={e => setNewGroupData({...newGroupData, subject: e.target.value})}
                            >
                                {predefinedSubjects.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>Ícone do Grupo (URL Opcional)</label>
                            <Input 
                                value={newGroupData.avatar}
                                onChange={e => setNewGroupData({...newGroupData, avatar: e.target.value})}
                                placeholder="Cole um link de imagem ou deixe vazio"
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label>Descrição</label>
                            <Input 
                                value={newGroupData.description}
                                onChange={e => setNewGroupData({...newGroupData, description: e.target.value})}
                                placeholder="Objetivo do grupo..."
                            />
                        </div>
                        
                        <Button type="submit" disabled={isCreating} className={styles.btnSubmit}>
                            {isCreating ? "A criar..." : "Criar Grupo"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}

      {/* ========================================================== */}
      {/* FOOTER NAV PARA DISPOSITIVOS MÓVEIS                        */}
      {/* ========================================================== */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard">
            <BookOpen className="w-5 h-5" />
            <span>Feed</span>
          </Link>
          <Link href="/groups" className={styles.activeLink}>
            <Users className="w-5 h-5" />
            <span>Grupos</span>
          </Link>
          <Link href="/chat">
            <Bell className="w-5 h-5" />
            <span>Chat</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}