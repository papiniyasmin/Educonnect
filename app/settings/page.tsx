"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

// UI Components
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  User, BookOpen, GraduationCap, MapPin,
  Mail, Camera, Save, Loader2, Sparkles, Search, Settings, LogOut, Users, Bell
} from "lucide-react";

// Styles
import styles from "./settingsPage.module.scss";

interface UserFormData {
  nome: string;
  email: string;
  ano_escolar: string;
  curso: string;
  telefone: string;
  morada: string;
  bio: string;
  interesses: string;
  habilidades: string;
  foto_url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    nome: "", email: "", ano_escolar: "", curso: "",
    telefone: "", morada: "", bio: "", interesses: "",
    habilidades: "", foto_url: ""
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar dados");

        const data = await res.json();
        setFormData({
          nome: data.nome || "",
          email: data.email || "",
          ano_escolar: data.ano_escolar || "",
          curso: data.curso || "",
          telefone: data.telefone || "",
          morada: data.morada || "",
          bio: data.bio || "",
          interesses: data.interesses || "",
          habilidades: data.habilidades || "",
          foto_url: data.foto_url || ""
        });
        if (data.foto_url) setAvatarPreview(data.foto_url);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Máximo 5MB.");
        return;
      }
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'foto_url') data.append(key, value);
      });
      if (selectedFile) data.append("avatar", selectedFile);

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        body: data,
      });

      if (!res.ok) throw new Error("Falha ao salvar");
      
      alert("✅ Perfil atualizado com sucesso!");
      router.refresh();
    } catch (err) {
      alert("❌ Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* HEADER DESKTOP */}
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
            <Link href="/search"><Search className="w-5 h-5" /></Link>
            <Link href="/settings" className="text-emerald-400"><Settings className="w-5 h-5" /></Link>
            <Link href="/profile">
              <Avatar className="w-8 h-8 border border-slate-700">
                {avatarPreview ? <AvatarImage src={avatarPreview} /> : null}
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {formData.nome ? formData.nome[0].toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5" /></Link>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          
          <div className={styles.settingsHeader}>
            <div className={styles.headerText}>
              <h1 className="text-2xl font-bold text-white mb-1">O Meu Perfil</h1>
              <p className="text-slate-400">Gere as tuas informações pessoais e académicas.</p>
            </div>
            <div className={styles.headerActions}>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? "A Guardar..." : "Guardar Tudo"}
              </Button>
            </div>
          </div>

          <div className={styles.mainGrid}>
            {/* CARD DE IDENTIDADE */}
            <div className={styles.identityCard}>
              <div className={styles.banner}></div>
              <div className={styles.cardBody}>
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <Avatar className={styles.avatar}>
                      {avatarPreview ? <AvatarImage src={avatarPreview} className="object-cover" /> : null}
                      <AvatarFallback className="text-3xl bg-emerald-600 text-white">
                        {formData.nome ? formData.nome[0].toUpperCase() : <User />}
                      </AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className={styles.cameraLabel}>
                      <Camera className="w-5 h-5" /><input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className={styles.userInfo}>
                  <h2>{formData.nome || "Utilizador"}</h2>
                  <p>{formData.curso || "Estudante"}</p>
                </div>
                <div className={styles.contactList}>
                  <div className={styles.contactItem}><Mail className="w-4 h-4" />{formData.email}</div>
                  <div className={styles.contactItem}><GraduationCap className="w-4 h-4" />{formData.ano_escolar || "Ano não definido"}</div>
                  {formData.morada ? (
                    <div className={styles.contactItem}><MapPin className="w-4 h-4" />{formData.morada}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ABAS DE EDIÇÃO */}
            <div className={styles.tabsContainer}>
              <Tabs defaultValue="pessoal" className="w-full">
                <TabsList className={styles.tabsList}>
                  <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                  <TabsTrigger value="academico">Académico</TabsTrigger>
                  <TabsTrigger value="sobre">Sobre</TabsTrigger>
                </TabsList>

                <TabsContent value="pessoal">
                  <Card className={styles.formCard}>
                    <CardContent className={styles.cardContent + " pt-6"}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input id="nome" value={formData.nome} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="morada">Morada</Label>
                        <Input id="morada" value={formData.morada} onChange={handleChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="academico">
                  <Card className={styles.formCard}>
                    <CardContent className={styles.cardContent + " pt-6"}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="curso">Curso</Label>
                        <Input id="curso" value={formData.curso} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="ano_escolar">Ano Escolar</Label>
                        <select id="ano_escolar" value={formData.ano_escolar} onChange={handleChange} className="w-full h-10 bg-slate-800 border-slate-700 rounded-md px-3 text-sm text-white">
                          <option value="">Selecione...</option>
                          <option value="10º">10º Ano</option>
                          <option value="11º">11º Ano</option>
                          <option value="12º">12º Ano</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sobre">
                  <Card className={styles.formCard}>
                    <CardContent className={styles.cardContent + " pt-6"}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="bio">Biografia</Label>
                        <Textarea id="bio" value={formData.bio} onChange={handleChange} className="h-24" />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER MOBILE NAV (Igual ao Groups) */}
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
          <Link href="/settings" className={pathname === '/settings' ? styles.activeLink : ''}>
            <Settings className="w-5 h-5" />
            <span>Ajustes</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}