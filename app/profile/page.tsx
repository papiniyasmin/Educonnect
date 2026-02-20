"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  BookOpen, Search, Settings, LogOut, Mail, Calendar,
  GraduationCap, Award, FileText, Users
} from "lucide-react";

// Styles
import styles from "./profilePage.module.scss";

// Types
interface ProfileData {
  stats: {
    posts: number;
    grupos: number;
    respostas: number;
  };
  interests: string[];
  recentActivity: {
    id: number;
    type: string;
    title: string;
    date: string;
  }[];
  bio?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchProfileData() {
      try {
        const res = await fetch("/api/profile/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Falha na requisição");
        const data = await res.json();
        setProfileData(data);
      } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
      } finally {
        setDataLoading(false);
      }
    }

    fetchProfileData();
  }, [user]);

  // Loading State
  if (userLoading) return (
    <div className={styles.loadingContainer}>
      Carregando...
    </div>
  );

  // Unauthenticated State
  if (!user) {
    return (
      <div className={styles.emptyContainer}>
        <p>Usuário não encontrado</p>
        <Button onClick={() => router.push("/login")}>Ir para login</Button>
      </div>
    );
  }

  // Safe Defaults
  const stats = profileData?.stats || { posts: 0, grupos: 0, respostas: 0 };
  const interests = profileData?.interests || [];
  const recentActivity = profileData?.recentActivity || [];
  
  const userBio = profileData?.bio || "Olá! Ainda não defini minha bio.";
  const userCurso = (user as any).curso || "Geral";
  const userAno = (user as any).ano_escolar || "12º";

  // --- CORREÇÃO DA IMAGEM AQUI ---
  const userAvatar = (user as any).foto_url || (user as any).avatar || "";

  return (
    <div className={styles.pageContainer}>

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logoLink}>
            <div className={styles.logoIcon}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span>EduConnect</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/dashboard">Feed</Link>
            <Link href="/groups">Grupos</Link>
            <Link href="/chat">Chat</Link>
          </nav>

          <div className={styles.userActions}>
            <Link href="/search"><Search className="w-5 h-5" /></Link>
            <Link href="/settings"><Settings className="w-5 h-5" /></Link>
            
            <Link href="/profile">
              <Avatar className={styles.avatarSmall}>
                {/* Imagem do Header corrigida */}
                {userAvatar ? (
                   <AvatarImage src={userAvatar} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white">
                  {user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            
            <Link href="/login"><LogOut className="w-5 h-5 hover:text-red-400 transition-colors" /></Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className={styles.mainWrapper}>
        
        {/* PROFILE HEADER CARD */}
        <Card className={styles.profileHeaderCard}>
          <CardContent className="pt-6">
            <div className={styles.profileContent}>
              
              {/* Avatar Principal */}
              <Avatar className={styles.largeAvatar}>
                {/* Imagem Principal corrigida */}
                {userAvatar ? (
                   <AvatarImage src={userAvatar} alt={user.name || "User"} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-emerald-600 text-white text-4xl">
                  {user.name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className={styles.infoSection}>
                <h2>{user.name}</h2>
                <p className={styles.bio}>{userBio}</p>

                <div className={styles.metaInfoWrapper}>
                  <div className={styles.metaItem}>
                    <Mail /> <span>{user.email}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <GraduationCap /> <span>{userAno} - {userCurso}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Calendar /> <span>Membro ativo</span>
                  </div>
                </div>

                <Button className={styles.btnEdit} asChild>
                  <Link href="/settings">Editar Perfil</Link>
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* LOADING SECONDARY DATA */}
        {dataLoading ? (
            <div className="text-center py-10">
               <span className={styles.pulseText}>A carregar estatísticas...</span>
            </div>
        ) : (
          <>
            {/* STATS GRID */}
            <div className={styles.statsGrid}>
              <Card className={styles.statCard}>
                <CardHeader className="pb-3">
                  <CardTitle className={styles.cardTitle}>
                    <FileText /> Posts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={styles.statValue}>{stats.posts}</p>
                </CardContent>
              </Card>

              <Card className={styles.statCard}>
                <CardHeader className="pb-3">
                  <CardTitle className={styles.cardTitle}>
                    <Users /> Grupos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={styles.statValue}>{stats.grupos}</p>
                </CardContent>
              </Card>

              <Card className={styles.statCard}>
                <CardHeader className="pb-3">
                  <CardTitle className={styles.cardTitle}>
                    <Award /> Respostas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className={styles.statValue}>{stats.respostas}</p>
                </CardContent>
              </Card>
            </div>

            {/* BOTTOM GRID */}
            <div className={styles.detailsGrid}>

              {/* Interests */}
              <Card className={styles.sectionCard}>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>Interesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={styles.tagsWrapper}>
                    {interests.length > 0 ? interests.map((interest, idx) => (
                      <Badge key={idx} className={styles.tagBadge}>
                        {interest}
                      </Badge>
                    )) : <span className={styles.emptyText}>Nenhum interesse listado.</span>}
                  </div>
                </CardContent>
              </Card>

              {/* Activity */}
              <Card className={styles.sectionCard}>
                <CardHeader>
                  <CardTitle className={styles.sectionTitle}>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={styles.activityList}>
                    {recentActivity.length > 0 ? recentActivity.map(activity => (
                      <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.dot}></div>
                        <div className={styles.activityInfo}>
                          <p className={styles.actTitle}>{activity.title}</p>
                          <p className={styles.actDate}>{activity.date}</p>
                        </div>
                      </div>
                    )) : <span className={styles.emptyText}>Nenhuma atividade recente.</span>}
                  </div>
                </CardContent>
              </Card>

            </div>
          </>
        )}

      </main>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className="container mx-auto px-4">
          <p>&copy; 2026 EduConnect. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}