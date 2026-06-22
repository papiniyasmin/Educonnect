import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle, BookOpen, Heart, Star, ArrowRight } from "lucide-react"
import styles from "./page.module.css"

export default function HomePage() {
  return (
    <div className={styles.homepage}>
      {/* Header */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <BookOpen />
              </div>
              <h1 className={styles.logoText}>EduConnect</h1>
            </div>
            <div className={styles.headerActions}>
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Registrar</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Conecte-se com seus colegas de escola</h2>
            <p className={styles.heroDescription}>
              A plataforma que integra alunos novos e veteranos, criando uma comunidade escolar mais unida através de grupos de estudo e conexões sociais.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                  Começar Agora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-3 bg-transparent"
                >
                  Saiba Mais
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <h3 className={styles.featuresTitle}>Funcionalidades da Plataforma</h3>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.emerald}`}>
                <Users />
              </div>
              <h4 className={styles.featureTitle}>Feed Social</h4>
              <p className={styles.featureDescription}>
                Compartilhe experiências, tire dúvidas e conecte-se com outros alunos através de um feed interativo.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.blue}`}>
                <MessageCircle />
              </div>
              <h4 className={styles.featureTitle}>Chat Privado</h4>
              <p className={styles.featureDescription}>
                Converse diretamente com colegas através de mensagens privadas seguras e instantâneas.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.purple}`}>
                <BookOpen />
              </div>
              <h4 className={styles.featureTitle}>Grupos de Estudo</h4>
              <p className={styles.featureDescription}>
                Participe de comunidades organizadas por matérias e anos letivos para estudar em grupo.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.pink}`}>
                <Star />
              </div>
              <h4 className={styles.featureTitle}>Avaliações</h4>
              <p className={styles.featureDescription}>
                Sistema de curtidas e comentários para valorizar as melhores contribuições da comunidade.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.teal}`}>
                <Users />
              </div>
              <h4 className={styles.featureTitle}>Perfis Personalizados</h4>
              <p className={styles.featureDescription}>
                Crie seu perfil com informações acadêmicas e interesses para facilitar conexões.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaCard}>
            <h3 className={styles.ctaTitle}>Pronto para se conectar?</h3>
            <p className={styles.ctaDescription}>
              Junte-se à nossa comunidade escolar e comece a fazer novas amizades e conexões acadêmicas hoje mesmo.
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Criar Conta Gratuita
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerLogo}>
            <div className={styles.footerLogoIcon}>
              <BookOpen />
            </div>
            <span className={styles.footerLogoText}>EduConnect</span>
          </div>
          <p className={styles.footerText}>© 2025 EduConnect. Conectando estudantes, construindo comunidades.</p>
        </div>
      </footer>
    </div>
  )
}
