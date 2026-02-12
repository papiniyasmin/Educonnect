import { NextResponse } from 'next/server';
import pool from "@/db";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id;
    
    
    const query = `
      SELECT 
        msg.id, 
        msg.conteudo, 
        msg.data,  
        msg.tipo, 
        u.nome as authorName, 
        u.foto_url as authorAvatar
      FROM mensagem_grupo mg
      JOIN membro mem ON mg.remetente_id = mem.id
      JOIN mensagem msg ON mg.mensagem_id = msg.id
      JOIN utilizador u ON mem.remetente_id = u.id
      WHERE mem.grupo_id = ?
      ORDER BY msg.data DESC
    `;

    const [rows]: any = await pool.query(query, [groupId]);

    // O processamento do JSON mantém-se igual, pois a coluna 'conteudo' é texto
    const posts = rows.map((row: any) => {
      let textoFinal = row.conteudo;
      let listaComentarios = [];

      try {
        const jsonConteudo = JSON.parse(row.conteudo);
        
        if (jsonConteudo.texto_principal) {
            textoFinal = jsonConteudo.texto_principal;
        }
        
        if (jsonConteudo.comentarios) {
            listaComentarios = jsonConteudo.comentarios;
        }

      } catch (e) {
        // Se falhar o parse, usa o texto direto
        textoFinal = row.conteudo;
      }

      return {
        id: row.id,
        title: row.titulo || "Post", 
        content: textoFinal,
        comentarios: listaComentarios,
        timestamp: new Date(row.data).toLocaleString('pt-PT'),
        type: row.tipo || 'geral',
        authorName: row.authorName,
        authorAvatar: row.authorAvatar
      };
    });

    return NextResponse.json(posts);

  } catch (error) {
    console.error("Erro SQL ao buscar posts:", error);
    return NextResponse.json({ error: "Erro interno de base de dados", details: error }, { status: 500 });
  }
}