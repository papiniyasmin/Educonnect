import { NextResponse } from "next/server";
import pool from "@/db";

// =========================================================================
// GET: Verificar o Email do Utilizador (Ativação de Conta)
// =========================================================================
export async function GET(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. EXTRAIR O TOKEN DO LINK
    // ---------------------------------------------------------
    const reqUrl = new URL(req.url); 
    const token = reqUrl.searchParams.get("token");  
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
    }
    // ---------------------------------------------------------
    // 2. PROCURAR O UTILIZADOR NA BASE DE DADOS
    // ---------------------------------------------------------

    const [users]: any = await pool.query(
      "SELECT id FROM utilizador WHERE verification_token = ?",
      [token]
    );
    if (users.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }
    const userId = users[0].id;

    // ---------------------------------------------------------
    // 3. ATIVAR A CONTA E DESTRUIR O TOKEN (SEGURANÇA)
    // ---------------------------------------------------------
    await pool.query(
      "UPDATE utilizador SET status = 'ativo', verification_token = NULL WHERE id = ?",
      [userId]
    );

    // ---------------------------------------------------------
    // 4. REDIRECIONAR PARA O FRONTEND (LOGIN)
    // ---------------------------------------------------------
    return NextResponse.redirect(`${reqUrl.origin}/login?verified=true`);
  } catch (error) {
    // ---------------------------------------------------------
    // 5. TRATAMENTO DE ERROS
    // ---------------------------------------------------------
    console.error("Erro na verificação do email:", error);
    return NextResponse.json(
      { error: "Erro ao verificar a conta." },
      { status: 500 }
    );
  }
}