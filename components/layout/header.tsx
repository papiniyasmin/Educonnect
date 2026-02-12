import Link from "next/link"
import { BookOpen, Search, Settings, LogOut } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import styles from "./header.module.scss" // Importação do SCSS

interface HeaderProps {
  user: {
    name: string;
    avatar: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className={styles.wrapper}>
      <div className={styles.container}>
        {/* LOGO */}
        <Link href="/" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">EduConnect</span>
        </Link>

        {/* MENU DESKTOP */}
        <nav className={styles.navDesktop}>
          <Link href="/dashboard" className={`${styles.navLink} ${styles.active}`}>Feed</Link>
          <Link href="/groups" className={styles.navLink}>Grupos</Link>
          <Link href="/chat" className={styles.navLink}>Chat</Link>
        </nav>

        {/* AÇÕES */}
        <div className={styles.actionsArea}>
          <Link href="/search"><Search className={styles.iconBtn} /></Link>
          <Link href="/settings"><Settings className={styles.iconBtn} /></Link>
          
          {user && (
            <Link href="/profile">
              <Avatar className="w-6 h-6 md:w-8 md:h-8 border border-slate-600">
                <AvatarImage src={user.avatar || ""} />
                <AvatarFallback className="bg-emerald-600 text-white text-xs">
                  {user.name?.[0]}
                </AvatarFallback>
              </Avatar>
            </Link>
          )}
          
          <Link href="/login"><LogOut className={styles.iconBtn} /></Link>
        </div>
      </div>
    </header>
  )
}