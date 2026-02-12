import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs"; // Recomendado usar bcryptjs em vez de bcrypt no Next.js
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ---------------------------------------------------------
    // 1. VALIDAÇÃO COM REGEX (Igual ao Frontend)
    // ---------------------------------------------------------
    
    // Verificar se os campos existem
    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });
    }

    // Regex de Email (O mesmo usado no registo)
    // Isso evita uma consulta à BD se o utilizador escrever "joao" em vez de "joao@email.com"
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 });
    }

    // NOTA: Não aplicamos Regex de complexidade na senha aqui.
    // Se a senha for "123456", deixamos o bcrypt verificar se está correta.
    // Rejeitar por regex aqui impediria o login de contas antigas se as regras mudassem.

    // ---------------------------------------------------------
    // 2. BUSCAR UTILIZADOR
    // ---------------------------------------------------------
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM utilizador WHERE email = ?", 
      [email]
    );
    
    if (rows.length === 0) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 401 });
    }

    const user = rows[0];

    // ---------------------------------------------------------
    // 3. VERIFICAR SENHA
    // ---------------------------------------------------------
    // Baseado no seu schema educonnect1.sql, a coluna correta é 'palavra_passe'
    const dbPassword = user.palavra_passe; 
    
    let isMatch = false;

    if (dbPassword && dbPassword.startsWith("$2")) {
        // Senha encriptada (O padrão correto)
        isMatch = await bcrypt.compare(password, dbPassword);
    } else {
        // Fallback para texto simples (caso tenha inserido manualmente na BD para testes)
        isMatch = (dbPassword === password);
    }

    if (!isMatch) {
      return NextResponse.json({ error: "Palavra-passe incorreta" }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 4. CRIAR TOKEN JWT
    // ---------------------------------------------------------
    const secret = "EDUCONNECT_SECRET_2024"; // Idealmente, mova isto para process.env.JWT_SECRET
    
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: "student" // Opcional: útil se tiver professores/admins
      },
      secret,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({ 
        success: true, 
        message: "Login efetuado com sucesso!",
        userId: user.id 
    });

    // ---------------------------------------------------------
    // 5. GRAVAR COOKIE
    // ---------------------------------------------------------
    response.cookies.set({
      name: "token", 
      value: token,
      httpOnly: true, // Importante: impede acesso via JavaScript (XSS)
      path: "/", 
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    });

    return response;

  } catch (error) {
    console.error("Erro no Login:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}