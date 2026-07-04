import { NextResponse } from "next/server";
import pool from "@/db";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import TemplateRecuperarPassword from "@/components/emails/TemplateRecuperarPassword";

// =========================================================================
// POST: Solicitar recuperação de palavra-passe
// =========================================================================
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. RECEBER O EMAIL ENVIADO PELO UTILIZADOR
    // ---------------------------------------------------------
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email não fornecido." }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. PROCURAR O UTILIZADOR NA BASE DE DADOS
    // ---------------------------------------------------------
    const [users]: any = await pool.query(
      "SELECT id, nome FROM utilizador WHERE email = ?",
      [email]
    );

    // Se o email não existir, avisamos o utilizador em vez de fingir sucesso
    if (users.length === 0) {
      return NextResponse.json(
        { error: "Não existe nenhuma conta associada a este email." },
        { status: 404 }
      );
    }
    const userId = users[0].id;
    const userName = users[0].nome;

    // ---------------------------------------------------------
    // 3. GERAR TOKEN TEMPORÁRIO COM VALIDADE LIMITADA (1 HORA)
    // ---------------------------------------------------------
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

    await pool.query(
      "UPDATE utilizador SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [resetToken, expires, userId]
    );

    // ---------------------------------------------------------
    // 4. CONFIGURAR O ENVIO DE EMAIL (NODEMAILER)
    // ---------------------------------------------------------
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const reqUrl = new URL(req.url);
    const resetLink = `${reqUrl.origin}/reset-password?token=${resetToken}`;

    const htmlDoEmail = await render(
      TemplateRecuperarPassword({ nome: userName, linkRecuperacao: resetLink })
    );

    const mailOptions = {
      from: `"EduConnect" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperação de Palavra-passe - EduConnect",
      html: htmlDoEmail,
    };

    // ---------------------------------------------------------
    // 5. ENVIAR O EMAIL E SÓ RESPONDER SUCESSO SE FOR ENVIADO
    // ---------------------------------------------------------
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar recuperação de palavra-passe:", error);
    return NextResponse.json(
      { error: "Erro ao processar o pedido." },
      { status: 500 }
    );
  }
}