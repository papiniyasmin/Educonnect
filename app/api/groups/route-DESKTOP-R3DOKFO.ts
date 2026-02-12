import { NextResponse } from "next/server";
import pool from "@/db"; // Importar a conexão partilhada
import { RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // Garante que userId é um número ou null se não existir
  const userIdParam = searchParams.get("userId");
  const userId = userIdParam ? Number(userIdParam) : null;

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
  }

  try {
    // A query foi atualizada para as tabelas 'grupo' e 'membro'
    // A coluna que liga o utilizador ao grupo na tabela 'membro' é 'remetente_id'
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 
        g.id, 
        g.nome, 
        g.descricao, 
        g.tipo,
        IF(m.remetente_id IS NULL, 0, 1) AS isJoined,
        (SELECT COUNT(*) FROM membro WHERE grupo_id = g.id) AS memberCount
      FROM grupo g
      LEFT JOIN membro m 
        ON g.id = m.grupo_id AND m.remetente_id = ?
      ORDER BY g.data_criacao DESC
      `,
      [userId]
    );

    const groups = rows.map((g: any) => ({
      id: g.id,
      name: g.nome,
      description: g.descricao,
      subject: g.tipo,
      year: "Todos", // O teu esquema de Grupo não tem 'ano', mantive hardcoded
      memberCount: g.memberCount,
      isJoined: g.isJoined === 1,
      isPrivate: false,
      avatar: "/placeholder-group.png", // Hardcoded pois não existe na BD ainda
      recentActivity: "Atividade recente",
      lastActive: new Date(),
      posts: Math.floor(Math.random() * 50), // Mock
      moderators: ["Admin"], // Mock
    }));

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Erro ao buscar grupos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
