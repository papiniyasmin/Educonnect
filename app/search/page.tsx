"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, Search, Settings, LogOut, 
  Users, MessageCircle, UserPlus, Clock, Loader2, Check, Bell 
} from "lucide-react";

import styles from "./searchPage.module.scss";

type TabType = "todos" | "grupos" | "pessoas";

// --- FUNÇÕES AUXILIARES ---
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

// --- COMPONENTE DE ITEM DE PESSOA ---
const PersonItem = ({ pessoa }: { pessoa: any }) => {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'friend'>(
    pessoa.estado_amizade === 'ACEITE' ? 'friend' :
    pessoa.estado_amizade === 'PENDENTE' ? 'sent' : 'idle'
  );

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (status !== 'idle') return;
    setStatus('loading');
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pessoa.id }), 
      });
      if (res.ok) setStatus('sent');
      else setStatus('idle');
    } catch (error) {
      setStatus('idle');
    }
  };

  const pessoaAvatarUrl = getAvatarUrl(pessoa.foto_url || pessoa.avatar);

  return (
    <div className={styles.personCard} onClick={() => router.push(`/profile/${pessoa.id}`)}>
      <div className="flex items-center gap-3 flex-1">
        <Avatar className={styles.avatarLarge}>
          {pessoaAvatarUrl && <AvatarImage src={pessoaAvatarUrl} className="object-cover" />}
          <AvatarFallback className="bg-emerald-600 text-white font-medium">
            {getInitials(pessoa.nome)}
          </AvatarFallback>
        </Avatar>
        <div className={styles.personInfo}>
          <h4>{pessoa.nome}</h4>
          <p>{pessoa.ano} - {pessoa.curso}</p>
        </div>
      </div>
      <Button onClick={handleAddFriend} disabled={status !== 'idle'} size="sm" variant={status === 'idle' ? "default" : "ghost"}>
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         status === 'friend' ? <><Check className="w-4 h-4 mr-1" /> Amigos</> :
         status === 'sent' ? <><Clock className="w-4 h-4 mr-1" /> Pendente</> :
         <><UserPlus className="w-4 h-4 mr-1" /> Adicionar</>}
      </Button>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [results, setResults] = useState({ grupos: [], pessoas: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    fetch("/api/user/settings").then(res => res.json()).then(data => setUser(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults({ grupos: [], pessoas: [] });
      setLoadingSearch(false);
      return;
    }

    const delay = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
            const data = await res.json();
            setResults(data);
        }
      } catch (error) {
        console.error("Erro na busca", error);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const hasResults = results.grupos.length > 0 || results.pessoas.length > 0;
  const userAvatarUrl = getAvatarUrl(user?.foto_url || user?.avatar);

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoLink}>
            <Image src="/logo.png" alt="Logo EduConnect" width={160} height={40} priority className={styles.logoImage} />
          </Link>
          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>
          <div className={styles.userActions}>
            <Link href="/search" className="text-blue-400"><Search className="w-5 h-5" /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/notifications"><Bell className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            
            <Link href="/profile">
              <Avatar className="w-8 h-8 border border-slate-700">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} className="object-cover" />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                  {getInitials(user?.nome)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5 hover:text-red-400 transition-colors" /></Link>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.searchSection}>
          <h2>Pesquisar</h2>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Digite a letra inicial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>
        </div>

        <div className={styles.tabsContainer}>
          {["todos", "grupos", "pessoas"].map((t) => (
            <Button
              key={t}
              variant="ghost"
              className={`${styles.tabBtn} ${activeTab === t ? styles.active : ""}`}
              onClick={() => setActiveTab(t as TabType)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        <div className={styles.resultsList}>
          {loadingSearch && (
            <div className="flex justify-center p-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>A carregar...</span>
            </div>
          )}

          {!loadingSearch && (
            <>
              {(activeTab === "todos" || activeTab === "grupos") && results.grupos.map((grupo: any) => (
                <div key={grupo.id} className={styles.resultCard} onClick={() => router.push(`/groups/${grupo.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full"><Users className="w-5 h-5 text-blue-600" /></div>
                    <div><h4 className="font-semibold">{grupo.nome}</h4><p className="text-sm text-gray-500 capitalize">{grupo.tipo}</p></div>
                  </div>
                </div>
              ))}

              {(activeTab === "todos" || activeTab === "pessoas") && results.pessoas.map((pessoa: any) => (
                <PersonItem key={pessoa.id} pessoa={pessoa} />
              ))}
            </>
          )}

          {/* Mensagem quando não há resultados */}
          {!loadingSearch && searchQuery && !hasResults && (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p>Nenhum resultado começa com "{searchQuery}"</p>
            </div>
          )}

          {/* Mensagem inicial */}
          {!searchQuery && !loadingSearch && (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p>Pesquise pela letra inicial de um grupo ou colega.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}