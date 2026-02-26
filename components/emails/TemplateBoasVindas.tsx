import React from 'react';

// Definimos os dados que o email vai receber
interface EmailProps {
  nome: string;
  linkVerificacao: string;
}

export default function TemplateBoasVindas({ nome, linkVerificacao }: EmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f4f5', padding: '40px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '8px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* --- A TUA LOGO COM O DOMÍNIO DO VERCEL --- */}
        <img 
          src="https://educonnect-eopy.vercel.app/logo.png" 
          alt="EduConnect Logo" 
          width="98" 
          height="98" 
          style={{ 
            borderRadius: '50%', 
            objectFit: 'cover', 
            backgroundColor: '#1a2332', /* Cor de fundo escura caso a logo seja transparente */
            marginBottom: '20px'
          }} 
        />

        <h1 style={{ color: '#1e293b', margin: '0 0 15px 0' }}>Bem-vindo(a) ao EduConnect, {nome}!</h1>
        
        <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
          Estamos muito felizes por te ter connosco. Para começares a explorar os grupos e partilhar conhecimento, só precisas de confirmar o teu email clicando no botão abaixo:
        </p>

        {/* --- O TEU BOTÃO COM A COR DO SITE --- */}
        <a 
          href={linkVerificacao} 
          style={{ 
            display: 'inline-block', 
            backgroundColor: '#2563eb', /* <-- MUDA ESTA COR para o HEX exato do teu site (Azul ou Verde) */
            color: '#ffffff', 
            padding: '14px 28px', 
            textDecoration: 'none', 
            borderRadius: '6px', 
            marginTop: '25px', 
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Confirmar o meu Email
        </a>

        <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '30px 0' }} />

        <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0' }}>
          Se não criaste uma conta no EduConnect, podes ignorar este email com segurança.
        </p>
      </div>
    </div>
  );
}