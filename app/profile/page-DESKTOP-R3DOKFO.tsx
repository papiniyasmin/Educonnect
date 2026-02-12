"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  Settings,
  LogOut,
  Mail,
  Calendar,
  GraduationCap,
  Award,
  FileText,
  Users,
  Bell
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Carregando...
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white">
      <p>Usuário não encontrado</p>
      <Button onClick={() => router.push("/login")}>Ir para login</Button>
    </div>
  );

  const stats = { posts: 24, grupos: 5, respostas: 89 };
  const interests = ["Matemática", "Física", "Programação", "Astronomia"];
  const recentActivity = [
    { id: 1, type: "post", title: "Dúvida sobre Derivadas", date: "Há 2 dias" },
    { id: 2, type: "comment", title: "Comentou em 'Equações do 2º Grau'", date: "Há 3 dias" },
    { id: 3, type: "group", title: "Entrou no grupo 'Matemática Avançada'", date: "Há 1 semana" },
  ];

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  };

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

            {/* MENU */}
            <nav className="hidden md:flex items-center space-x-6">

              <Link
                href="/dashboard"
                className={
                  pathname === "/dashboard"
                    ? "text-emerald-400 border-b-2 border-emerald-500 pb-1"
                    : "text-slate-300 hover:text-white"
                }
              >
                Feed
              </Link>

              <Link
                href="/groups"
                className={
                  pathname === "/groups"
                    ? "text-emerald-400 border-b-2 border-emerald-500 pb-1"
                    : "text-slate-300 hover:text-white"
                }
              >
                Grupos
              </Link>

              <Link
                href="/chat"
                className={
                  pathname === "/chat"
                    ? "text-emerald-400 border-b-2 border-emerald-500 pb-1"
                    : "text-slate-300 hover:text-white"
                }
              >
                Chat
              </Link>

            </nav>
          </div>

          {/* AÇÕES DO HEADER */}
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

            {/* AVATAR QUE FICA VERDE NO /profile */}
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Avatar
                  className={
                    pathname === "/profile"
                      ? "w-8 h-8 cursor-pointer ring-2 ring-emerald-500"
                      : "w-8 h-8 cursor-pointer"
                  }
                >
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>

          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

          {/* PROFILE HEADER CARD */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                
                <Avatar className="w-32 h-32 border-4 border-emerald-500">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white text-4xl">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-white mb-2">{user.name}</h2>
                  <p className="text-slate-400 mb-4">Bio do usuário aqui...</p>

                  <div className="flex flex-wrap gap-4 mb-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{user.email}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <GraduationCap className="w-4 h-4" />
                      <span className="text-sm">{user.year} - {user.curso}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Membro desde Setembro 2023</span>
                    </div>
                  </div>

                  <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
                    <Link href="/settings">Editar Perfil</Link>
                  </Button>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-500" />Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-400">{stats.posts}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />Grupos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-400">{stats.grupos}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-500" />Respostas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-400">{stats.respostas}</p>
              </CardContent>
            </Card>
          </div>

          {/* INTERESTS & RECENT ACTIVITY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Interesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, idx) => (
                    <Badge
                      key={idx}
                      className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{activity.title}</p>
                        <p className="text-slate-400 text-xs">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900/80 border-t border-slate-700/50 py-4 text-center text-slate-400 mt-12">
        <div className="container mx-auto px-4">
          <p>&copy; 2023 EduConnect. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
