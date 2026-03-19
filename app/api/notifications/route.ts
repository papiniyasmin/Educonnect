import { NextResponse } from "next/server";
import pool from "@/db"; 


export async function GET(request: Request) {
  try {

    const utilizadorLogadoId = 1; 

    const [notificacoes] = await pool.query(`
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

    return NextResponse.json(notificacoes);
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}

// PUT: Marca as notificações como lidas quando o utilizador clica no sino
export async function PUT(request: Request) {
  try {
    const utilizadorLogadoId = 1; // Substituir pela lógica do utilizador logado

    // Atualiza tudo o que é false (0) para true (1) para este utilizador
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