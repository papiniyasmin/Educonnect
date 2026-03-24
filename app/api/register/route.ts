import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

// Importamos o render do React Email e o teu componente visual do email
import { render } from "@react-email/render";
import TemplateBoasVindas from "@/components/emails/TemplateBoasVindas"; 

// =========================================================================
// POST: Criar uma nova conta de utilizador (Registo)
// =========================================================================
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. RECEBER OS DADOS DO FRONTEND
    // ---------------------------------------------------------
    const { name, email, password, year, course } = await req.json();
 
    // ---------------------------------------------------------
    // 2. VALIDAÇÕES DE SEGURANÇA E FORMATO
    // ---------------------------------------------------------
    // Verifica se não falta nenhum campo essencial
    if (!name || !email || !password || !year || !course) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    // O nome tem de ter pelo menos 2 letras
    if (name.trim().length < 2) {
      return NextResponse.json({ error: "O nome deve ter pelo menos 2 caracteres" }, { status: 400 });
    }

    // Usa uma Expressão Regular (Regex) para garantir que o email tem um formato válido (ex: teste@teste.com)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // Obriga a uma palavra-passe com pelo menos 8 caracteres
    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    // Normaliza o ano escolar (garante que tem o símbolo "º") e valida se é permitido
    const finalYear = year === "12" ? "12º" : year;
    const validYears = ["10º", "11º", "12º"];
    if (!validYears.includes(finalYear)) {
      return NextResponse.json({ error: "Ano escolar inválido. Escolha 10º, 11º ou 12º." }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 3. VERIFICAR SE O EMAIL JÁ EXISTE NA BD
    // ---------------------------------------------------------
    // CORREÇÃO TYPESCRIPT: Removido o <RowDataPacket[]> e adicionado o : any
    const [existingUsers]: any = await pool.query(
      "SELECT id FROM utilizador WHERE email = ?",
      [email]
    );

    // Se a base de dados devolver algum resultado, o email já está em uso!
    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Este email já está registado" }, { status: 409 });
    }

    // ---------------------------------------------------------
    // 4. SEGURANÇA (ENCRIPTAR PASSWORD E GERAR TOKEN)
    // ---------------------------------------------------------
    // Nunca guardamos passwords em texto limpo! O bcrypt vai "baralhar" a password.
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Gera um código aleatório (Token) super seguro para enviar no link do email
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // ---------------------------------------------------------
    // 5. GUARDAR O NOVO UTILIZADOR NA BASE DE DADOS
    // ---------------------------------------------------------
    // CORREÇÃO TYPESCRIPT: Removido o <ResultSetHeader>
    await pool.query(
      `INSERT INTO utilizador 
        (nome, email, palavra_passe, ano_escolar, curso, status, verification_token) 
       VALUES (?, ?, ?, ?, ?, 'pendente', ?)`, // Fica 'pendente' até ele clicar no email!
      [name.trim(), email, hashedPassword, finalYear, course, verificationToken]
    );

    // ---------------------------------------------------------
    // 6. CONFIGURAR O ENVIO DE EMAIL (NODEMAILER)
    // ---------------------------------------------------------
    // Liga-se ao teu Gmail usando as credenciais do ficheiro .env
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Cria o link dinâmico que o utilizador vai clicar. 
    // reqUrl.origin pega no teu domínio atual (ex: http://localhost:3000 ou https://teusite.com)
    const reqUrl = new URL(req.url); 
    const verificationLink = `${reqUrl.origin}/api/verify-email?token=${verificationToken}`;

    // --- A MAGIA ACONTECE AQUI COM O @react-email/render ---
    // Transforma o teu componente React de Email (TemplateBoasVindas) em HTML puro para os clientes de email conseguirem ler.
    const htmlDoEmail = await render(
      TemplateBoasVindas({ nome: name.trim(), linkVerificacao: verificationLink })
    );

    // Define quem envia, quem recebe, o assunto e o corpo (HTML) do email
    const mailOptions = {
      from: `"EduConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Bem-vindo(a) ao EduConnect! Confirma o teu registo",
      html: htmlDoEmail, 
    };

    // Envia efetivamente o email
    await transporter.sendMail(mailOptions);

    // ---------------------------------------------------------
    // 7. RESPOSTA DE SUCESSO
    // ---------------------------------------------------------
    return NextResponse.json({ success: true, message: "Conta criada com sucesso." });

  } catch (error: any) {
    console.error("Erro no registo:", error);
    
    // Tratamento específico de erro do MySQL caso um campo exceda o limite de caracteres
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
       return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}