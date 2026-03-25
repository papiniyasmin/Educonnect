"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

// Componentes da UI
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

// Ícones
import { 
  BookOpen, Search, Settings, LogOut, 
  Users, MessageCircle, UserPlus, Clock, Loader2, Check, Bell 
} from "lucide-react";

import styles from "./searchPage.module.scss";

// Define os tipos permitidos para os separadores de pesquisa
type TabType = "todos" | "grupos" | "pessoas";

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Extrai as iniciais do nome para o Avatar (ex: "João Silva" -> "JS")
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Formata a URL da imagem (aceita links externos, base64 ou caminhos locais na pasta /uploads/)
const getAvatarUrl = (url: string | undefined) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

// =========================================================================
// COMPONENTE: PersonItem (Cartão individual de um utilizador na pesquisa)
// =========================================================================
const PersonItem = ({ pessoa }: { pessoa: any }) => {
  const router = useRouter();
  
  // Estado local para gerir o botão de "Adicionar Amigo".
  // Inicializa com base no estado que vem da API de pesquisa.
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'friend'>(
    pessoa.estado_amizade === 'ACEITE' ? 'friend' :
    pessoa.estado_amizade === 'PENDENTE' ? 'sent' : 'idle'
  );

  // Função para enviar o pedido de amizade
  const handleAddFriend = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Impede que o clique no botão ative o clique no cartão (que redireciona para o perfil)
    
    if (status !== 'idle') return; // Só permite clicar se estiver no estado inicial ("Adicionar")
    
    setStatus('loading'); // Mostra o spinner no botão
    
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: pessoa.id }), 
      });
      
      if (res.ok) setStatus('sent'); // Se sucesso, muda para "Pendente"
      else setStatus('idle'); // Se falhar, volta ao estado inicial para tentar de novo
    } catch (error) {
      setStatus('idle');
    }
  };

  const pessoaAvatarUrl = getAvatarUrl(pessoa.foto_url || pessoa.avatar);

  return (
    // Clicar no cartão inteiro (exceto no botão) redireciona para o perfil da pessoa
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
      
      {/* Botão de Amizade Dinâmico */}
      <Button 
        onClick={handleAddFriend} 
        disabled={status !== 'idle'} // Desativa o botão se já foi enviado, aceite ou está a carregar
        size="sm" 
        variant={status === 'idle' ? "default" : "ghost"} // Muda o estilo visual consoante o estado
      >
        {/* Renderiza o ícone e texto corretos consoante o estado atual */}
        {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
         status === 'friend' ? <><Check className="w-4 h-4 mr-1" /> Amigos</> :
         status === 'sent' ? <><Clock className="w-4 h-4 mr-1" /> Pendente</> :
         <><UserPlus className="w-4 h-4 mr-1" /> Adicionar</>}
      </Button>
    </div>
  );
};

// =========================================================================
// PÁGINA PRINCIPAL: SearchPage
// =========================================================================
export default function SearchPage() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Estados da página
  const [user, setUser] = useState<any>(null); // Dados do utilizador logado (para o Header)
  const [searchQuery, setSearchQuery] = useState(""); // O que o utilizador digita na caixa de pesquisa
  const [activeTab, setActiveTab] = useState<TabType>("todos"); // Controla o separador ativo (Todos, Grupos, Pessoas)
  const [results, setResults] = useState({ grupos: [], pessoas: [] }); // Guarda os resultados vindos da API
  const [loadingSearch, setLoadingSearch] = useState(false); // Controla o spinner de pesquisa

  // Efeito para carregar os dados do utilizador logado no arranque da página
  useEffect(() => {
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => {});
  }, []);

  // =========================================================================
  // LÓGICA DE PESQUISA COM DEBOUNCE
  // =========================================================================
  useEffect(() => {
    // Se a caixa de pesquisa estiver vazia, limpa os resultados
    if (!searchQuery.trim()) {
      setResults({ grupos: [], pessoas: [] });
      setLoadingSearch(false);
      return;
    }

    // DEBOUNCE: Espera 300ms depois do utilizador parar de escrever antes de chamar a API.
    // Isto evita fazer dezenas de pedidos à base de dados a cada letra digitada.
    const delay = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
            const data = await res.json();
            setResults(data); // Atualiza o estado com os grupos e pessoas encontrados
        }
      } catch (error) {
        console.error("Erro na busca", error);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    // Função de limpeza: Se o utilizador digitar outra letra antes dos 300ms, cancela o temporizador anterior
    return () => clearTimeout(delay);
  }, [searchQuery]);

  // Variável derivada para saber se há algo a mostrar
  const hasResults = results.grupos.length > 0 || results.pessoas.length > 0;
  const userAvatarUrl = getAvatarUrl(user?.foto_url || user?.avatar);

  return (
    <div className={styles.pageContainer}>
      
      {/* --- HEADER --- */}
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
            <Link href="/notification"><Bell className="w-5 h-5" /></Link>
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

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className={styles.mainContent}>
        
        {/* BARRA DE PESQUISA */}
        <div className={styles.searchSection}>
          <h2>Pesquisar</h2>
          <div className={styles.inputWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              type="text"
              placeholder="Digite a letra inicial..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} // Atualiza o estado da query (que dispara o useEffect)
              className={styles.searchInput}
              autoFocus // Coloca o cursor na caixa logo ao abrir a página
            />
          </div>
        </div>

        {/* SEPARADORES (Tabs: Todos | Grupos | Pessoas) */}
        <div className={styles.tabsContainer}>
          {["todos", "grupos", "pessoas"].map((t) => (
            <Button
              key={t}
              variant="ghost"
              // Aplica a classe 'active' se o separador atual for igual ao botão renderizado
              className={`${styles.tabBtn} ${activeTab === t ? styles.active : ""}`}
              onClick={() => setActiveTab(t as TabType)}
            >
              {/* Capitaliza a primeira letra da Tab (ex: "todos" -> "Todos") */}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Button>
          ))}
        </div>

        {/* LISTA DE RESULTADOS */}
        <div className={styles.resultsList}>
          
          {/* Mostra um spinner de carregamento enquanto a API responde */}
          {loadingSearch && (
            <div className="flex justify-center p-8 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>A carregar...</span>
            </div>
          )}

          {/* Renderização condicional dos resultados */}
          {!loadingSearch && (
            <>
              {/* Renderiza Grupos se a tab for "todos" ou "grupos" */}
              {(activeTab === "todos" || activeTab === "grupos") && results.grupos.map((grupo: any) => (
                <div key={grupo.id} className={styles.resultCard} onClick={() => router.push(`/groups/${grupo.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{grupo.nome}</h4>
                      <p className="text-sm text-gray-500 capitalize">{grupo.tipo}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Renderiza Pessoas se a tab for "todos" ou "pessoas" */}
              {(activeTab === "todos" || activeTab === "pessoas") && results.pessoas.map((pessoa: any) => (
                // Chama o componente criado lá em cima, passando os dados da pessoa
                <PersonItem key={pessoa.id} pessoa={pessoa} />
              ))}
            </>
          )}

          {/* ESTADO: Sem Resultados */}
          {/* Só mostra se não estiver a carregar, se houver texto escrito, e se a API não devolveu nada */}
          {!loadingSearch && searchQuery && !hasResults && (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p>Nenhum resultado começa com "{searchQuery}"</p>
            </div>
          )}

          {/* ESTADO INICIAL: Caixa vazia */}
          {/* Mostra as instruções antes de o utilizador começar a escrever */}
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