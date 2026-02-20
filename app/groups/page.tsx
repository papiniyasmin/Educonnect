"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Search, Settings, LogOut, Users, Plus, Filter, MessageCircle, X, Bell,
  Calculator, Atom, Dna, Globe, BookType, Code, FlaskConical, Palette, Music, Landmark, BrainCircuit, Dumbbell
} from "lucide-react";

import styles from "./groups.module.scss";

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

// --- FUNÇÃO DE ÍCONES ---
const getGroupIcon = (subject: string, name: string, avatarUrl?: string) => {
  if (avatarUrl && avatarUrl.trim() !== "") {
    return <img src={avatarUrl} alt={subject} className="w-full h-full object-cover rounded-md" />;
  }

  const textToAnalyze = (subject + " " + name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const iconProps = { className: "w-6 h-6 text-white" }; 

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

  return <BookOpen {...iconProps} />;
};

export default function GroupsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("todos");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    subject: "Matemática",
    year: "10º Ano",
    avatar: "" 
  });

  // 1. Pegar usuário logado e a foto
  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => {
        const userData = data.user || data;
        
        // Garante que o avatar é lido corretamente ou fica string vazia
        const avatarUrl = userData.foto_url || userData.avatar || "";

        setUser({
          id: userData.id,
          name: userData.name || userData.nome, 
          avatar: avatarUrl 
        });
      })
      .catch(err => {
        console.error("Erro ao carregar user:", err);
        setUser(null);
      });
  }, []);

  // 2. Pegar grupos
  useEffect(() => {
    if (!user) return;
    const userId = user.id;

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

  // Lógica de Entrar no Grupo
  const handleJoinGroup = async (groupId: number, currentlyJoined: boolean) => {
    if (!user) return;
    setJoining(groupId);

    try {
      await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, join: !currentlyJoined, userId: user.id }),
      });

      setGroups(prev =>
        prev.map(g => g.id === groupId ? { ...g, isJoined: !currentlyJoined, memberCount: currentlyJoined ? g.memberCount - 1 : g.memberCount + 1 } : g)
      );
    } catch (err) {
      console.error("Erro ao atualizar grupo:", err);
    } finally {
      setJoining(null);
    }
  };

  // Lógica de Criar Grupo
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
        const res = await fetch("/api/groups/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newGroupData, ownerId: user.id })
        });

        if (res.ok) {
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
            setNewGroupData({ name: "", description: "", subject: "Matemática", year: "10º Ano", avatar: "" });
        }
    } catch (error) {
        console.error("Erro ao criar grupo", error);
    }
  };

  if (loading && !user) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;

  const safeGroups = Array.isArray(groups) ? groups : [];
  const filteredGroups = safeGroups.filter(g => {
    const name = (g.name || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const subjectMatch = subjectFilter === "todos" || 
                         (g.subject + " " + g.name).toLowerCase().includes(subjectFilter.toLowerCase());

    return (name.includes(query) || desc.includes(query)) &&
           subjectMatch &&
           (!showJoinedOnly || g.isJoined);
  });
  
  const predefinedSubjects = [
    "Matemática", "Física", "Química", "Biologia", "História", 
    "Geografia", "Português", "Inglês", "Programação", "Artes", "Música", "Filosofia"
  ];

  return (
    <div className={styles.container}>
      
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
            <Link href="/" className={styles.logoLink}>
            <div className={styles.logoBox}>
                <BookOpen className="w-5 h-5" />
            </div>
            <span>EduConnect</span>
            </Link>
            
            <nav className={styles.nav}>
                <Link href="/dashboard">Feed</Link>
                <Link href="/groups" className={styles.active}>Grupos</Link>
                <Link href="/chat">Chat</Link>
            </nav>

            <div className={styles.userActions}>
                <Link href="/search"><Search className="w-4 h-4 md:w-5 md:h-5" /></Link>
                <Link href="/settings"><Settings className="w-4 h-4 md:w-5 md:h-5" /></Link>
                <Link href="/profile">
                    <Avatar className="w-8 h-8 cursor-pointer border border-slate-700">
                        {/* A foto de perfil aparece aqui! */}
                        {user?.avatar ? (
                          <AvatarImage src={user.avatar} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-emerald-600 text-white text-xs">
                            {user?.name ? user.name[0].toUpperCase() : 'U'}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <Link href="/login"><LogOut className={`w-4 h-4 md:w-5 md:h-5 ${styles.logoutIcon}`} /></Link>
            </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
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

        {/* BARRA DE FILTROS */}
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
                    <option value="todos">Todas as matérias</option>
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

        {/* GRID DE RESULTADOS */}
        {loading ? (
           <div className={styles.loadingText}>Carregando grupos...</div>
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
                    </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CRIAR GRUPO */}
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
                                placeholder="Ex: Estudo de Física Quântica"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Matéria</label>
                            <select 
                                className="w-full h-10 px-3 rounded-md border"
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
                                placeholder="Cole um link de imagem ou deixe vazio para usar ícone padrão"
                            />
                            <p className="text-xs text-gray-500 mt-1">Se vazio, usaremos um ícone baseado no nome e matéria.</p>
                        </div>
                        <div className={styles.formGroup}>
                            <label>Descrição</label>
                            <Input 
                                value={newGroupData.description}
                                onChange={e => setNewGroupData({...newGroupData, description: e.target.value})}
                                placeholder="Objetivo do grupo..."
                            />
                        </div>
                        <Button type="submit" className={styles.btnSubmit}>
                            Criar Grupo
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      )}

      {/* FOOTER MOBILE NAV */}
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