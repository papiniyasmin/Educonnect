"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Mail, Lock, User, ArrowLeft, AlertCircle } from "lucide-react";
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

  // ---------------------------------------------------------
  // 1. VALIDAÇÕES (Regras do educonnect1.sql)
  // ---------------------------------------------------------
  const validateForm = () => {
    // Nome: Mínimo 2 caracteres, apenas letras e espaços
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,255}$/;
    if (!nameRegex.test(formData.name.trim())) {
      return "O nome deve ter entre 2 e 255 letras (sem números ou símbolos).";
    }

    // Email: Formato padrão e limite de caracteres
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.email.length > 255) {
      return "Insira um email válido (máximo 255 caracteres).";
    }

    // Curso: Limite de caracteres
    if (formData.course.length > 150) {
      return "O nome do curso é demasiado longo (máx 150 caracteres).";
    }

    // Senha: Mínimo 8 caracteres, 1 Maiúscula, 1 Minúscula, 1 Número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,255}$/;
    if (!passwordRegex.test(formData.password)) {
      return "A senha deve ter no mínimo 8 caracteres, incluindo 1 maiúscula, 1 minúscula e 1 número.";
    }

    // Confirmar Senha
    if (formData.password !== formData.confirmPassword) {
      return "As senhas não coincidem!";
    }

    // Campos de Seleção
    if (!formData.year || !formData.course) {
      return "Por favor, selecione seu ano letivo e curso.";
    }

    return null; // Sem erros
  };

  // Limpeza de cookies ao carregar a página
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

    // Executar validação local antes de chamar a API
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return;
    }

    try {
      // ---------------------------------------------
      // PASSO 1: CRIAR A CONTA
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

      // ---------------------------------------------
      // PASSO 2: AUTO-LOGIN
      // ---------------------------------------------
      const resLogin = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!resLogin.ok) {
        alert("Conta criada! Por favor, faça login manualmente.");
        router.push("/login");
        return;
      }

      // ---------------------------------------------
      // PASSO 3: REDIRECIONAR
      // ---------------------------------------------
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão com o servidor.");
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
                      {/* CORREÇÃO IMPORTANTE: value="12" (sem o º) para combinar com a BD */}
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
        </Card>
      </div>
    </div>
  );
}