import { NextResponse } from "next/server";
import pool from "@/db"; 
import { RowDataPacket } from "mysql2";
import { getUserId } from "@/lib/auth";

// --- OBRIGA A API A NÃO GUARDAR CACHE ---
export const dynamic = 'force-dynamic';
// ----------------------------------------

function formatRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor(diffInSeconds / 3600);

  if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  return "Recentemente";
}

export async function GET(request: Request) {
  // 1. Obtém o ID do cookie seguro
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // 2. ESTATÍSTICAS
    const [postsRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM mensagem_geral WHERE remetente_id = ?", [userId]);
    const [groupsRows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) as total FROM membro WHERE remetente_id = ?", [userId]);
    const [groupMsgRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM mensagem_grupo mg JOIN membro m ON mg.remetente_id = m.id WHERE m.remetente_id = ?`, 
      [userId]
    );

    const stats = {
      posts: postsRows[0].total || 0,
      grupos: groupsRows[0].total || 0, 
      respostas: groupMsgRows[0].total || 0,
    };

    // 3. ATIVIDADE RECENTE
    const [activityRows] = await pool.query<RowDataPacket[]>(
      `SELECT m.id, m.titulo, m.data FROM mensagem m JOIN mensagem_geral mg ON m.id = mg.mensagem_id WHERE mg.remetente_id = ? ORDER BY m.data DESC LIMIT 3`,
      [userId]
    );

    const recentActivity = activityRows.map((item) => ({
      id: item.id,
      type: "post", 
      title: item.titulo || "Sem título",
      date: formatRelativeTime(item.data),
    }));

    // 4. INFO COMPLETA (BIO + INTERESSES)
    const [infoRows] = await pool.query<RowDataPacket[]>(
        "SELECT bio, interesses FROM info WHERE aluno_id = ?",
        [userId]
    );

    let interests: string[] = [];
    let bio = ""; 

    if (infoRows.length > 0) {
        if (infoRows[0].interesses) {
            interests = infoRows[0].interesses.split(',').map((i: string) => i.trim());
        }
        if (infoRows[0].bio) {
            bio = infoRows[0].bio;
        }
    } else {
        interests = ["Geral"];
    }

    return NextResponse.json({
      stats,
      interests,
      recentActivity,
      bio 
    });

  } catch (error) {
    console.error("Erro na API Profile:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}