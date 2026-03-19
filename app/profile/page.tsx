"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { useRouter, usePathname } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  BookOpen, Search, UserPlus, Settings, LogOut, Mail, Calendar,
  GraduationCap, Award, FileText, Users, Bell, User as UserIcon, Loader2
} from "lucide-react";

// Styles
import styles from "./profilePage.module.scss";

// --- FUNÇÕES AUXILIARES (IGUAIS ÀS SETTINGS) ---
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getAvatarUrl = (url: string | undefined | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  
  // Estados para os dados (Seguindo o padrão de busca manual das Settings)
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState({ posts: 0, grupos: 0, respostas: 0 });
  const [interests, setInterests] = useState<string[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Dados do utilizador (Igual ao fetch das Settings)
        const userRes = await fetch("/api/user/settings");
        if (userRes.status === 401) {
          router.push("/login");
          return;
        }
        const userJson = await userRes.json();
        setUserData(userJson);

        // 2. Estatísticas extras do perfil
        const statsRes = await fetch("/api/profile/stats");
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson.stats || { posts: 0, grupos: 0, respostas: 0 });
          setInterests(statsJson.interests || []);
          setActivity(statsJson.recentActivity || []);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  const userAvatar = getAvatarUrl(userData?.foto_url);

  return (
    <div className={styles.pageContainer}>
      {/* HEADER - IDENTICO À SETTINGS PAGE */}
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
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>
          <div className={styles.userActions}>
            <Link href="/search"><Search className="w-5 h-5" /></Link>
            <Link href="/friends/requests"><UserPlus className="w-5 h-5" /></Link>
            <Link href="/notifications"><Bell className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
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

      <main className={styles.mainWrapper}>
        
        {/* PROFILE HEADER CARD */}
        <Card className={styles.profileHeaderCard}>
          <CardContent className="pt-6">
            <div className={styles.profileContent}>
              
              <div className="relative">
                <Avatar className={styles.largeAvatar}>
                  {userAvatar && <AvatarImage src={userAvatar} className="object-cover" />}
                  <AvatarFallback className="text-3xl bg-emerald-600 text-white font-medium">
                    {getInitials(userData?.nome)}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className={styles.infoSection}>
                <h2 className="text-2xl font-bold text-white mb-1">{userData?.nome || "Utilizador"}</h2>
                <p className={styles.bio}>{userData?.bio || "Sem biografia definida."}</p>

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

        {/* STATS GRID */}
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

        {/* DETAILS GRID */}
        <div className={styles.detailsGrid}>
          <Card className={styles.sectionCard}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Interesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.tagsWrapper}>
                {interests.length > 0 ? interests.map((tag, i) => (
                  <Badge key={i} className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1">
                    {tag}
                  </Badge>
                )) : <span className="text-slate-500 text-sm">Nenhum interesse listado.</span>}
              </div>
            </CardContent>
          </Card>

          <Card className={styles.sectionCard}>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.activityList}>
                {activity.length > 0 ? activity.map((act) => (
                  <div key={act.id} className={styles.activityItem}>
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

      {/* FOOTER MOBILE */}
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
          <Link href="/profile" className={pathname === '/profile' ? styles.activeLink : ''}>
            <UserIcon className="w-5 h-5" />
            <span>Perfil</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}