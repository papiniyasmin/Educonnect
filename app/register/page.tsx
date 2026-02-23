"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Mail, Lock, User, ArrowLeft, AlertCircle, MailCheck } from "lucide-react";
import styles from "./registerPage.module.scss";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    year: "",
    course: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false); // NOVO ESTADO: Controla a mensagem de sucesso

  // ---------------------------------------------------------
  // 1. VALIDAÇÕES
  // ---------------------------------------------------------
  const validateForm = () => {
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,255}$/;
    if (!nameRegex.test(formData.name.trim())) {
      return "O nome deve ter entre 2 e 255 letras (sem números ou símbolos).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.email.length > 255) {
      return "Insira um email válido (máximo 255 caracteres).";
    }

    if (formData.course.length > 150) {
      return "O nome do curso é demasiado longo (máx 150 caracteres).";
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,255}$/;
    if (!passwordRegex.test(formData.password)) {
      return "A senha deve ter no mínimo 8 caracteres, incluindo 1 maiúscula, 1 minúscula e 1 número.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "As senhas não coincidem!";
    }

    if (!formData.year || !formData.course) {
      return "Por favor, selecione seu ano letivo e curso.";
    }

    return null;
  };

  useEffect(() => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // ---------------------------------------------
      // PASSO 1: CRIAR A CONTA (O backend deverá enviar o email aqui)
      // ---------------------------------------------
      const resRegister = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email,
          password: formData.password,
          year: formData.year,
          course: formData.course,
        }),
      });

      const dataRegister = await resRegister.json();

      if (!resRegister.ok) {
        throw new Error(dataRegister.error || "Erro ao criar conta.");
      }

      // PASSO 2: Mostrar mensagem de sucesso em vez de fazer auto-login
      setIsSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft /> Voltar ao início
          </Link>

          <div className={styles.logoWrapper}>
            <div className={styles.logoIcon}>
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <h1>EduConnect</h1>
          </div>
          <p className={styles.subtitle}>Crie sua conta de estudante</p>
        </div>

        <Card className={styles.registerCard}>
          {/* Se registrou com sucesso, mostra esta mensagem */}
          {isSuccess ? (
            <CardContent className="flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <MailCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifica o teu Email!</h2>
              <p className="text-slate-600 mb-6">
                Enviámos um link de confirmação para <strong>{formData.email}</strong>. 
                Por favor, clica no link para ativares a tua conta antes de fazeres login.
              </p>
              <Button onClick={() => router.push("/login")} className={styles.submitBtn}>
                Ir para o Login
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader>
                <CardTitle className={styles.cardTitle}>Registrar-se</CardTitle>
                <CardDescription className={styles.cardDesc}>
                  Preencha os dados abaixo para começar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className={styles.formContainer}>
                  
                  {error && (
                    <div className={styles.errorBox}>
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Nome */}
                  <div className={styles.inputGroup}>
                    <Label htmlFor="name">Nome Completo</Label>
                    <div className={styles.inputWrapper}>
                      <User className={styles.inputIcon} />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={styles.inputField}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className={styles.inputGroup}>
                    <Label htmlFor="email">Email Institucional</Label>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.inputIcon} />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={styles.inputField}
                        placeholder="seu.email@escola.edu"
                        required
                      />
                    </div>
                  </div>

                  {/* Ano e Curso (Grid) */}
                  <div className={styles.gridRow}>
                    <div className={styles.inputGroup}>
                      <Label htmlFor="year">Ano Letivo</Label>
                      <Select onValueChange={(value) => handleInputChange("year", value)}>
                        <SelectTrigger className={styles.selectTrigger}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={styles.selectContent}>
                          <SelectItem value="10º">10º Ano</SelectItem>
                          <SelectItem value="11º">11º Ano</SelectItem>
                          <SelectItem value="12">12º Ano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className={styles.inputGroup}>
                      <Label htmlFor="course">Curso</Label>
                      <Select onValueChange={(value) => handleInputChange("course", value)}>
                        <SelectTrigger className={styles.selectTrigger}>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className={styles.selectContent}>
                          <SelectItem value="Ciências">Ciências</SelectItem>
                          <SelectItem value="Humanidades">Humanidades</SelectItem>
                          <SelectItem value="Artes">Artes</SelectItem>
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Senha */}
                  <div className={styles.inputGroup}>
                    <Label htmlFor="password">Senha</Label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.inputIcon} />
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={styles.inputField}
                        placeholder="Mín. 8 caracteres (Maiúscula, minúscula, número)"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div className={styles.inputGroup}>
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.inputIcon} />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={styles.inputField}
                        placeholder="Confirme sua senha"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>

                <div className={styles.footerText}>
                  <p>
                    Já tem uma conta?{" "}
                    <Link href="/login">
                      Faça login aqui
                    </Link>
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}