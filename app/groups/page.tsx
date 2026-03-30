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
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell,
  Briefcase, Scale, Languages, Compass, Cog, HeartPulse, Telescope, MonitorPlay, Leaf, Network,
  Cpu, Database, Gamepad2, Smartphone, ShieldCheck, Server, Cloud, Bot, MonitorSmartphone
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
  isJoined: boolean; 
  isPrivate: boolean;
  avatar: string;
  posts: number;
}

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Geração dinâmica de ícones com base na "subject" (matéria) ou no nome do grupo
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
  }

  const textToAnalyze = (subject + " " + name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const iconProps = { className: "w-6 h-6 text-white" }; 

  // Função auxiliar para procurar palavras parciais (ex: "matem" apanha "matemática")
  const hasWord = (words: string[]) => {
    return words.some(word => textToAnalyze.includes(word));
  };

  // Função auxiliar para palavras EXATAS (evita que "matemática" ative "tic")
  const hasExactWord = (words: string[]) => {
    return words.some(word => new RegExp(`\\b${word}\\b`).test(textToAnalyze));
  };

  // --- TECNOLOGIA E INFORMÁTICA ---
  if (hasWord(["inteligencia artificial", "machine learning", "robot"]) || hasExactWord(["ia"])) return <Bot {...iconProps} />;
  if (hasWord(["dados", "data science", "sql", "database"])) return <Database {...iconProps} />;
  if (hasWord(["seguranca", "cyber", "hacker"])) return <ShieldCheck {...iconProps} />;
  if (hasWord(["jogo", "game", "unity", "unreal"])) return <Gamepad2 {...iconProps} />;
  if (hasWord(["mobile", "android", "ios", "app"])) return <Smartphone {...iconProps} />;
  if (hasWord(["hardware", "eletronic", "arduino", "raspberry"])) return <Cpu {...iconProps} />;
  if (hasWord(["rede", "servidor", "devops", "infraestrutura"])) return <Server {...iconProps} />;
  if (hasWord(["cloud", "nuvem", "aws", "azure"])) return <Cloud {...iconProps} />;
  if (hasWord(["web", "frontend", "interface"])) return <MonitorSmartphone {...iconProps} />;
  if (hasWord(["program", "informat", "computa", "software"]) || hasExactWord(["tic"])) return <Code {...iconProps} />;

  // --- CIÊNCIAS EXATAS E NATURAIS ---
  if (hasWord(["matem", "calc", "geometri"])) return <Calculator {...iconProps} />;
  if (hasWord(["fisic"])) return <Atom {...iconProps} />;
  if (hasWord(["biolog", "naturais"])) return <Dna {...iconProps} />;
  if (hasWord(["quimic", "laborator"])) return <FlaskConical {...iconProps} />;

  // --- CIÊNCIAS HUMANAS E ARTES ---
  if (hasWord(["histori"])) return <Landmark {...iconProps} />;
  if (hasWord(["geografi", "mundo"])) return <Globe {...iconProps} />;
  if (hasWord(["portugu", "literatura", "escrita", "leitura"])) return <BookType {...iconProps} />;
  if (hasWord(["ingl", "frances", "lingua", "idioma"])) return <Languages {...iconProps} />;
  if (hasWord(["art", "desenh", "pintura"])) return <Palette {...iconProps} />;
  if (hasWord(["music", "banda"])) return <Music {...iconProps} />;
  if (hasWord(["filosof", "psicol"])) return <BrainCircuit {...iconProps} />;

  // --- OUTROS ---
  if (hasWord(["desporto", "futebol", "futsal", "ginasi", "fisica"])) return <Dumbbell {...iconProps} />;
  if (hasWord(["economia", "gestao", "financa", "contabilidade"])) return <Briefcase {...iconProps} />;
  if (hasWord(["direito", "justica"]) || hasExactWord(["lei"])) return <Scale {...iconProps} />;
  if (hasWord(["arquitetura", "urbanismo"])) return <Compass {...iconProps} />;
  if (hasWord(["engenharia", "mecani", "eletrotec"])) return <Cog {...iconProps} />;
  if (hasWord(["medicina", "enfermagem", "saude"])) return <HeartPulse {...iconProps} />;
  if (hasWord(["astronomia", "espaco"])) return <Telescope {...iconProps} />;
  if (hasWord(["multimedia", "video", "audiovisual", "cinema"])) return <MonitorPlay {...iconProps} />;
  if (hasWord(["ecologia", "ambiente", "sustentabilidade"])) return <Leaf {...iconProps} />;
  if (hasWord(["sociologia", "cidadania", "social"])) return <Network {...iconProps} />;

  return <BookOpen {...iconProps} />; // Ícone genérico
};

