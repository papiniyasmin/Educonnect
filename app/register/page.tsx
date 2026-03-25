"use client"; 
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Componente otimizado de imagens do Next.js
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Lock, User, ArrowLeft, AlertCircle, MailCheck } from "lucide-react"; 
import styles from "./registerPage.module.scss";

export default function RegisterPage() {
  const router = useRouter(); // Hook para navegação programática (ex: enviar o utilizador para o login)

  // =========================================================================
  // ESTADOS DO COMPONENTE
  // =========================================================================
  
  // Guarda todos os dados introduzidos pelo utilizador no formulário
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    year: "",
    course: "",
  });

  const [isLoading, setIsLoading] = useState(false); // Controla o estado de "A carregar" do botão de submissão
  const [error, setError] = useState<string | null>(null); // Guarda mensagens de erro para mostrar ao utilizador
  const [isSuccess, setIsSuccess] = useState(false); // Se true, esconde o formulário e mostra o ecrã de sucesso

  // =========================================================================
  // 1. FUNÇÃO DE VALIDAÇÃO LOCAL (Antes de enviar para a API)
  // =========================================================================
  const validateForm = () => {
    // Regex: Apenas letras (incluindo acentos) e espaços, entre 2 e 255 caracteres
    const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,255}$/;
    if (!nameRegex.test(formData.name.trim())) {
      return "O nome deve ter entre 2 e 255 letras (sem números ou símbolos).";
    }

    // Regex: Formato básico de email (texto@texto.texto)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.email.length > 255) {
      return "Insira um email válido (máximo 255 caracteres).";
    }

    // Validação de segurança para o tamanho da string
    if (formData.course.length > 150) {
      return "O nome do curso é demasiado longo (máx 150 caracteres).";
    }

    // Regex: Pelo menos 1 minúscula, 1 maiúscula, 1 número e tamanho entre 8 e 255
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,255}$/;
    if (!passwordRegex.test(formData.password)) {
      return "A senha deve ter no mínimo 8 caracteres, incluindo 1 maiúscula, 1 minúscula e 1 número.";
    }

    // Confirma se o utilizador não se enganou a escrever a password
    if (formData.password !== formData.confirmPassword) {
      return "As senhas não coincidem!";
    }

    // Verifica se os campos de seleção foram preenchidos
    if (!formData.year || !formData.course) {
      return "Por favor, selecione seu ano letivo e curso.";
    }

    return null; // Retorna null se não houver erros
  };

  // =========================================================================
  // EFFECTS
  // =========================================================================
  useEffect(() => {
    // Quando a página carrega, limpa todos os cookies existentes.
    // Isto é útil para garantir que, se um utilizador já estava logado mas tentou aceder 
    // à página de registo, a sessão antiga seja terminada (Clean Slate).
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }, []);

  // =========================================================================
  // HANDLERS (Ações do Utilizador)
  // =========================================================================
  
  // Função genérica para atualizar qualquer campo do formulário
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Se o utilizador começar a escrever, limpa os erros no ecrã para não o incomodar
    if (error) setError(null);
  };

  // Função disparada ao clicar em "Criar Conta"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de recarregar (comportamento padrão dos formulários HTML)
    setIsLoading(true); // Desativa o botão e mostra "Criando conta..."
    setError(null);

    // 1. Executa a validação do front-end
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setIsLoading(false);
      return; // Interrompe a submissão se houver erros locais
    }

    // 2. Faz o pedido à API para criar a conta
    try {
      const resRegister = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(), // Limpa espaços extra no início/fim
          email: formData.email,
          password: formData.password,
          year: formData.year,
          course: formData.course,
        }),
      });

      const dataRegister = await resRegister.json();

      // Se a API retornar erro (ex: Email já existe)
      if (!resRegister.ok) {
        throw new Error(dataRegister.error || "Erro ao criar conta.");
      }

      // Se sucesso, muda o estado para true (vai esconder o formulário e mostrar a mensagem de sucesso)
      setIsSuccess(true);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false); // Reativa o botão
    }
  };

  // =========================================================================
  // RENDERIZAÇÃO (JSX)
  // =========================================================================
  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        
        {/* CABEÇALHO */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft /> Voltar ao início
          </Link>

          <div className={styles.logoWrapper}>
            <Image 
              src="/logo.png" 
              alt="Logo EduConnect" 
              width={150} 
              height={45} 
              className="object-contain" 
            />
          </div>
          <p className={styles.subtitle}>Crie sua conta de estudante</p>
        </div>

        {/* CARTÃO DE REGISTO */}
        <Card className={styles.registerCard}>
          
          {/* RENDERIZAÇÃO CONDICIONAL: Sucesso vs Formulário */}
          {isSuccess ? (
            
            // --- ECRÃ DE SUCESSO ---
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
            
            // --- FORMULÁRIO DE REGISTO ---
            <>
              <CardHeader>
                <CardTitle className={styles.cardTitle}>Registrar-se</CardTitle>
                <CardDescription className={styles.cardDesc}>
                  Preencha os dados abaixo para começar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className={styles.formContainer}>
                  
                  {/* CAIXA DE ERRO (Só aparece se o state `error` tiver texto) */}
                  {error && (
                    <div className={styles.errorBox}>
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* CAMPO: Nome Completo */}
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

                  {/* CAMPO: Email Institucional */}
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

                  {/* CAMPOS: Ano e Curso (Lado a lado usando Grid) */}
                  <div className={styles.gridRow}>
                    
                    {/* Ano Letivo */}
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

                    {/* Curso */}
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

                  {/* CAMPO: Password */}
                  <div className={styles.inputGroup}>
                    <Label htmlFor="password">Senha</Label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.inputIcon} />
                      <Input
                        id="password"
                        type="password" // Esconde o texto digitado (bolinhas)
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={styles.inputField}
                        placeholder="Mín. 8 caracteres (Maiúscula, minúscula, número)"
                        required
                      />
                    </div>
                  </div>

                  {/* CAMPO: Confirmar Password */}
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

                  {/* BOTÃO DE SUBMISSÃO */}
                  <Button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={isLoading} // Impede duplo clique enquanto processa
                  >
                    {/* Texto dinâmico: Muda enquanto está a carregar */}
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>

                {/* RODAPÉ: Link para o Login */}
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