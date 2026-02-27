import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { RowDataPacket, ResultSetHeader } from "mysql2";

// Importamos o render do React Email e o teu novo componente
import { render } from "@react-email/render";
import TemplateBoasVindas from "@/components/emails/TemplateBoasVindas"; 

export async function POST(req: Request) {
  try {
    const { name, email, password, year, course } = await req.json();
 
    if (!name || !email || !password || !year || !course) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: "O nome deve ter pelo menos 2 caracteres" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }

    const finalYear = year === "12" ? "12º" : year;
    const validYears = ["10º", "11º", "12º"];
    
    if (!validYears.includes(finalYear)) {
      return NextResponse.json({ error: "Ano escolar inválido. Escolha 10º, 11º ou 12º." }, { status: 400 });
    }

    const [existingUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM utilizador WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json({ error: "Este email já está registado" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    await pool.query<ResultSetHeader>(
      `INSERT INTO utilizador 
        (nome, email, palavra_passe, ano_escolar, curso, status, verification_token) 
       VALUES (?, ?, ?, ?, ?, 'pendente', ?)`,
      [name.trim(), email, hashedPassword, finalYear, course, verificationToken]
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const reqUrl = new URL(req.url); 
    const verificationLink = `${reqUrl.origin}/api/verify-email?token=${verificationToken}`;

    // --- A MAGIA ACONTECE AQUI COM O @react-email/render ---
    const htmlDoEmail = await render(
      TemplateBoasVindas({ nome: name.trim(), linkVerificacao: verificationLink })
    );

    const mailOptions = {
      from: `"EduConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Bem-vindo(a) ao EduConnect! Confirma o teu registo",
      html: htmlDoEmail, 
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Conta criada com sucesso." });

  } catch (error: any) {
    console.error("Erro no registo:", error);
    
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
       return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 500 });
  }
}