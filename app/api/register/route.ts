import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { RowDataPacket, ResultSetHeader } from "mysql2";

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

    // TRUQUE: Se o frontend enviar apenas "12", transformamos em "12º" para a base de dados aceitar
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
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // GERAR TOKEN ÚNICO
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // INSERIR NA BASE DE DADOS (usando o finalYear com o "º")
    await pool.query<ResultSetHeader>(
      `INSERT INTO utilizador 
        (nome, email, palavra_passe, ano_escolar, curso, status, verification_token) 
       VALUES (?, ?, ?, ?, ?, 'pendente', ?)`,
      [name.trim(), email, hashedPassword, finalYear, course, verificationToken]
    );

    // CONFIGURAR O NODEMAILER E ENVIAR EMAIL
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Apanha o domínio automaticamente (localhost ou vercel)
    const reqUrl = new URL(req.url); 
    const verificationLink = `${reqUrl.origin}/api/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"EduConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Confirma o teu registo no EduConnect",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2>Olá, ${name.trim()}!</h2>
          <p>Bem-vindo ao EduConnect! Para começares a usar a tua conta, precisamos que confirmes o teu email.</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Confirmar o meu Email
          </a>
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Se não te registaste no EduConnect, podes ignorar este email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Conta criada com sucesso. Verifica o teu email!" });

  } catch (error: any) {
    console.error("Erro no registo:", error);
    
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
       return NextResponse.json({ error: "Dados inválidos (possível erro no Ano Escolar ou Curso)." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}