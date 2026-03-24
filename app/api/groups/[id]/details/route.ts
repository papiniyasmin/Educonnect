import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/db"; // O teu ficheiro de conexão
import { RowDataPacket } from "mysql2/promise";

const SECRET = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 

// ==========================================
// INTERFACE: Mapeamento dos resultados SQL
// ==========================================
// Define exatamente as colunas retornadas pela query (incluindo as subqueries)
interface GroupDetailsRow extends RowDataPacket {
  id: number;
  nome: string;
  descricao: string;
  tipo: string;
  data_criacao: string | Date;
  total_membros: number;
  is_member: number; // O COUNT() do MySQL retorna um número (0 ou 1 neste caso)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const groupId = params.id;
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  let userId = 0;

  // 1. Tentar obter o ID do utilizador a partir do Token (JWT)
  if (token) {
    try {
      const decoded = jwt.verify(token.value, SECRET) as { id: number };
      userId = decoded.id;
    } catch (e) {
      userId = 0; // Se o token for inválido, assume como visitante (ID 0)
    }
  }

  try {
    // 2. Buscar informações do grupo e verificar se o utilizador é membro

    const [rows] = (await pool.query(
      `SELECT 
         g.id, g.nome, g.descricao, g.tipo, g.data_criacao,
         -- Subquery 1: Conta o total de membros no grupo
         (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id) as total_membros,
         -- Subquery 2: Verifica se ESTE utilizador específico está no grupo
         (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id AND m.remetente_id = ?) as is_member
       FROM grupo g
       WHERE g.id = ?`,
      [userId, groupId]
    )) as [GroupDetailsRow[], any];

    const group = rows[0];

    // Se a query não devolver nada, o grupo não existe
    if (!group) {
      return NextResponse.json({ message: "Grupo não encontrado" }, { status: 404 });
    }

    // 3. Formatar os dados para o Frontend
    return NextResponse.json({
      id: group.id,
      name: group.nome,
      description: group.descricao,
      type: group.tipo,
      memberCount: group.total_membros,
      // Converte o número (0 ou 1) num valor booleano (false ou true)
      isJoined: group.is_member > 0 
    });

  } catch (error) {
    console.error("Erro ao buscar detalhes do grupo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}