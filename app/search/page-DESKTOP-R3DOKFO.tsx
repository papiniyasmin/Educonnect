"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Settings, LogOut, Bell, FileText, Users, MessageCircle } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();

  const [user, setUser] = useState<{ id: number; name: string; email: string; avatar: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"todos" | "posts" | "grupos" | "pessoas">("todos");
  const [results, setResults] = useState({ posts: [], grupos: [], pessoas: [] });

  // Função para pegar iniciais do usuário
  const getUserInitials = (name?: string) => {
    if (!name) return "?";
    const split = name.trim().split(" ");
    if (split.length === 1) return split[0][0].toUpperCase();
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  };

  // Buscar usuário logado
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) throw new Error("Falha ao buscar usuário");
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    };
    fetchUser();
  }, []);

  // Buscar resultados da pesquisa
  async function fetchResults(query: string) {
    if (!query) {
      setResults({ posts: [], grupos: [], pessoas: [] });
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${query}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
  }

  // Delay de digitação
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchResults(searchQuery);
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (!user) return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;

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
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">Feed</Link>
              <Link href="/groups" className="text-slate-300 hover:text-white">Grupos</Link>
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
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white" onClick={() => router.push("/login")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Pesquisar</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Pesquisar posts, grupos ou pessoas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-700">
            {[
              { tab: "todos", label: "Todos" },
              { tab: "posts", label: "Posts", icon: <FileText className="w-4 h-4 mr-2" /> },
              { tab: "grupos", label: "Grupos", icon: <Users className="w-4 h-4 mr-2" /> },
              { tab: "pessoas", label: "Pessoas", icon: <MessageCircle className="w-4 h-4 mr-2" /> },
            ].map((item) => (
              <Button
                key={item.tab}
                variant="ghost"
                className={`rounded-none border-b-2 ${
                  activeTab === item.tab
                    ? "border-emerald-500 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
                onClick={() => setActiveTab(item.tab as any)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>

          {/* Resultados */}
          <div className="space-y-6">
            {/* POSTS */}
            {(activeTab === "todos" || activeTab === "posts") && results.posts.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Posts</h3>
                {results.posts.map((post: any) => (
                  <div key={post.id} onClick={() => router.push(`/post/${post.id}`)} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3 hover:border-emerald-500 transition-all cursor-pointer">
                    <h4 className="text-lg font-semibold text-white mb-2">{post.title}</h4>
                  </div>
                ))}
              </div>
            )}

            {/* GRUPOS */}
            {(activeTab === "todos" || activeTab === "grupos") && results.grupos.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Grupos</h3>
                {results.grupos.map((grupo: any) => (
                  <div key={grupo.id} onClick={() => router.push(`/group/${grupo.id}`)} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3 hover:border-emerald-500 transition-all cursor-pointer">
                    <h4 className="text-lg font-semibold text-white mb-2">{grupo.nome}</h4>
                    <p className="text-slate-400 text-sm">{grupo.tipo}</p>
                  </div>
                ))}
              </div>
            )}

            {/* PESSOAS */}
            {(activeTab === "todos" || activeTab === "pessoas") && results.pessoas.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Pessoas</h3>
                {results.pessoas.map((pessoa: any) => (
                  <div key={pessoa.id} onClick={() => router.push(`/profile/${pessoa.id}`)} className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3 hover:border-emerald-500 transition-all cursor-pointer flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={pessoa.avatar || "/placeholder.svg"} alt={pessoa.nome} />
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {getUserInitials(pessoa.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{pessoa.nome}</h4>
                      <p className="text-sm text-slate-400">{pessoa.ano} - {pessoa.curso}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* SEM RESULTADOS */}
            {searchQuery &&
              results.posts.length === 0 &&
              results.grupos.length === 0 &&
              results.pessoas.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Nenhum resultado encontrado para "{searchQuery}"</p>
                </div>
              )}

            {/* Caixa inicial */}
            {!searchQuery && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Digite algo para começar a pesquisar</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900/80 border-t border-slate-700/50 py-4 text-center text-slate-400 mt-12">
        <div className="container mx-auto px-4">
          <p>&copy; 2025 EduConnect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
