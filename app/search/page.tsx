"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { useRouter, usePathname } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// Icons
import { 
  BookOpen, Search, Settings, LogOut, 
  Users, MessageCircle, UserPlus, Clock, Loader2, Check, Bell 
} from "lucide-react";

import styles from "./searchPage.module.scss";

type TabType = "todos" | "grupos" | "pessoas";

// --- COMPONENTE DE ITEM DE PESSOA ---
const PersonItem = ({ pessoa }: { pessoa: any }) => {
  const router = useRouter();
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'friend'>(
    pessoa.estado_amizade === 'ACEITE' ? 'friend' :
    pessoa.estado_amizade === 'PENDENTE' ? 'sent' : 
    'idle'
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

      if (res.ok) {
        setStatus('sent');
      } else if (res.status === 409) {
        setStatus('sent'); 
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error("Erro de rede", error);
      setStatus('idle');
    }
  };

  return (
    <div 
      className={styles.personCard} 
      onClick={() => router.push(`/profile/${pessoa.id}`)}
    >
      <div className="flex items-center gap-3 flex-1">
        <Avatar className={styles.avatarLarge}>
          {/* Correção Anti-Erro: Ternário em vez de && */}
          {pessoa.foto_url || pessoa.avatar ? (
             <AvatarImage src={pessoa.foto_url || pessoa.avatar} />
          ) : null}
          <AvatarFallback className="bg-emerald-600 text-white">
            {pessoa.nome?.[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div className={styles.personInfo}>
          <h4>{pessoa.nome}</h4>
          <p>{pessoa.ano} - {pessoa.curso}</p>
        </div>
      </div>

      <Button 
        onClick={handleAddFriend} 
        disabled={status !== 'idle'} 
        size="sm"
        variant={status === 'idle' ? "default" : "ghost"}
        className={
          status === 'idle' ? "bg-blue-600 hover:bg-blue-700 text-white" : 
          status === 'friend' ? "text-green-600 bg-green-50" :
          "text-slate-500 bg-slate-100"
        }
      >
        {status === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'friend' ? (
          <><Check className="w-4 h-4 mr-1" /> Amigos</>
        ) : status === 'sent' ? (
          <><Clock className="w-4 h-4 mr-1" /> Pendente</>
        ) : (
          <><UserPlus className="w-4 h-4 mr-1" /> Adicionar</>
        )}
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
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!searchQuery) {
        setResults({ grupos: [], pessoas: [] });
        return;
      }
      
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/search?q=${searchQuery}`);
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

  return (
    <div className={styles.pageContainer}>
      
      {/* HEADER (Desktop) */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
            <Link href="/" className={styles.logoLink}>
                      <Image 
                        src="/logo.png" 
                        alt="Logo EduConnect" 
                        width={160} // Dimensão base para a qualidade
                        height={40} // Dimensão base para a qualidade
                        priority
                        className={styles.logoImage} // A classe que criámos no SCSS
                      />
                    </Link>

          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.userActions}>
            <Link href="/search" className="text-blue-400"><Search className="w-5 h-5" /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            <Link href="/profile">
              <Avatar className="w-8 h-8 cursor-pointer border border-slate-700">
                {user?.foto_url || user?.avatar ? (
                  <AvatarImage src={user.foto_url || user.avatar} />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {user?.nome ? user.nome[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5" /></Link>
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
              placeholder="Pesquisar grupos e pessoas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tabsContainer}>
          {[
            { tab: "todos", label: "Todos" },
            { tab: "grupos", label: "Grupos", icon: <Users className="w-4 h-4" /> },
            { tab: "pessoas", label: "Pessoas", icon: <MessageCircle className="w-4 h-4" /> },
          ].map((item) => (
            <Button
              key={item.tab}
              variant="ghost"
              className={`${styles.tabBtn} ${activeTab === item.tab ? styles.active : ""}`}
              onClick={() => setActiveTab(item.tab as TabType)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>

        <div className={styles.resultsList}>
          {loadingSearch && <div className="text-center p-4 text-gray-400">A pesquisar...</div>}

          {(activeTab === "todos" || activeTab === "grupos") && results.grupos.map((grupo: any) => (
            <div key={grupo.id} className={styles.resultCard} onClick={() => router.push(`/groups/${grupo.id}`)}>
              <div className="flex items-center gap-3">
                 <div className="bg-blue-100 p-2 rounded-full">
                    <Users className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                    <h4>{grupo.nome}</h4>
                    <p className="text-sm text-gray-500">{grupo.tipo}</p>
                 </div>
              </div>
            </div>
          ))}

          {(activeTab === "todos" || activeTab === "pessoas") && results.pessoas.map((pessoa: any) => (
            <PersonItem key={pessoa.id} pessoa={pessoa} />
          ))}

          {!loadingSearch && searchQuery && !hasResults && (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p>Nenhum resultado encontrado para "{searchQuery}"</p>
            </div>
          )}
          
          {!searchQuery && (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p>Digite o nome de um colega ou grupo.</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER MOBILE NAV (Igual ao sistema de grupos e definições) */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          <Link href="/dashboard" className={pathname === '/dashboard' ? styles.activeLink : ''}>
            <BookOpen className="w-5 h-5" />
            <span>Feed</span>
          </Link>
          <Link href="/groups" className={pathname === '/groups' ? styles.activeLink : ''}>
            <Users className="w-5 h-5" />
            <span>Grupos</span>
          </Link>
          <Link href="/chat" className={pathname === '/chat' ? styles.activeLink : ''}>
            <Bell className="w-5 h-5" />
            <span>Chat</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}