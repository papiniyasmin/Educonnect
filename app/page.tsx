import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, MessageCircle, BookOpen, Star, ArrowRight, ShieldCheck } from "lucide-react"
import styles from "./page.module.scss"

export default function HomePage() {
  return (
    <div className={styles.homepage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.container}> {/* AQUI É O SEGREDO: styles.container */}
          <div className={styles.headerContent}>
            <Link href="/" className={styles.logo}>
              <div className={styles.logoIcon}>
                <BookOpen size={24} />
              </div>
              <span className={styles.logoText}>EduConnect</span>
            </Link>
            
            <div className={styles.headerActions}>
              <Link href="/login">
                <Button variant="ghost" className={styles.btnGhost}>
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className={styles.btnPrimary}>
                  Começar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Conecte-se com sua<br />Comunidade Escolar
            </h1>
            <p className={styles.heroDescription}>
              A plataforma que une alunos novos e veteranos. Crie grupos de estudo, 
              troque experiências e fortaleça o espírito acadêmico em um só lugar.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register">
                <Button size="lg" className={`${styles.btnPrimary} w-full sm:w-auto h-12 text-base`}>
                  Criar Conta Gratuita
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline" className={`${styles.btnOutline} w-full sm:w-auto h-12 text-base`}>
                  Como funciona?
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h3 className={styles.featuresTitle}>Tudo o que precisas para evoluir</h3>
          <div className={styles.featuresGrid}>
            
            {/* Card 1 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.emerald}`}>
                <Users />
              </div>
              <h4 className={styles.featureTitle}>Comunidade Ativa</h4>
              <p className={styles.featureDescription}>
                Interage com colegas de todos os anos. Um feed dinâmico para partilhar dúvidas, eventos e conquistas.
              </p>
            </div>

            {/* Card 2 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.blue}`}>
                <MessageCircle />
              </div>
              <h4 className={styles.featureTitle}>Chat em Tempo Real</h4>
              <p className={styles.featureDescription}>
                Comunicação segura e direta. Envia mensagens privadas para colegas ou discute projetos em grupo.
              </p>
            </div>

            {/* Card 3 */}
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.purple}`}>
                <BookOpen />
              </div>
              <h4 className={styles.featureTitle}>Grupos de Estudo</h4>
              <p className={styles.featureDescription}>
                Encontra a tua equipa. Grupos organizados por disciplinas e interesses para potenciar a aprendizagem.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaCard}>
            <h3 className={styles.ctaTitle}>Pronto para transformar a tua vida escolar?</h3>
            <p className={styles.ctaDescription}>
              Junta-te a centenas de estudantes que já estão a usar o EduConnect para melhorar as suas notas e fazer novas amizades.
            </p>
            <Link href="/register">
              <Button size="lg" className={`${styles.btnPrimary} h-12 px-8 text-base`}>
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <div className={styles.footerLogoIcon}>
                <BookOpen size={20} />
              </div>
              <span>EduConnect</span>
            </div>
            <p className={styles.footerText}>
              © 2025 EduConnect. Desenvolvido para conectar o futuro.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}