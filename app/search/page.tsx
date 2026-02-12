"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// Icons
import { 
  BookOpen, Search, Settings, LogOut, 
  Users, MessageCircle, UserPlus, Clock, Loader2, Check 
} from "lucide-react";

import styles from "./searchPage.module.scss";

type TabType = "todos" | "grupos" | "pessoas";

// --- COMPONENTE DE ITEM DE PESSOA ---
const PersonItem = ({ pessoa }: { pessoa: any }) => {
  const router = useRouter();
  
  // Define o estado inicial com base no que vem da base de dados
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'friend'>(
    pessoa.estado_amizade === 'ACEITE' ? 'friend' :
    pessoa.estado_amizade === 'PENDENTE' ? 'sent' : 
    'idle'
  );

  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede de abrir o perfil ao clicar no botão
    
    if (status !== 'idle') return;

    setStatus('loading');
    try {
      // POST para a API que cria o pedido
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANTE: O nome da chave aqui deve ser targetUserId
        body: JSON.stringify({ targetUserId: pessoa.id }), 
      });

      if (res.ok) {
        setStatus('sent');
      } else if (res.status === 409) {
        // Se der erro 409, significa que já existe pedido ou amizade
        setStatus('sent'); 
      } else {
        setStatus('idle'); // Falhou, volta ao normal
        console.error("Erro ao adicionar");
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
          <AvatarImage src={pessoa.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-emerald-600 text-white">
            {pessoa.nome?.[0] || "U"}
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
        // Estilo condicional baseado no estado
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
          <>
            <Check className="w-4 h-4 mr-1" /> Amigos
          </>
        ) : status === 'sent' ? (
          <>
            <Clock className="w-4 h-4 mr-1" /> Pendente
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-1" /> Adicionar
          </>
        )}
      </Button>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function SearchPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [results, setResults] = useState({ grupos: [], pessoas: [] });
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Buscar usuário logado
  useEffect(() => {
    fetch("/api/user/settings") // Usa user/settings para garantir dados frescos
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {});
  }, []);

  // Busca com Debounce
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
      
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoIcon}><BookOpen className="w-5 h-5 text-white" /></div>
            <span>EduConnect</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.userActions}>
            <Link href="/search" className="text-blue-400"><Search className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            <Link href="/profile">
              <Avatar className={styles.avatarSmall}>
                <AvatarImage src={user?.foto_url} />
                <AvatarFallback>{user?.nome?.[0] || "U"}</AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        {/* Search Input Section */}
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

        {/* Tabs */}
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

        {/* Results Area */}
        <div className={styles.resultsList}>
          
          {loadingSearch && <div className="text-center p-4 text-gray-400">A pesquisar...</div>}

          {/* GRUPOS */}
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

          {/* PESSOAS */}
          {(activeTab === "todos" || activeTab === "pessoas") && results.pessoas.map((pessoa: any) => (
            <PersonItem key={pessoa.id} pessoa={pessoa} />
          ))}

          {/* Empty States */}
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

      <footer className={styles.footer}>
        <div className="container mx-auto px-4">
          <p>&copy; 2025 EduConnect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}