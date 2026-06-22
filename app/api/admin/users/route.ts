import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

// Usamos a tua função exata que sabemos que funciona perfeitamente!
function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id; // Sabemos que o token tem o ID!
  } catch (e) {
    return null;
  }
}

export async function GET() {
  let connection;
  try {
    // 1. Pega no ID de quem está logado
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

    connection = await pool.getConnection();
    
    // 2. VERIFICAÇÃO INFALÍVEL: Vamos à BD confirmar se este ID é o 'admin'
    const [adminCheck]: any = await connection.execute("SELECT nome FROM utilizador WHERE id = ?", [userId]);
    
    if (adminCheck.length === 0 || adminCheck[0].nome !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas o Admin." }, { status: 403 });
    }

    // 3. Se chegou aqui, passou no teste de segurança! Vamos buscar todos os utilizadores
    const query = `
      SELECT id, nome, email, curso, ano_escolar 
      FROM utilizador
      ORDER BY id DESC
    `;
    const [rows]: any = await connection.execute(query);
    
    return NextResponse.json({ users: rows });
    
  } catch (error) {
    console.error("ERRO NO GET ADMIN:", error);
    return NextResponse.json({ error: "Erro ao carregar utilizadores" }, { status: 500 });
  } finally {
    if (connection) connection.release(); 
  }
}