import { NextResponse } from "next/server";
import pool from "@/db"; // A tua ligação segura à Base de Dados

// =========================================================================
// GET: Verificar o Email do Utilizador (Ativação de Conta)
// =========================================================================
export async function GET(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. EXTRAIR O TOKEN DO LINK
    // ---------------------------------------------------------
    // Quando o utilizador clica no link do email, ele vem com um token na URL.
    // Exemplo: https://educonnect.com/api/verify?token=abc123xyz
    const reqUrl = new URL(req.url); 
    const token = reqUrl.searchParams.get("token");

    // Se alguém tentar aceder a esta página sem um token, barramos logo aqui.
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. PROCURAR O UTILIZADOR NA BASE DE DADOS
    // ---------------------------------------------------------
    // CORREÇÃO TYPESCRIPT: Removido o <RowDataPacket[]> e adicionado o ': any'
    const [users]: any = await pool.query(
      "SELECT id FROM utilizador WHERE verification_token = ?",
      [token]
    );

    // Se não encontrar ninguém com este token (ou se já foi usado), devolve erro.
    if (users.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }

    // Apanhamos o ID do utilizador que é dono deste token
    const userId = users[0].id;

    // ---------------------------------------------------------
    // 3. ATIVAR A CONTA E DESTRUIR O TOKEN (SEGURANÇA)
    // ---------------------------------------------------------
    // CORREÇÃO TYPESCRIPT: Removido o <ResultSetHeader>
    // Mudamos o status para 'ativo' para ele poder fazer login.
    // Colocamos o token a NULL para que este link mágico nunca mais funcione.
    await pool.query(
      "UPDATE utilizador SET status = 'ativo', verification_token = NULL WHERE id = ?",
      [userId]
    );

    // ---------------------------------------------------------
    // 4. REDIRECIONAR PARA O FRONTEND (LOGIN)
    // ---------------------------------------------------------
    // Em vez de devolvermos um JSON feio no ecrã, mandamos o utilizador diretamente 
    // para a página de Login da tua app. O '?verified=true' no final do link 
    // serve para o React saber que deve mostrar um alerta verde a dizer "Conta ativada!".
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