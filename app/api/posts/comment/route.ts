import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

// =========================================================================
// POST: Adicionar um comentário 
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let myId;
    try {
      const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { postId, content } = await req.json();

    const contentRegex = /\S/; 
    if (!content || !contentRegex.test(content)) {
      return NextResponse.json({ error: 'O comentário não pode estar vazio.' }, { status: 400 });
    }

    const idRegex = /^\d+$/;
    if (!postId || !idRegex.test(String(postId))) {
      return NextResponse.json({ error: 'ID do post inválido.' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      const [userRows]: any = await connection.execute(
        'SELECT nome, foto_url FROM utilizador WHERE id = ?', 
        [myId]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }

      const author = userRows[0];

      // =====================================================================
      // MODIFICAÇÃO: A query mágica para encontrar o dono e o título do post!
      // =====================================================================
      const [msgRows]: any = await connection.execute(`
        SELECT 
          m.conteudo,
          m.titulo,
          COALESCE(mg.remetente_id, mgr.remetente_id, mp.remetente_id) AS dono_id
        FROM mensagem m
        LEFT JOIN mensagem_geral mg ON m.id = mg.mensagem_id
        LEFT JOIN mensagem_grupo mgr ON m.id = mgr.mensagem_id
        LEFT JOIN mensagem_particular mp ON m.id = mp.mensagem_id
        WHERE m.id = ?
      `, [postId]);
      
      if (msgRows.length === 0) {
        return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
      }

      const postOwnerId = msgRows[0].dono_id;
      const postTitle = msgRows[0].titulo || "uma publicação"; 

      let contentObj;
      try {
        contentObj = JSON.parse(msgRows[0].conteudo);
      } catch {
        contentObj = { texto_principal: msgRows[0].conteudo, likes: [], comentarios: [] };
      }
      if (!Array.isArray(contentObj.comentarios)) {
        contentObj.comentarios = [];
      }

      const newComment = {
        id: Date.now(),
        content: content.trim(), 
        author: author.nome,
        authorAvatar: author.foto_url,
        timestamp: new Date().toISOString() 
      };

      contentObj.comentarios.push(newComment);

      // =====================================================================
      // PASSO 1: Atualizar o Post com o novo Comentário
      // =====================================================================
      await connection.execute(
        'UPDATE mensagem SET conteudo = ? WHERE id = ?',
        [JSON.stringify(contentObj), postId]
      );

      // =====================================================================
      // PASSO 2: CRIAR A NOTIFICAÇÃO SE NÃO FOR O PRÓPRIO A COMENTAR
      // =====================================================================
      try {
        if (postOwnerId && postOwnerId !== myId) {
          const textoNotificacao = `comentou no teu post sobre ${postTitle}.`;

          await connection.execute(
            `INSERT INTO notificacao (utilizador_id, remetente_id, tipo, conteudo, lida) 
             VALUES (?, ?, 'comment', ?, 0)`,
            [postOwnerId, myId, textoNotificacao]
          );
        }
      } catch (notifError) {
        console.error(" ERRO A CRIAR NOTIFICAÇÃO DO COMENTÁRIO:", notifError);
      }
      // =====================================================================

      return NextResponse.json(newComment, { status: 200 });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro Crítico na API de Comentários:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}