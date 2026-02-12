"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Bell, Settings, LogOut, Users, Plus, Filter, MessageCircle } from "lucide-react";

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

  // Pegar usuário logado
  useEffect(() => {
    fetch("/api/user")
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => setUser(null));
  }, []);

  // Pegar grupos após carregar usuário
  useEffect(() => {
    if (!user) return;

    async function loadGroups() {
      try {
        const res = await fetch(`/api/groups?userId=${user.id}`);
        const data = await res.json();
        setGroups(data);
      } catch (err) {
        console.error("Erro ao buscar grupos:", err);
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Carregando usuário...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Carregando grupos...
      </div>
    );
  }

  const filteredGroups = groups.filter(
    g =>
      (g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (subjectFilter === "todos" || g.subject === subjectFilter) &&
      (!showJoinedOnly || g.isJoined)
  );

  const subjects = Array.from(new Set(groups.map(g => g.subject)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">EduConnect</h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-slate-300 hover:text-white">Feed</Link>
              <Link href="/groups" className="text-emerald-400 hover:text-emerald-300">Grupos</Link>
              <Link href="/chat" className="text-slate-300 hover:text-white">Chat</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/search"><Search className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/notifications"><Bell className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
              <Link href="/settings"><Settings className="w-4 h-4" /></Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" asChild>
                <Link href="/login"><LogOut className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">Grupos e Comunidades</h2>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-4 h-4 mr-2" /> Criar Grupo
          </Button>
        </div>

        {/* FILTROS */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6 flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 md:flex-initial">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Procurar grupos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white px-3 py-1 rounded"
            >
              <option value="todos">Todas as matérias</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <Button
              variant={showJoinedOnly ? "default" : "ghost"}
              size="sm"
              onClick={() => setShowJoinedOnly(!showJoinedOnly)}
              className={showJoinedOnly ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}
            >
              <Filter className="w-4 h-4 mr-2" /> Apenas grupos que participo
            </Button>

            <div className="text-slate-400 text-sm">{filteredGroups.length} grupos encontrados</div>
          </CardContent>
        </Card>

        {/* GRID DE GRUPOS */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <Card key={group.id} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-white text-lg">{group.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">{group.subject}</Badge>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-xs">{group.year}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400 mb-4 line-clamp-2">{group.description}</CardDescription>
                <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                  <div className="flex items-center space-x-2"><Users className="w-4 h-4" /> {group.memberCount} membros</div>
                  <div className="flex items-center space-x-2"><MessageCircle className="w-4 h-4" /> {group.posts} posts</div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                  <Button
                    variant={group.isJoined ? "secondary" : "default"}
                    size="sm"
                    onClick={() => handleJoinGroup(group.id, group.isJoined)}
                    disabled={joining === group.id}
                    className={group.isJoined ? "bg-slate-600 hover:bg-slate-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}
                  >
                    {group.isJoined ? "Sair do Grupo" : "Participar"}
                  </Button>
                  <Link href={`/groups/${group.id}`}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">Ver Grupo</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