export default function GroupsPage() {
  // =========================================================================
  // ESTADOS GERAIS DA PÁGINA
  // =========================================================================
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [joining, setJoining] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null); 

  // =========================================================================
  // ESTADOS DOS FILTROS E PESQUISA
  // =========================================================================
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("todos");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);

  const [availableTopics, setAvailableTopics] = useState<{id: number, nome: string}[]>([]);

  // =========================================================================
  // ESTADOS DE CRIAÇÃO DE GRUPO (Modal)
  // =========================================================================
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false); 
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    subject: "Programação", 
    year: "10º Ano",       
    avatar: "",
    topicId: 0 
  });

  const getInitials = (name: string | undefined) => {
    if (!name) return "U"; 
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================

  useEffect(() => {
    fetch("/api/topics")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
            setAvailableTopics(data);
            if (data.length > 0) {
                setNewGroupData(prev => ({ ...prev, topicId: data[0].id }));
            }
        }
      })
      .catch(err => console.error("Erro ao carregar tópicos:", err));
  }, []);

  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        const userData = data.user || data;
        const fetchedFotoUrl = userData.foto_url || userData.avatar;
        
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

  useEffect(() => {
    if (user === null) return; 

    const userId = user.id || 0;

    async function loadGroups() {
      try {
        const res = await fetch(`/api/groups?userId=${userId}`);
        const data = await res.json();
        
        let rawList: any[] = [];
        if (Array.isArray(data)) rawList = data;
        else if (data.groups && Array.isArray(data.groups)) rawList = data.groups;

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
  // HANDLERS
  // =========================================================================

  const handleJoinGroup = async (groupId: number, currentlyJoined: boolean) => {
    setJoining(groupId); 

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, join: !currentlyJoined }), 
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`Ocorreu um erro: ${errorData.error || "Tenta recarregar a página."}`);
        setJoining(null);
        return; 
      }

      setGroups(prev =>
        prev.map(g => g.id === groupId ? { ...g, isJoined: !currentlyJoined, memberCount: currentlyJoined ? g.memberCount - 1 : g.memberCount + 1 } : g)
      );
    } catch (err) {
      console.error("Erro ao atualizar grupo:", err);
    } finally {
      setJoining(null); 
    }
  };

  const confirmDeleteGroup = async () => {
    if (groupToDelete === null) return;

    setDeleting(groupToDelete); 

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

      setGroups(prev => prev.filter(g => g.id !== groupToDelete));
      setGroupToDelete(null); 

    } catch (err) {
      console.error("Erro ao apagar grupo:", err);
      alert("Erro de ligação ao servidor.");
    } finally {
      setDeleting(null);
    }
  };

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
        
        const newGroupFormatted: Group = {
            id: createdGroup.id || Date.now(),
            name: newGroupData.name,
            description: newGroupData.description,
            subject: newGroupData.subject,
            year: newGroupData.year,
            memberCount: 1, 
            isJoined: true, 
            isPrivate: false,
            avatar: newGroupData.avatar, 
            posts: 0
        };
        
        setGroups([newGroupFormatted, ...groups]);
        setIsCreateModalOpen(false); 
        
        setNewGroupData({ 
            name: "", 
            description: "", 
            subject: "Programação", 
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
  // MOTOR DE PESQUISA E FILTRAGEM
  // =========================================================================
  const safeGroups = Array.isArray(groups) ? groups : [];
  
  const filteredGroups = safeGroups.filter(g => {
    const name = (g.name || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = name.includes(query) || desc.includes(query);
    
    const subjectMatch = subjectFilter === "todos" || 
                         (g.subject + " " + g.name).toLowerCase().includes(subjectFilter.toLowerCase());

    return matchesSearch && subjectMatch && (!showJoinedOnly || g.isJoined);
  });
  
  // =========================================================================
  // LISTA EXPANDIDA DE MATÉRIAS (Inclui Tecnologia)
  // =========================================================================
  const predefinedSubjects = [
    // Tradicionais
    "Matemática", "Física", "Química", "Biologia", "História", "Geografia", 
    "Português", "Inglês", "Artes", "Música", "Filosofia",
    "Economia", "Gestão", "Direito", "Sociologia", "Psicologia", "Educação Física", 
    "Línguas Estrangeiras", "Arquitetura", "Engenharia", "Medicina", "Multimédia", 
    "Ecologia", "Astronomia",
    // Tecnologia e Informática
    "Programação", "Inteligência Artificial", "Ciência de Dados", "Cibersegurança",
    "Desenvolvimento de Jogos", "Mobile (Android/iOS)", "Hardware e Eletrónica",
    "Redes e Servidores", "Cloud Computing", "Web Design"
  ];

  // =========================================================================
  // RENDERIZAÇÃO
  // =========================================================================
  return (
    <div className={styles.container}>
      
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

        <Card className={styles.filterCard}>
            <CardContent className={styles.filterContent}>
                
                <div className={styles.searchContainer}>
                    <Search className="w-4 h-4" />
                    <Input 
                        placeholder="Procurar grupos..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)} 
                    />
                </div>
                
                <select 
                    value={subjectFilter} 
                    onChange={e => setSubjectFilter(e.target.value)} 
                    className={styles.selectInput}
                >
                    <option value="todos">Todas as categorias</option>
                    {predefinedSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                
                <Button 
                    variant={showJoinedOnly ? "default" : "outline"} 
                    onClick={() => setShowJoinedOnly(!showJoinedOnly)} 
                    className={`${styles.btnFilter} ${showJoinedOnly ? styles.active : ''}`}
                >
                    <Filter className="w-4 h-4 mr-2" /> {showJoinedOnly ? "Meus Grupos" : "Todos Grupos"}
                </Button>
            </CardContent>
        </Card>

        {loading ? (
           <div className={styles.loadingText}>A processar grupos...</div>
        ) : (
          <div className={styles.groupsGrid}>
            {filteredGroups.map(group => (
              <Card key={group.id} className={styles.groupCard}>
                
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

                <CardContent className="flex-1 flex flex-col p-4 pt-2">
                    <CardDescription className={styles.description}>{group.description}</CardDescription>
                    
                    <div className={styles.statsContainer}>
                        <div className={styles.stat}><Users className="w-4 h-4" /><span>{group.memberCount}</span></div>
                        <div className={styles.stat}><MessageCircle className="w-4 h-4" /><span>{group.posts} posts</span></div>
                    </div>
                    
                    <div className={styles.footerActions}>
                        
                        <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => handleJoinGroup(group.id, group.isJoined)}
                            disabled={joining === group.id} 
                            className={group.isJoined ? styles.btnLeave : styles.btnJoin}
                        >
                            {joining === group.id ? "..." : (group.isJoined ? "Sair" : "Participar")}
                        </Button>
                        
                        <Link href={`/groups/${group.id}`} className={styles.linkAccess}>
                            <Button variant="ghost" size="sm" className={styles.btnAccess}>Acessar</Button>
                        </Link>
                        
                        {group.isJoined && (
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setGroupToDelete(group.id)} 
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
                            onClick={() => setGroupToDelete(null)} 
                            disabled={deleting === groupToDelete}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white border-transparent"
                            onClick={confirmDeleteGroup} 
                            disabled={deleting === groupToDelete}
                        >
                            {deleting === groupToDelete ? "A apagar..." : "Sim, Apagar"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

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
                                placeholder="Ex: Cibersegurança e Redes"
                            />
                        </div>

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

                        <div className={styles.formGroup}>
                            <label>Categoria / Matéria Principal</label>
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