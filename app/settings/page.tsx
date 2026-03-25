"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image" ;
import { useRouter, usePathname } from "next/navigation";

// Componentes UI do sistema de design
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Ícones da biblioteca Lucide
import {
  User, BookOpen, GraduationCap, MapPin,
  Mail, Camera, Save, Loader2, Sparkles, Search, Settings, LogOut, Users, Bell, UserPlus
} from "lucide-react";

// Estilos específicos da página
import styles from "./settingsPage.module.scss";

// Tipagem TypeScript para garantir que o formulário tem a estrutura correta
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

// =========================================================================
// FUNÇÕES AUXILIARES
// =========================================================================

// Extrai as iniciais do nome para o Avatar de fallback (ex: "João Silva" -> "JS")
const getInitials = (name: string | undefined) => {
  if (!name) return "U"; 
  const names = name.trim().split(" ");
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Formata a URL da imagem. Se for link externo (Google) ou base64, usa direto.
// Se for o nome de um ficheiro carregado pelo utilizador, adiciona a pasta `/uploads/`.
const getAvatarUrl = (url: string | undefined | null) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) {
    return url;
  }
  return `/uploads/${url}`;
};

// =========================================================================
// COMPONENTE PRINCIPAL: SettingsPage
// =========================================================================
export default function SettingsPage() {
  const router = useRouter(); // Navegação programática
  const pathname = usePathname(); // Obter rota atual (usado na mobile nav)
  
  // Estados de carregamento
  const [loading, setLoading] = useState(true); // Carregamento inicial da página
  const [saving, setSaving] = useState(false);  // Carregamento ao clicar em "Guardar"

  // Estado que guarda todos os dados dos inputs
  const [formData, setFormData] = useState<UserFormData>({
    nome: "", email: "", ano_escolar: "", curso: "",
    telefone: "", morada: "", bio: "", interesses: "",
    habilidades: "", foto_url: ""
  });

  // Estados para gerir o upload de uma nova foto de perfil
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // O ficheiro físico da imagem
  const [avatarPreview, setAvatarPreview] = useState<string>(""); // URL temporária para pré-visualizar a imagem no ecrã

  // =========================================================================
  // CARREGAMENTO INICIAL DOS DADOS
  // =========================================================================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/settings");
        
        // Se o utilizador não estiver logado, manda para o login
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (!res.ok) throw new Error("Erro ao carregar dados");

        const data = await res.json();
        
        // Formata a URL da foto recebida da base de dados
        const fetchedFotoUrl = getAvatarUrl(data.foto_url);

        // Preenche o formulário com os dados que vieram da base de dados.
        // O `|| ""` serve para evitar erros de "uncontrolled input" se a BD devolver 'null'.
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
          foto_url: fetchedFotoUrl
        });

        // Atualiza a pré-visualização da imagem atual
        if (fetchedFotoUrl) setAvatarPreview(fetchedFotoUrl);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // Desliga o spinner de carregamento inicial
      }
    };
    fetchData();
  }, [router]);

  // =========================================================================
  // HANDLERS (Ações do Utilizador)
  // =========================================================================

  // Atualiza dinamicamente qualquer input/textarea cujo ID corresponda a uma chave do formData
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Trata o clique no ícone da câmara (escolher ficheiro)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validação de tamanho: máximo 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem é muito grande. Máximo 5MB.");
        return;
      }
      
      setSelectedFile(file); // Guarda o ficheiro para enviar à API mais tarde
      setAvatarPreview(URL.createObjectURL(file)); // Cria um link local e temporário para mostrar a foto no ecrã
    }
  };

  // Função disparada ao clicar em "Guardar Tudo"
  const handleSave = async () => {
    setSaving(true);
    
    // ==========================================
    // VALIDAÇÃO FRONTEND: Impede erro 400 da BD
    // ==========================================
    // O Enum da base de dados apenas aceita estes três valores. 
    // Se enviarmos outra coisa, a API dá crash.
    const validAnos = ['10º', '11º', '12º'];
    if (!formData.ano_escolar || !validAnos.includes(formData.ano_escolar)) {
      alert("❌ Por favor, vai à aba 'Académico' e seleciona um Ano Escolar (10º, 11º ou 12º) antes de guardar.");
      setSaving(false);
      return; // Pára a execução e não envia o pedido
    }

    try {
      // Como estamos a enviar imagens (ficheiros), NÃO podemos usar JSON.stringify.
      // Temos de usar o objeto FormData nativo do navegador (Multipart Form).
      const data = new FormData();
      
      // Adiciona todos os campos de texto ao FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'foto_url') data.append(key, value); // Ignora a URL antiga
      });
      
      // Adiciona o ficheiro físico da imagem, se o utilizador tiver escolhido um novo
      if (selectedFile) data.append("avatar", selectedFile);

      // Faz o pedido PUT para atualizar os dados
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        body: data, // Nota: Não se envia cabeçalho "Content-Type" manual quando se usa FormData (o browser faz isso)
      });

      if (!res.ok) throw new Error("Falha ao salvar");
      
      alert("✅ Perfil atualizado com sucesso!");
      router.refresh(); // Recarrega a página invisivelmente para puxar os dados mais recentes do servidor
    } catch (err) {
      alert("❌ Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  // Ecrã de carregamento inicial
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  // =========================================================================
  // RENDERIZAÇÃO (JSX)
  // =========================================================================
  return (
    <div className={styles.pageContainer}>
      
      {/* CABEÇALHO DESKTOP */}
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
            <Link href="/notification"><Bell className="w-5 h-5" /></Link>
            <Link href="/settings" className="text-emerald-400"><Settings className="w-5 h-5" /></Link>
            
            <Link href="/profile">
              <Avatar className="w-8 h-8 border border-slate-700">
                {/* O AvatarPreview reflete imediatamente a nova foto que o utilizador escolheu */}
                {avatarPreview && <AvatarImage src={avatarPreview} className="object-cover" />}
                <AvatarFallback className="bg-emerald-600 text-white text-xs font-medium">
                  {getInitials(formData.nome)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href="/login"><LogOut className="w-5 h-5 hover:text-red-400 transition-colors" /></Link>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          
          {/* Título e Botão de Guardar */}
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
            
            {/* COLUNA ESQUERDA: Cartão de Identidade (Resumo) */}
            <div className={styles.identityCard}>
              <div className={styles.banner}></div>
              <div className={styles.cardBody}>
                
                {/* Zona da Foto de Perfil */}
                <div className={styles.avatarSection}>
                  <div className={styles.avatarWrapper}>
                    <Avatar className={styles.avatar}>
                      {avatarPreview && <AvatarImage src={avatarPreview} className="object-cover" />}
                      <AvatarFallback className="text-3xl bg-emerald-600 text-white font-medium">
                        {getInitials(formData.nome)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Botão overlay da câmara para escolher ficheiro */}
                    <label htmlFor="avatar-upload" className={styles.cameraLabel}>
                      <Camera className="w-5 h-5" />
                      {/* O input fica escondido, o clique vai para a label htmlFor="avatar-upload" */}
                      <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
                
                <div className={styles.userInfo}>
                  <h2>{formData.nome || "Utilizador"}</h2>
                  <p>{formData.curso || "Estudante"}</p>
                </div>
                
                {/* Contactos em tempo real baseados no formData */}
                <div className={styles.contactList}>
                  <div className={styles.contactItem}><Mail className="w-4 h-4" />{formData.email}</div>
                  <div className={styles.contactItem}><GraduationCap className="w-4 h-4" />{formData.ano_escolar || "Ano não definido"}</div>
                  {formData.morada ? (
                    <div className={styles.contactItem}><MapPin className="w-4 h-4" />{formData.morada}</div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: Separadores de Edição (Tabs) */}
            <div className={styles.tabsContainer}>
              <Tabs defaultValue="pessoal" className="w-full">
                
                <TabsList className={styles.tabsList}>
                  <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                  <TabsTrigger value="academico">Académico</TabsTrigger>
                  <TabsTrigger value="sobre">Sobre</TabsTrigger>
                </TabsList>

                {/* TAB: Pessoal */}
                <TabsContent value="pessoal">
                  <Card className={styles.formCard}>
                    <CardContent className={styles.cardContent + " pt-6"}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="nome">Nome Completo</Label>
                        <Input id="nome" value={formData.nome} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input id="telefone" value={formData.telefone} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="morada">Morada</Label>
                        <Input id="morada" value={formData.morada} onChange={handleChange} />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: Académico */}
                <TabsContent value="academico">
                  <Card className={styles.formCard}>
                    <CardContent className={styles.cardContent + " pt-6"}>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="curso">Curso</Label>
                        <Input id="curso" value={formData.curso} onChange={handleChange} />
                      </div>
                      <div className={styles.inputGroup}>
                        <Label htmlFor="ano_escolar">Ano Escolar</Label>
                        {/* SELECT NATIVO: Protege contra erros de digitação e obriga a escolher 10º, 11º ou 12º */}
                        <select 
                          id="ano_escolar" 
                          value={formData.ano_escolar} 
                          onChange={handleChange} 
                          className="w-full h-10 bg-slate-800 border-slate-700 rounded-md px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Selecione...</option>
                          <option value="10º">10º Ano</option>
                          <option value="11º">11º Ano</option>
                          <option value="12º">12º Ano</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* TAB: Sobre */}
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

      {/* FOOTER MOBILE NAV (Só aparece em ecrãs pequenos via CSS) */}
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