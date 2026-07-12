import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    
    // 1. LER TOKEN E NOVA PASSWORD
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
    }

    // 2. VERIFICAR SE O TOKEN EXISTE E AINDA É VÁLIDO
    const [users]: any = await pool.query(
      "SELECT id FROM utilizador WHERE reset_token = ? AND reset_token_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }
    const userId = users[0].id;

    // 3. ENCRIPTAR A NOVA PASSWORD E INVALIDAR O TOKEN
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "UPDATE utilizador SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
      [hashedPassword, userId]
    );

    // 4. RESPOSTA DE SUCESSO
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao redefinir a palavra-passe:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir a palavra-passe." },
      { status: 500 }
    );
  }
}