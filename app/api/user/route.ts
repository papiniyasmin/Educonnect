import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

// 1. OBRIGATÓRIO: Força a API a não guardar cache (para não mostrar dados antigos)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 2. LER O TOKEN DE SEGURANÇA (Igual ao settings)
    const cookieStore = cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado (Token em falta)" }, { status: 401 });
    }

    // 3. DESCODIFICAR O TOKEN
    const secret = "EDUCONNECT_SECRET_2024"; // Tem de ser igual ao Login
    let userId;

    try {
      const decoded: any = jwt.verify(token.value, secret);
      userId = decoded.id;
    } catch (err) {
      console.error("Token inválido:", err);
      // Se o token for inválido, mandamos limpar o cookie no frontend se possível
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // 4. QUERY AO BANCO DE DADOS (Usando o ID do Token)
    // Mantive os "AS name", "AS avatar" para não quebrar o teu frontend
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, 
        nome AS name, 
        foto_url AS avatar, 
        email, 
        ano_escolar AS year, 
        curso 
       FROM utilizador 
       WHERE id = ?`,
      [userId]
    );

    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado no banco" }, { status: 404 });
    }

    // 5. RETORNA OS DADOS CORRETOS DO JOÃO
    return NextResponse.json(user);

  } catch (error) {
    console.error("Erro na API User:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}