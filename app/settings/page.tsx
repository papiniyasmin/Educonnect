"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// UI Components (Mantive os seus imports)
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
  Mail, Camera, Save, Loader2, Sparkles
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    nome: "",
    email: "",
    ano_escolar: "",
    curso: "",
    telefone: "",
    morada: "",
    bio: "",
    interesses: "",
    habilidades: "",
    foto_url: ""
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // 1. CARREGAR DADOS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/settings");
        if (res.status === 401) {
          router.push("/login"); // Redireciona se não estiver logado
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
        
        if (data.foto_url) {
          setAvatarPreview(data.foto_url);
        }
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
      
      // Validação básica de tamanho (ex: max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Máximo 5MB.");
        return;
      }

      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Preview local imediato
    }
  };

  // 2. SALVAR ALTERAÇÕES
  const handleSave = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      
      // Adiciona campos textuais
      data.append("nome", formData.nome);
      data.append("email", formData.email);
      data.append("ano_escolar", formData.ano_escolar);
      data.append("curso", formData.curso);
      data.append("telefone", formData.telefone);
      data.append("morada", formData.morada);
      data.append("bio", formData.bio);
      data.append("interesses", formData.interesses);
      data.append("habilidades", formData.habilidades);

      // Adiciona o arquivo apenas se foi selecionado
      if (selectedFile) {
        data.append("avatar", selectedFile);
      }

      const res = await fetch("/api/user/settings", {
        method: "PUT",
        body: data, // Não precisa de headers, o browser define multipart/form-data automaticamente
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.details || result.error || "Falha ao salvar");
      }

      if (result.newAvatar) {
        setAvatarPreview(result.newAvatar);
        setFormData(prev => ({ ...prev, foto_url: result.newAvatar }));
      }

      alert("✅ Perfil atualizado com sucesso!");
      router.refresh(); // Atualiza os dados da página (server components)

    } catch (err: any) {
      console.error(err);
      alert(`❌ Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h1>Meu Perfil</h1>
            <p>Gerencie suas informações pessoais e académicas.</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/dashboard">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className={styles.saveButton}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saving ? "Salvando..." : "Salvar Tudo"}
            </Button>
          </div>
        </div>

        {/* GRID MAIN */}
        <div className={styles.mainGrid}>
          
          {/* COLUNA ESQUERDA: CARTÃO DE IDENTIDADE */}
          <div className={styles.identityCard}>
            <div className={styles.banner}></div>
            <div className={styles.cardBody}>
              
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  <Avatar className={styles.avatar}>
                    <AvatarImage src={avatarPreview || "/placeholder-user.jpg"} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-slate-100">
                      {formData.nome ? formData.nome[0].toUpperCase() : <User />}
                    </AvatarFallback>
                  </Avatar>
                  <label htmlFor="avatar-upload" className={styles.cameraLabel}>
                    <Camera className="w-5 h-5" />
                    <input 
                      id="avatar-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className={styles.userInfo}>
                <h2>{formData.nome || "Utilizador"}</h2>
                <p>{formData.curso || "Sem curso definido"}</p>
              </div>

              <div className={styles.contactList}>
                <div className={styles.contactItem}>
                  <Mail className="w-4 h-4" />
                  {formData.email}
                </div>
                <div className={styles.contactItem}>
                  <GraduationCap className="w-4 h-4" />
                  {formData.ano_escolar || "Ano não definido"}
                </div>
                {formData.morada && (
                  <div className={styles.contactItem}>
                    <MapPin className="w-4 h-4" />
                    {formData.morada}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA DIREITA: FORMULÁRIOS COM ABAS */}
          <div className={styles.tabsContainer}>
            <Tabs defaultValue="pessoal" className="w-full">
              <TabsList className={styles.tabsList}>
                <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                <TabsTrigger value="academico">Académico</TabsTrigger>
                <TabsTrigger value="sobre">Sobre Mim</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoal">
                <Card className={styles.formCard}>
                  <CardHeader className={styles.cardHeader}>
                    <CardTitle className={styles.cardTitle}>
                      <User className="w-5 h-5" /> Dados Pessoais
                    </CardTitle>
                    <CardDescription className={styles.cardDesc}>Informações básicas de contacto e identificação.</CardDescription>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="nome">Nome Completo</Label>
                      <Input id="nome" value={formData.nome} onChange={handleChange} />
                    </div>
                    <div className={`${styles.formGrid} ${styles['cols-2']}`}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} disabled />
                        <p className="text-xs text-gray-500 mt-1">O email não pode ser alterado.</p>
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" value={formData.telefone} onChange={handleChange} placeholder="+351 ..." />
                      </div>
                    </div>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="morada">Morada</Label>
                      <Input id="morada" value={formData.morada} onChange={handleChange} placeholder="Sua cidade ou endereço" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="academico">
                <Card className={styles.formCard}>
                  <CardHeader className={styles.cardHeader}>
                    <CardTitle className={styles.cardTitle}>
                      <BookOpen className="w-5 h-5" /> Vida Escolar
                    </CardTitle>
                    <CardDescription className={styles.cardDesc}>Detalhes sobre o seu percurso na escola.</CardDescription>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <div className={`${styles.formGrid} ${styles['cols-2']}`}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="ano_escolar">Ano Escolar</Label>
                        <select
                          id="ano_escolar"
                          value={formData.ano_escolar}
                          onChange={handleChange}
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecione...</option>
                          <option value="10º">10º Ano</option>
                          <option value="11º">11º Ano</option>
                          <option value="12º">12º Ano</option>
                        </select>
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="curso">Curso</Label>
                        <Input id="curso" value={formData.curso} onChange={handleChange} placeholder="Ex: Ciências e Tecnologias" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sobre">
                <Card className={styles.formCard}>
                  <CardHeader className={styles.cardHeader}>
                    <CardTitle className={styles.cardTitle}>
                      <Sparkles className="w-5 h-5" /> Perfil Detalhado
                    </CardTitle>
                    <CardDescription className={styles.cardDesc}>Conte mais sobre si para a comunidade.</CardDescription>
                  </CardHeader>
                  <CardContent className={styles.cardContent}>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="bio">Biografia</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Um breve resumo sobre quem você é..."
                        className="h-24"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="interesses">Interesses</Label>
                      <Input
                        id="interesses"
                        value={formData.interesses}
                        onChange={handleChange}
                        placeholder="Ex: Futebol, Programação, Música"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="habilidades">Habilidades / Skills</Label>
                      <Input
                        id="habilidades"
                        value={formData.habilidades}
                        onChange={handleChange}
                        placeholder="Ex: Inglês fluente, Edição de Vídeo..."
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}