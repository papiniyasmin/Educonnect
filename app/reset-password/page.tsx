"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import styles from "../login/login.module.scss";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Erro ao redefinir a palavra-passe.");
      }
    } catch (err) {
      console.error("Erro:", err);
      setError("Erro ao ligar ao servidor.");
    }

    setIsLoading(false);
  };

  if (!token) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginContainer}>
          <div className={styles.loginCard}>
            <p>Link inválido. Solicite um novo pedido de recuperação.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <p className={styles.subtitle}>Definir nova palavra-passe</p>
        </div>

        <div className={styles.loginCard}>
          {success ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#16a34a" }}>
              <CheckCircle size={18} />
              <span>Palavra-passe redefinida! A redirecionar para o login...</span>
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
                <label htmlFor="password" className={styles.formLabel}>Nova Senha</label>
                <div className={styles.inputContainer}>
                  <Lock />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>Confirmar Senha</label>
                <div className={styles.inputContainer}>
                  <Lock />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? "A redefinir..." : "Redefinir Palavra-passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>A carregar...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}