"use client"; 

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import styles from "./login.module.scss";

export default function LoginPage() {
  // =========================================================================
  // ESTADOS DO COMPONENTE
  // =========================================================================
  const [email, setEmail] = useState(""); // Guarda o email introduzido
  const [password, setPassword] = useState(""); // Guarda a palavra-passe introduzida
  const [isLoading, setIsLoading] = useState(false); // Controla o estado de carregamento do botão (evita cliques duplos)
  const [error, setError] = useState<string | null>(null); // Guarda e exibe mensagens de erro (ex: credenciais inválidas)

  // =========================================================================
  // EFFECTS (Executado ao carregar a página)
  // =========================================================================
  // Limpar cookies ao carregar a página (Evita conflitos de sessões antigas)
  // Se o utilizador chegou à página de login, assumimos que deve ter a sessão limpa.
  useEffect(() => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "") // Remove espaços em branco no início
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); // Define a data de expiração para o passado, apagando o cookie
    });
  }, []); // O array vazio [] garante que isto só corre uma vez quando a página abre.

  // =========================================================================
  // HANDLERS (Ações do utilizador)
  // =========================================================================
  
  // Função executada quando o formulário é submetido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede que a página faça refresh (comportamento padrão dos formulários HTML)
    setIsLoading(true); // Ativa o estado de "A carregar..."
    setError(null); // Limpa qualquer erro anterior

    // 1. VALIDAÇÃO LOCAL (Front-end)
    // Regex (Expressão Regular) simples para verificar se o formato do email é válido (ex: algo@algo.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      setError("Por favor, insira um email válido.");
      setIsLoading(false);
      return; // Interrompe a execução aqui, não chega a enviar para a API
    }

    if (!password) {
      setError("Por favor, insira a sua senha.");
      setIsLoading(false);
      return;
    }

    // 2. COMUNICAÇÃO COM A API (Back-end)
    try {
      // Faz um pedido POST à rota de login
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }), // Envia os dados no corpo do pedido
      });

      const data = await res.json();

      // 3. SUCESSO OU ERRO
      if (data.success) {
        // Se a API responder com sucesso (geralmente enviou um cookie de sessão na resposta),
        // Redireciona o utilizador para o Dashboard.
        // O uso de window.location.href (em vez do router.push do Next.js) força um recarregamento total da página, 
        // o que é útil para garantir que todos os layouts e middlewares reconhecem o novo cookie de sessão.
        window.location.href = "/dashboard";
      } else {
        // Se a API recusar o login (pass errada, conta inexistente), mostra o erro
        setError(data.error || "Email ou senha incorretos.");
      }
    } catch (err) {
      // Se houver um erro de rede (ex: servidor em baixo, falha de internet)
      console.error("Erro:", err);
      setError("Erro ao ligar ao servidor. Tente novamente.");
    }

    setIsLoading(false); // Desativa o estado de carregamento independentemente do resultado
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
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <BookOpen />
            </div>
            <h1 className={styles.logoText}>EduConnect</h1>
          </div>
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
            
            {/* Exibição de Erros: Só renderiza esta div se a variável 'error' não for nula */}
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
                    setError(null); // UX: Limpa o alerta de erro assim que o utilizador começa a corrigir o campo
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
                    setError(null); // UX: Limpa o alerta de erro ao digitar
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
              disabled={isLoading} // Bloqueia o botão enquanto estiver a fazer o pedido à API
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