import { NextResponse } from "next/server";
import pool from "@/db"; // <-- Agora sim, vai usar o ficheiro db.js com a regra de segurança!

export const dynamic = 'force-dynamic';

export async function GET() {
  let connection;
  try {
    // Usa a pool protegida com SSL
    connection = await pool.getConnection();
    
    const [rows] = await connection.execute("SELECT id, nome FROM topico ORDER BY nome ASC");
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar tópicos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  } finally {
    if (connection) connection.release(); // Liberta a ligação
  }
}