import { NextResponse } from "next/server";
import pool from "@/db"; 
import { getUserId } from "@/lib/auth"; // <--- Importamos a tua função mágica de autenticação

// =========================================================================
// GET: Vai buscar as notificações mais recentes do utilizador logado
// =========================================================================
export async function GET(request: Request) {
  try {
    const utilizadorLogadoId = getUserId(); 

    if (!utilizadorLogadoId) {
      return NextResponse.json({ error: "Não autorizado. Faça login." }, { status: 401 });
    }

    const [notificacoes]: any = await pool.query(`
      SELECT 
        n.id, 
        n.tipo as type, 
        n.conteudo as content, 
        n.lida as is_read, 
        n.criado_em as created_at,
        u.nome as actor_name,
        u.foto_url as actor_avatar
      FROM notificacao n
      JOIN utilizador u ON n.remetente_id = u.id
      WHERE n.utilizador_id = ?
      ORDER BY n.criado_em DESC
      LIMIT 20
    `, [utilizadorLogadoId]);

    // Devolvemos a lista de notificações ao Frontend
    return NextResponse.json(notificacoes);
    
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

// =========================================================================
// PUT: Marca as notificações do utilizador como "lidas"
// =========================================================================
export async function PUT(request: Request) {
  try {
    // 1. AUTENTICAÇÃO REAL
    const utilizadorLogadoId = getUserId(); 

    if (!utilizadorLogadoId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 2. ATUALIZAÇÃO
    await pool.query(
      `UPDATE notificacao SET lida = TRUE WHERE utilizador_id = ? AND lida = FALSE`,
      [utilizadorLogadoId]
    );

    return NextResponse.json({ success: true, message: "Notificações marcadas como lidas" });
    
  } catch (error) {
    console.error("Erro ao atualizar notificações:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}