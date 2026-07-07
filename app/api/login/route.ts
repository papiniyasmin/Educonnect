import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const ALLOWED_ORIGINS = [
  "https://educonnect-eopy.vercel.app",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "https://educonnect-eopy.vercel.app";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true", 
  };
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400, headers: corsHeaders }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Formato de email inválido" },
        { status: 400, headers: corsHeaders }
      );
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM utilizador WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Email não encontrado" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = rows[0];
    const dbPassword = user.palavra_passe;

    let isMatch = false;
    if (dbPassword && dbPassword.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, dbPassword);
    } else {
      isMatch = dbPassword === password;
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Palavra-passe incorreta" },
        { status: 401, headers: corsHeaders }
      );
    }

    const secret = "EDUCONNECT_SECRET_2024";
    const token = jwt.sign(
      { id: user.id, email: user.email, role: "student" },
      secret,
      { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      {
        success: true,
        message: "Login efetuado com sucesso!",
        userId: user.id,
        nome: user.nome, 
      },
      { headers: corsHeaders }
    );

    // ✅ Cookie para o website (browser ignora o token no body)
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;

  } catch (error) {
    console.error("Erro no Login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500, headers: corsHeaders }
    );
  }
}