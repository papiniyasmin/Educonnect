import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/db"; // O teu ficheiro de conexão
import { RowDataPacket } from "mysql2/promise";

const SECRET = "EDUCONNECT_SECRET_2024"; // Tem de ser igual ao do login

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const groupId = params.id;
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  let userId = 0;

  // 1. Tentar obter ID do utilizador pelo Token
  if (token) {
    try {
      const decoded = jwt.verify(token.value, SECRET) as { id: number };
      userId = decoded.id;
    } catch (e) {
      userId = 0;
    }
  }

  try {
    // 2. Buscar info do grupo e verificar se sou membro
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         g.id, g.nome, g.descricao, g.tipo, g.data_criacao,
         (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id) as total_membros,
         (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id AND m.remetente_id = ?) as is_member
       FROM grupo g
       WHERE g.id = ?`,
      [userId, groupId]
    );

    const group = rows[0];

    if (!group) {
      return NextResponse.json({ message: "Grupo não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: group.id,
      name: group.nome,
      description: group.descricao,
      type: group.tipo,
      memberCount: group.total_membros,
      isJoined: group.is_member > 0 // Retorna true ou false
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do grupo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}