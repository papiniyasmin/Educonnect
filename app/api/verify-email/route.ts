import { NextResponse } from "next/server";
import pool from "@/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function GET(req: Request) {
  try {
    const reqUrl = new URL(req.url); 
    const token = reqUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 400 });
    }

    // Procurar utilizador com este token
    const [users] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM utilizador WHERE verification_token = ?",
      [token]
    );

    if (users.length === 0) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 400 });
    }

    const userId = users[0].id;

    // Atualizar o status para 'ativo' e apagar o token
    await pool.query<ResultSetHeader>(
      "UPDATE utilizador SET status = 'ativo', verification_token = NULL WHERE id = ?",
      [userId]
    );


    return NextResponse.redirect(`${reqUrl.origin}/login?verified=true`);

  } catch (error) {
    console.error("Erro na verificação do email:", error);
    return NextResponse.json(
      { error: "Erro ao verificar a conta." },
      { status: 500 }
    );
  }
}