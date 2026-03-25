"use client"; 

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image"; // <-- Adicionado import do Image
import { Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react"; // <-- Removido o BookOpen daqui
import styles from "./login.module.scss";

export default function LoginPage() {
  // =========================================================================
  // ESTADOS DO COMPONENTE
  // =========================================================================
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [isLoading, setIsLoading] = useState(false); 
  const [error, setError] = useState<string | null>(null); 

  // =========================================================================
  // EFFECTS (Executado ao carregar a página)
  // =========================================================================
  useEffect(() => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "") 
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }, []); 

  // =========================================================================
  // HANDLERS (Ações do utilizador)
  // =========================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true); 
    setError(null); 

    // 1. VALIDAÇÃO LOCAL (Front-end)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      setError("Por favor, insira um email válido.");
      setIsLoading(false);
      return; 
    }

    if (!password) {
      setError("Por favor, insira a sua senha.");
      setIsLoading(false);
      return;
    }

    // 2. COMUNICAÇÃO COM A API (Back-end)
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }), 
      });

      const data = await res.json();

      // 3. SUCESSO OU ERRO
      if (data.success) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Email ou senha incorretos.");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao ligar ao servidor. Tente novamente.");
    }

    setIsLoading(false); 
  };

  // =========================================================================
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // =========================================================================
  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        
        {/* --- CABEÇALHO DA PÁGINA (Logotipo e botão de voltar) --- */}
        <div className={styles.loginHeader}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft />
            Voltar ao início
          </Link>
          
          {/* --- LOGO ATUALIZADO AQUI --- */}
          <div className={styles.logoContainer}>
            <Image 
              src="/logo.png" 
              alt="Logo EduConnect" 
              width={160} 
              height={40} 
              priority 
              className={styles.logoImage} 
            />
          </div>
          {/* ----------------------------- */}

          <p className={styles.subtitle}>Entre na sua conta</p>
        </div>

        {/* --- CARTÃO DE LOGIN --- */}
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Fazer Login</h2>
            <p className={styles.cardDescription}>
              Use seu email institucional para acessar a plataforma
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            
            {/* Exibição de Erros */}
            {error && (
              <div style={{ 
                backgroundColor: "#fee2e2", 
                color: "#ef4444", 
                padding: "10px", 
                borderRadius: "6px", 
                display: "flex", 
                alignItems: "center", 
                gap: "8px",
                fontSize: "0.875rem",
                marginBottom: "1rem"
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Input do Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                Email Institucional
              </label>
              <div className={styles.inputContainer}>
                <Mail />
                <input
                  id="email"
                  type="email"
                  placeholder="seu.email@escola.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null); 
                  }}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>

            {/* Input da Palavra-passe */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                Senha
              </label>
              <div className={styles.inputContainer}>
                <Lock />
                <input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null); 
                  }}
                  className={styles.formInput}
                  required
                />
              </div>
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading} 
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>

            {/* Link para a página de registo */}
            <div className={styles.registerLink}>
              <p className={styles.registerText}>
                Não tem uma conta?{" "}
                <Link href="/register">Registre-se aqui</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}