import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db"; 
import { RowDataPacket } from "mysql2/promise";
import { getUserId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId() || 0;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        g.id, 
        g.nome, 
        g.descricao, 
        g.tipo, 
        g.data_criacao,
        
        -- Contagem de Membros (Esta estava certa)
        (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id) as total_membros,

        -- Contagem de Posts (CORRIGIDA)
        -- Temos de juntar com a tabela 'membro' para saber o grupo
        (SELECT COUNT(*) 
         FROM mensagem_grupo mg 
         INNER JOIN membro m ON mg.remetente_id = m.id 
         WHERE m.grupo_id = g.id) as total_posts,

        -- Verifica se sou membro
        (SELECT COUNT(*) FROM membro m WHERE m.grupo_id = g.id AND m.remetente_id = ?) as is_am_member

       FROM grupo g
       ORDER BY g.nome ASC`,
      [userId] 
    );

    // Formata para o Frontend
    const formattedGroups = rows.map((group) => ({
      id: group.id,
      name: group.nome,
      description: group.descricao,
      subject: group.tipo ? (group.tipo.charAt(0).toUpperCase() + group.tipo.slice(1)) : "Geral",
      year: group.data_criacao ? new Date(group.data_criacao).getFullYear().toString() : "2024",
      avatar: "", 
      memberCount: group.total_membros,
      posts: group.total_posts, // Agora vai funcionar
      isJoined: group.is_am_member > 0, 
    }));

    return NextResponse.json(formattedGroups);
    
  } catch (err: any) {
    console.error("Erro ao buscar grupos:", err);
    return NextResponse.json({ error: "Erro interno ao buscar grupos" }, { status: 500 });
  }
}