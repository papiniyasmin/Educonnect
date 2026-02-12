"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Bell, Settings, LogOut, Users, Plus, Filter, MessageCircle } from "lucide-react";

// Importando o CSS Module
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
  recentActivity: string;
  lastActive: Date;
  posts: number;
  moderators: string[];
}

export default function GroupsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("todos");
  const [showJoinedOnly, setShowJoinedOnly] = useState(false);

  // 1. Pegar usuário logado
  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => setUser(data.user || data))
      .catch(() => setUser(null));
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
        if (Array.isArray(data)) {
            rawList = data;
        } else if (data.groups && Array.isArray(data.groups)) {
            rawList = data.groups;
        }

        const formattedGroups: Group[] = rawList.map((item: any) => ({
            id: item.id,
            name: item.name || item.nome || "Grupo sem nome", 
            description: item.description || item.descricao || "", 
            subject: item.subject || item.materia || "Geral",
            year: item.year || item.ano || "-",
            memberCount: item.memberCount || item.membros || 0,
            isJoined: !!item.isJoined,
            isPrivate: !!item.isPrivate,
            avatar: item.avatar || item.foto_url || "",
            recentActivity: item.recentActivity || "",
            lastActive: item.lastActive || new Date(),
            posts: item.posts || 0,
            moderators: item.moderators || []
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
        prev.map(g =>
          g.id === groupId
            ? {
                ...g,
                isJoined: !currentlyJoined,
                memberCount: currentlyJoined ? g.memberCount - 1 : g.memberCount + 1,
              }
            : g
        )
      );
    } catch (err) {
      console.error("Erro ao atualizar grupo:", err);
    } finally {
      setJoining(null);
    }
  };

  if (loading && !user) {
    return (
      <div className={styles.loadingContainer}>
        Carregando...
      </div>
    );
  }

  const safeGroups = Array.isArray(groups) ? groups : [];

  const filteredGroups = safeGroups.filter(g => {
    const name = (g.name || "").toLowerCase();
    const desc = (g.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesSubject = subjectFilter === "todos" || g.subject === subjectFilter;
    const matchesJoined = !showJoinedOnly || g.isJoined;

    return matchesSearch && matchesSubject && matchesJoined;
  });

  const subjects = Array.from(new Set(safeGroups.map(g => g.subject)));

  return (
    <div className={styles.container}>
      
      {/* HEADER FIXO */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logoArea}>
            <div className={styles.logoIcon}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span>EduConnect</span>
          </Link>

          {/* MENU DESKTOP */}
          <nav className={styles.desktopNav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups" className={styles.activeLink}>Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          {/* AÇÕES */}
          <div className={styles.actions}>
            <Link href="/search"><Search className="w-4 h-4 md:w-5 md:h-5" /></Link>
            <Link href="/notifications"><Bell className="w-4 h-4 md:w-5 md:h-5" /></Link>
            <Link href="/settings"><Settings className="w-4 h-4 md:w-5 md:h-5" /></Link>
            
            <Link href="/profile">
              <Avatar className="w-6 h-6 md:w-8 md:h-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback className="bg-emerald-600 text-white">
                  {user?.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <Link href="/login"><LogOut className="w-4 h-4 md:w-5 md:h-5" /></Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div className={styles.mainWrapper}>
        <div className={styles.pageTitleArea}>
          <h2>Grupos e Comunidades</h2>
          <Button className={styles.createBtn}>
            <Plus className="w-4 h-4 mr-2" /> Criar Grupo
          </Button>
        </div>

        {/* BARRA DE FILTROS */}
        <Card className={styles.filterCard}>
          <CardContent className={styles.filterContent}>
            
            <div className={styles.searchWrapper}>
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
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <Button
              variant={showJoinedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowJoinedOnly(!showJoinedOnly)}
              className={`${styles.filterBtn} ${showJoinedOnly ? styles.active : styles.inactive}`}
            >
              <Filter className="w-4 h-4 mr-2" /> 
              {showJoinedOnly ? "Meus Grupos" : "Todos Grupos"}
            </Button>

            <div className={styles.resultsCount}>
                {filteredGroups.length} encontrados
            </div>
          </CardContent>
        </Card>

        {/* GRID DE RESULTADOS */}
        {loading ? (
             <div className="text-center py-20 text-slate-400">Carregando grupos...</div>
        ) : (
            <div className={styles.groupsGrid}>
            {filteredGroups.map(group => (
                <Card key={group.id} className={styles.groupCard}>
                <CardHeader>
                    <div className={styles.cardHeaderRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.groupAvatar}>
                            {group.avatar ? (
                                <img src={group.avatar} alt={group.name} />
                            ) : (
                                <BookOpen className="w-6 h-6 text-white" />
                            )}
                        </div>
                        <div className={styles.groupInfo}>
                            <CardTitle className={styles.title}>
                                {group.name}
                            </CardTitle>
                            <div className={styles.tags}>
                                <Badge variant="secondary" className={styles.badgeBlue}>
                                    {group.subject}
                                </Badge>
                                <Badge variant="secondary" className={styles.badgePurple}>
                                    {group.year}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    </div>
                </CardHeader>
                
                <CardContent>
                    <CardDescription className={styles.description}>
                        {group.description}
                    </CardDescription>
                    
                    <div className={styles.statsBar}>
                        <div className={styles.statItem}>
                            <Users className="w-4 h-4" /> 
                            <span>{group.memberCount}</span>
                        </div>
                        <div className={styles.divider}></div>
                        <div className={styles.statItem}>
                            <MessageCircle className="w-4 h-4" /> 
                            <span>{group.posts} posts</span>
                        </div>
                    </div>
                    
                    <div className={styles.actionsBar}>
                        <Button
                            variant={group.isJoined ? "secondary" : "default"}
                            size="sm"
                            onClick={() => handleJoinGroup(group.id, group.isJoined)}
                            disabled={joining === group.id}
                            className={`${styles.btnAction} ${group.isJoined ? styles.btnLeave : styles.btnJoin}`}
                        >
                            {joining === group.id ? "..." : (group.isJoined ? "Sair" : "Participar")}
                        </Button>
                        
                        <Link href={`/groups/${group.id}`} className="flex-1">
                            <Button variant="ghost" size="sm" className={styles.btnGhost}>
                                Acessar
                            </Button>
                        </Link>
                    </div>
                </CardContent>
                </Card>
            ))}
            </div>
        )}

        {!loading && filteredGroups.length === 0 && (
            <div className={styles.emptyState}>
                <div className={styles.iconCircle}>
                    <Search className="w-8 h-8 text-slate-500" />
                </div>
                <h3>Nenhum grupo encontrado</h3>
                <p>Tente ajustar seus filtros de busca.</p>
            </div>
        )}
      </div>
    </div>
  );
}