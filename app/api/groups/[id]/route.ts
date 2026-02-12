// src/app/api/groups/[id]/posts/route.ts
import { NextResponse } from 'next/server';
import pool from "@/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id;
    
    // Faz o join com a tabela de utilizadores para saber quem criou o post
    const [rows]: any = await pool.query(`
      SELECT m.id, m.conteudo, m.data_envio, m.tipo, u.nome as authorName, u.foto_url as authorAvatar
      FROM mensagem m
      JOIN utilizador u ON m.id_utilizador = u.id
      WHERE m.id_grupo = ?
      ORDER BY m.data_envio DESC
    `, [groupId]);

    // MAPEAR: Aqui é a mágica. Convertemos a string JSON em Objeto
    const posts = rows.map((row: any) => {
      let contentObj;
      try {
        // Tenta ler o JSON que mostraste (texto_principal, comentarios, etc)
        contentObj = JSON.parse(row.conteudo); 
      } catch (e) {
        // Se der erro (posts antigos), assume que é texto simples
        contentObj = { texto_principal: row.conteudo, comentarios: [] };
      }

      return {
        id: row.id,
        title: "Post do Grupo", // Ou podes extrair um título se tiveres
        content: contentObj.texto_principal, // O texto principal
        comentarios: contentObj.comentarios || [], // O array de comentários que mostraste
        timestamp: new Date(row.data_envio).toLocaleString(),
        type: row.tipo || 'geral',
        authorName: row.authorName,
        authorAvatar: row.authorAvatar
      };
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}