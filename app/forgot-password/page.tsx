"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import styles from "../login/login.module.scss"; // reaproveita os estilos do login

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Ocorreu um erro. Tente novamente.");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao ligar ao servidor. Tente novamente.");
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft />
            Voltar ao login
          </Link>
          <p className={styles.subtitle}>Recuperar a palavra-passe</p>
        </div>

        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Esqueceu-se da senha?</h2>
            <p className={styles.cardDescription}>
              Insira o seu email institucional e enviaremos um link de recuperação
            </p>
          </div>

          {success ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}>
              <CheckCircle size={18} />
              <span>Se o email existir, receberá um link de recuperação em breve.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.loginForm}>
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
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? "A enviar..." : "Enviar link de recuperação"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}