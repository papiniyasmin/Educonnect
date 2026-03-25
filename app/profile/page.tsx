"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { useRouter, usePathname } from "next/navigation";

// Componentes de UI (Normalmente gerados por bibliotecas como shadcn/ui)
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Ícones
import {
  BookOpen, Search, UserPlus, Settings, LogOut, Mail, Calendar,
  GraduationCap, Award, FileText, Users, Bell, User as UserIcon, Loader2
} from "lucide-react";

// Estilos
import styles from "./profilePage.module.scss";

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Extrai as iniciais do nome para mostrar no Avatar quando o utilizador não tem foto.
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Formata a URL da imagem de perfil. Se for um link externo ou base64, usa como está. 
// Caso contrário, assume que é um ficheiro local guardado na pasta /uploads/.
const getAvatarUrl = (url: string | undefined | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

export default function ProfilePage() {
  // =========================================================================
  // HOOKS E ESTADOS
  // =========================================================================
  const router = useRouter(); // Permite redirecionamentos via código
  const pathname = usePathname(); // Permite saber em que página estamos (útil para o menu ativo)
  
  const [loading, setLoading] = useState(true); // Controla o ecrã de carregamento global da página
  
  // Estados de dados do utilizador
  // Nota: Usa-se `any` provisoriamente, mas num projeto tipado o ideal seria criar Interfaces para estes estados.
  const [userData, setUserData] = useState<any>(null); // Informações básicas (nome, bio, etc.)
  const [stats, setStats] = useState({ posts: 0, grupos: 0, respostas: 0 }); // Contadores do perfil
  const [interests, setInterests] = useState<string[]>([]); // Lista de interesses
  const [activity, setActivity] = useState<any[]>([]); // Histórico de atividades

  // =========================================================================
  // EFFECTS (Carregamento de Dados)
  // =========================================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. DADOS BASE DO UTILIZADOR
        const userRes = await fetch("/api/user/settings");
        
        // Proteção de Rota: Se a API retornar 401 (Não Autorizado), significa que a sessão expirou ou não existe.
        if (userRes.status === 401) {
          router.push("/login"); // Expulsa o utilizador para a página de login
          return; // Para a execução do código aqui
        }
        
        const userJson = await userRes.json();
        setUserData(userJson);

        // 2. ESTATÍSTICAS EXTRAS DO PERFIL
        // Opcional: Se esta API falhar, não quebramos a página, apenas não mostramos os dados extra.
        const statsRes = await fetch("/api/profile/stats");
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          // Atualiza os estados com salvaguardas (fallbacks) caso a API não devolva as chaves exatas
          setStats(statsJson.stats || { posts: 0, grupos: 0, respostas: 0 });
          setInterests(statsJson.interests || []);
          setActivity(statsJson.recentActivity || []);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        // Independentemente de dar erro ou sucesso, desliga o ecrã de loading
        setLoading(false);
      }
    };
    
    fetchData();
  }, [router]);

  // =========================================================================
  // RENDERIZAÇÃO DE ESTADOS INTERMÉDIOS
  // =========================================================================
  if (loading) {
    // Mostra um ícone a rodar enquanto os dados não chegam
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // Prepara o URL da foto de forma segura para usar abaixo
  const userAvatar = getAvatarUrl(userData?.foto_url);

  // =========================================================================
  // RENDERIZAÇÃO DA PÁGINA (JSX)
  // =========================================================================
  return (
    <div className={styles.pageContainer}>
      
      {/* --- HEADER (Menu Topo) --- */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          
          {/* Logo */}
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
          
          {/* Menu Desktop Central */}
          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>
          
          {/* Ícones de Ação à Direita */}
          <div className={styles.userActions}>
            <Link href="/search"><Search className="w-5 h-5" /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/notification"><Bell className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            
            {/* O link do próprio perfil fica verde (ativo) se o pathname corresponder */}
            <Link href="/profile" className={pathname === '/profile' ? "text-emerald-400" : ""}>
              <Avatar className="w-8 h-8 border border-slate-700">
                {userAvatar && <AvatarImage src={userAvatar} className="object-cover" />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                  {getInitials(userData?.nome)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5 hover:text-red-400 transition-colors" /></Link>
          </div>
        </div>
      </header>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className={styles.mainWrapper}>
        
        {/* CARTÃO DE CABEÇALHO DO PERFIL (Foto + Info principal) */}
        <Card className={styles.profileHeaderCard}>
          <CardContent className="pt-6">
            <div className={styles.profileContent}>
              
              {/* Foto Principal */}
              <div className="relative">
                <Avatar className={styles.largeAvatar}>
                  {userAvatar && <AvatarImage src={userAvatar} className="object-cover" />}
                  <AvatarFallback className="text-3xl bg-emerald-600 text-white font-medium">
                    {getInitials(userData?.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Informações ao lado da foto */}
              <div className={styles.infoSection}>
                <h2 className="text-2xl font-bold text-white mb-1">{userData?.nome || "Utilizador"}</h2>
                <p className={styles.bio}>{userData?.bio || "Sem biografia definida."}</p>

                {/* Ícones com Meta Dados (Email, Curso, Data de Adesão) */}
                <div className={styles.metaInfoWrapper}>
                  <div className={styles.metaItem}>
                    <Mail className="w-4 h-4 text-emerald-500" /> <span>{userData?.email}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> 
                    <span>{userData?.ano_escolar || "12º"} Ano - {userData?.curso || "Geral"}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Calendar className="w-4 h-4 text-emerald-500" /> <span>Membro desde 2026</span>
                  </div>
                </div>

                {/* Botão de Editar Perfil (Redireciona para as configurações) */}
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white mt-4" asChild>
                  <Link href="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Editar Perfil
                  </Link>
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* --- GRELHA DE ESTATÍSTICAS (3 Blocos) --- */}
        <div className={styles.statsGrid}>
          
          <Card className={styles.statCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" /> Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.posts}</p>
            </CardContent>
          </Card>

          <Card className={styles.statCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.grupos}</p>
            </CardContent>
          </Card>

          <Card className={styles.statCard}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Respostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.respostas}</p>
            </CardContent>
          </Card>
        </div>

        {/* --- GRELHA DE DETALHES (Interesses e Atividades) --- */}
        <div className={styles.detailsGrid}>
          
          {/* Seção Interesses */}
          <Card className={styles.sectionCard}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Interesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.tagsWrapper}>
                {/* Verifica se existem interesses. Se sim, mapeia-os; se não, mostra mensagem vazia. */}
                {interests.length > 0 ? interests.map((tag, i) => (
                  <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                    {tag}
                  </Badge>
                )) : <span className="text-slate-500 text-sm">Nenhum interesse listado.</span>}
              </div>
            </CardContent>
          </Card>

          {/* Seção Atividade Recente */}
          <Card className={styles.sectionCard}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.activityList}>
                {/* Verifica se há atividades no array */}
                {activity.length > 0 ? activity.map((act) => (
                  <div key={act.id} className={styles.activityItem}>
                    {/* Ponto visual (dot) ao lado da atividade */}
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className={styles.activityInfo}>
                      <p className="text-slate-200 text-sm font-medium">{act.title}</p>
                      <p className="text-slate-500 text-xs">{act.date}</p>
                    </div>
                  </div>
                )) : <span className="text-slate-500 text-sm">Nenhuma atividade recente.</span>}
              </div>
            </CardContent>
          </Card>
          
        </div>
      </main>

      {/* --- FOOTER MOBILE (Só visível em ecrãs pequenos por CSS) --- */}
      <footer className={styles.mobileNav}>
        <div className={styles.navContent}>
          {/* Aplica dinamicamente a classe "activeLink" baseando-se no URL atual (pathname) */}
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
          <Link href="/profile" className={pathname === '/profile' ? styles.activeLink : ''}>
            <UserIcon className="w-5 h-5" />
            <span>Perfil</span>
          </Link>
        </div>
      </footer>
      
    </div>
  );
}