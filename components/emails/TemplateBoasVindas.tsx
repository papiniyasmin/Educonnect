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
  linkVerificacao: string;
}

export default function TemplateBoasVindas({ nome, linkVerificacao }: EmailProps) {
  return (
    <Html>
      <Head />
      {/* O Preview é aquele texto pequeno que aparece no Gmail antes de abrir o email */}
      <Preview>Bem-vindo(a) ao EduConnect! Confirma a tua conta para começar.</Preview>
      
      <Body style={styles.main}>
        <Container style={styles.container}>
          
          {/* Cabeçalho com o Logotipo */}
          <Section style={styles.header}>
            <Img
              src="https://educonnect-eopy.vercel.app/logo.png"
              width="180"
              alt="EduConnect"
              style={styles.logo}
            />
          </Section>

          {/* Corpo Principal */}
          <Section style={styles.content}>
            <Text style={styles.heading}>Olá, {nome}! 👋</Text>
            
            <Text style={styles.paragraph}>
              Bem-vindo(a) ao <strong>EduConnect</strong>! Estamos muito felizes por te ter a bordo.
            </Text>
            
            <Text style={styles.paragraph}>
              Para começares a explorar a plataforma, aceder aos teus cursos e te conectares com outros estudantes, precisamos apenas de verificar o teu email.
            </Text>

            {/* Botão de Ação */}
            <Section style={styles.btnContainer}>
              <Button style={styles.button} href={linkVerificacao}>
                Confirmar o meu Email
              </Button>
            </Section>
          </Section>

          <Hr style={styles.hr} />

          {/* Rodapé */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Se não te registaste no EduConnect, podes ignorar e apagar este email com segurança.
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

// Estilos organizados (CSS in JS)
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