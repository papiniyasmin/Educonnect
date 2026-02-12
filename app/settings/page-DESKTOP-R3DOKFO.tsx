"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Search, Settings, LogOut, User, Bell, Lock, Palette, Globe } from "lucide-react"

type UserType = {
  id: number
  name: string
  email: string
  year: string
  course: string
  avatar: string
}

type SettingsType = {
  emailNotifications: boolean
  pushNotifications: boolean
  groupInvites: boolean
  privateProfile: boolean
  showEmail: boolean
  darkMode: boolean
  language: string
}

export default function SettingsPage() {
  const router = useRouter()

  const [user, setUser] = useState<UserType | null>(null)
  const [settings, setSettings] = useState<SettingsType>({
    emailNotifications: true,
    pushNotifications: true,
    groupInvites: true,
    privateProfile: false,
    showEmail: false,
    darkMode: true,
    language: "pt",
  })
  const [loading, setLoading] = useState(true)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>("")

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/user")
        if (!res.ok) throw new Error("Não foi possível carregar o usuário")
        const data = await res.json()
        setUser(data)
        setAvatarPreview(data.avatar)
      } catch (err) {
        console.error(err)
        router.push("/login") 
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?userId=${user.id}`)
        if (!res.ok) throw new Error("Não foi possível carregar as configurações")
        const data = await res.json()
        setSettings(data.settings)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [user])

  const handleLogout = () => router.push("/login")
  const updateSetting = (key: string, value: boolean | string) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!user) return
    const name = (document.getElementById("name") as HTMLInputElement).value
    const email = (document.getElementById("email") as HTMLInputElement).value
    const year = (document.getElementById("year") as HTMLInputElement).value
    const course = (document.getElementById("course") as HTMLInputElement).value
    const password = (document.getElementById("password") as HTMLInputElement)?.value

    const formData = new FormData()
    formData.append("userId", user.id.toString())
    formData.append("name", name)
    formData.append("email", email)
    formData.append("year", year)
    formData.append("course", course)
    if (password) formData.append("password", password)
    formData.append("settings", JSON.stringify(settings))
    if (avatarFile) formData.append("avatar", avatarFile)

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        body: formData
      })
      const data = await res.json()
      alert(data.message)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar configurações")
    }
  }

  if (!user || loading)
    return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>

  const dark = settings.darkMode

  return (
    <div className={`min-h-screen ${dark ? "bg-slate-900" : "bg-white"}`}>
      {/* HEADER */}
      <header className={`border-b border-slate-700/50 ${dark ? "bg-slate-900/80 text-white" : "bg-gray-100 text-black"} backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">EduConnect</h1>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="hover:underline">Feed</Link>
              <Link href="/groups" className="hover:underline">Grupos</Link>
              <Link href="/chat" className="text-emerald-400 hover:text-emerald-300">Chat</Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/search"><Search className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/notifications"><Bell className="w-4 h-4" /></Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings"><Settings className="w-4 h-4" /></Link>
            </Button>
            <div className="flex items-center space-x-2">
              <Link href="/profile">
                <Avatar className="w-8 h-8 cursor-pointer">
                  <AvatarImage src={avatarPreview} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        <h1 className={`${dark ? "text-white" : "text-black"} text-3xl font-bold`}>Configurações</h1>
        <p className={`${dark ? "text-slate-400" : "text-gray-600"} mb-6`}>Gerencie suas preferências e configurações da conta</p>

        {/* Informações do Perfil */}
        <Card className={`${dark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-emerald-500" />
              <CardTitle className={dark ? "text-white" : "text-black"}>Informações do Perfil</CardTitle>
            </div>
            <CardDescription className={dark ? "text-slate-400" : "text-gray-600"}>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label className={dark ? "text-slate-300" : "text-gray-700"}>Foto de Perfil</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={avatarPreview} alt={user.name} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    if (!e.target.files) return
                    setAvatarFile(e.target.files[0])
                    setAvatarPreview(URL.createObjectURL(e.target.files[0]))
                  }}
                  className="text-sm text-gray-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className={dark ? "text-slate-300" : "text-gray-700"}>Nome Completo</Label>
              <Input id="name" defaultValue={user.name} className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"}`} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className={dark ? "text-slate-300" : "text-gray-700"}>Email</Label>
              <Input id="email" type="email" defaultValue={user.email} className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"}`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year" className={dark ? "text-slate-300" : "text-gray-700"}>Ano</Label>
                <Input id="year" defaultValue={user.year} className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"}`} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course" className={dark ? "text-slate-300" : "text-gray-700"}>Curso</Label>
                <Input id="course" defaultValue={user.course} className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${dark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-emerald-500" />
              <CardTitle className={dark ? "text-white" : "text-black"}>Notificações</CardTitle>
            </div>
            <CardDescription className={dark ? "text-slate-400" : "text-gray-600"}>Configure como deseja receber notificações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { id: "emailNotifications", label: "Notificações por Email", desc: "Receba atualizações por email" },
              { id: "pushNotifications", label: "Notificações Push", desc: "Receba notificações no navegador" },
              { id: "groupInvites", label: "Convites para Grupos", desc: "Notificações de convites para grupos" },
            ].map(notif => (
              <div key={notif.id}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={notif.id} className={dark ? "text-slate-300" : "text-gray-700"}>{notif.label}</Label>
                    <p className={`${dark ? "text-slate-500" : "text-gray-500"} text-sm`}>{notif.desc}</p>
                  </div>
                  <Switch
                    id={notif.id}
                    checked={settings[notif.id as keyof SettingsType] as boolean}
                    onCheckedChange={checked => updateSetting(notif.id, checked)}
                  />
                </div>
                <Separator className={`${dark ? "bg-slate-700" : "bg-gray-300"}`} />
              </div>
            ))}
          </CardContent>
        </Card>

        
        <Card className={`${dark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <CardTitle className={dark ? "text-white" : "text-black"}>Privacidade e Segurança</CardTitle>
            </div>
            <CardDescription className={dark ? "text-slate-400" : "text-gray-600"}>Controle quem pode ver suas informações</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              { id: "privateProfile", label: "Perfil Privado", desc: "Apenas amigos podem ver seu perfil" },
              { id: "showEmail", label: "Mostrar Email", desc: "Outros podem ver seu email" },
            ].map(priv => (
              <div key={priv.id}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={priv.id} className={dark ? "text-slate-300" : "text-gray-700"}>{priv.label}</Label>
                    <p className={`${dark ? "text-slate-500" : "text-gray-500"} text-sm`}>{priv.desc}</p>
                  </div>
                  <Switch
                    id={priv.id}
                    checked={settings[priv.id as keyof SettingsType] as boolean}
                    onCheckedChange={checked => updateSetting(priv.id, checked)}
                  />
                </div>
                <Separator className={`${dark ? "bg-slate-700" : "bg-gray-300"}`} />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="password" className={dark ? "text-slate-300" : "text-gray-700"}>Alterar Senha</Label>
              <Input id="password" type="password" placeholder="Nova senha" className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"}`} />
            </div>
          </CardContent>
        </Card>

        
        <Card className={`${dark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-emerald-500" />
              <CardTitle className={dark ? "text-white" : "text-black"}>Aparência</CardTitle>
            </div>
            <CardDescription className={dark ? "text-slate-400" : "text-gray-600"}>Personalize a interface da aplicação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="darkMode" className={dark ? "text-slate-300" : "text-gray-700"}>Modo Escuro</Label>
                <p className={`${dark ? "text-slate-500" : "text-gray-500"} text-sm`}>Usar tema escuro</p>
              </div>
              <Switch id="darkMode" checked={settings.darkMode} onCheckedChange={checked => updateSetting("darkMode", checked)} />
            </div>
          </CardContent>
        </Card>

    
        <Card className={`${dark ? "bg-slate-800/50 border-slate-700" : "bg-gray-100 border-gray-300"}`}>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-emerald-500" />
              <CardTitle className={dark ? "text-white" : "text-black"}>Idioma e Região</CardTitle>
            </div>
            <CardDescription className={dark ? "text-slate-400" : "text-gray-600"}>Configure seu idioma preferido</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="language" className={dark ? "text-slate-300" : "text-gray-700"}>Idioma</Label>
              <select id="language" value={settings.language} onChange={e => updateSetting("language", e.target.value)} className={`${dark ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-300 text-black"} w-full rounded-md px-3 py-2`}>
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
          Salvar Alterações
        </Button>
      </main>

      <footer className={`${dark ? "bg-slate-900/80 border-t border-slate-700/50 text-slate-400" : "bg-gray-100 border-t border-gray-300 text-gray-600"} py-4 text-center mt-12`}>
        <div className="container mx-auto px-4">
          <p>&copy; 2023 EduConnect. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
