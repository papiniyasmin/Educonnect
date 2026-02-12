import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db"; // Confirma se é @/db ou @/lib/db
import { RowDataPacket } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

export async function GET(req: NextRequest) {
  const userId = getUserId(); // <--- ID SEGURO

  if (!userId) {
    return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });
  }

  try {
    // Busca grupos onde o 'remetente_id' (o utilizador) existe na tabela 'membro'
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        g.id, 
        g.nome, 
        g.descricao, 
        g.tipo,
        g.foto_url
       FROM grupo g
       INNER JOIN membro m ON g.id = m.grupo_id
       WHERE m.remetente_id = ?
       ORDER BY g.nome ASC`,
      [userId]
    );

    return NextResponse.json({ groups: rows });
  } catch (err: any) {
    console.error("Erro ao buscar meus grupos:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}