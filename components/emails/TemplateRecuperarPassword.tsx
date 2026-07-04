import * as React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
} from '@react-email/components';

interface EmailProps {
  nome: string;
  linkRecuperacao: string;
}

export default function TemplateRecuperarPassword({ nome, linkRecuperacao }: EmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Recupera o acesso à tua conta EduConnect.</Preview>
      
      <Body style={styles.main}>
        <Container style={styles.container}>
          
          <Section style={styles.header}>
            <Img
              src="https://educonnect-eopy.vercel.app/logo.png"
              width="180"
              alt="EduConnect"
              style={styles.logo}
            />
          </Section>

          <Section style={styles.content}>
            <Text style={styles.heading}>Olá, {nome}! 🔑</Text>
            
            <Text style={styles.paragraph}>
              Recebemos um pedido para redefinir a palavra-passe da tua conta <strong>EduConnect</strong>.
            </Text>
            
            <Text style={styles.paragraph}>
              Clica no botão abaixo para definires uma nova palavra-passe. Este link é válido durante <strong>1 hora</strong>.
            </Text>

            <Section style={styles.btnContainer}>
              <Button style={styles.button} href={linkRecuperacao}>
                Redefinir Palavra-passe
              </Button>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Se não pediste esta alteração, podes ignorar e apagar este email com segurança. A tua palavra-passe atual continua ativa.
            </Text>
            <Text style={styles.footerText}>
              © 2024 EduConnect. Todos os direitos reservados.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  main: {
    backgroundColor: '#f1f5f9',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    padding: '40px 0',
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#0f172a',
    padding: '30px 20px',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
  },
  content: {
    padding: '40px 40px 20px 40px',
  },
  heading: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    margin: '0 0 20px',
  },
  paragraph: {
    fontSize: '16px',
    lineHeight: '26px',
    color: '#475569',
    margin: '0 0 20px',
  },
  btnContainer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    padding: '16px 32px',
    display: 'inline-block',
  },
  hr: {
    borderColor: '#e2e8f0',
    margin: '0 40px 20px 40px',
  },
  footer: {
    padding: '0 40px 30px 40px',
    textAlign: 'center' as const,
  },
  footerText: {
    color: '#94a3b8',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0 0 8px',
  },
};