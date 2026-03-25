import { NextResponse } from 'next/server';
import pool from "@/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// =========================================================================
// POST: Adicionar ou remover um "Gosto" (Like/Unlike) numa publicação
// =========================================================================
export async function POST(req: Request) {
  try {
    const { postId } = await req.json();
    const idRegex = /^\d+$/;
    if (!postId || !idRegex.test(String(postId))) {
      return NextResponse.json({ error: "ID do post inválido." }, { status: 400 });
    }

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let userId: number;
    try {
      const secret = "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      // =====================================================================
      // PASSO 0: Buscar os dados do Post
      // =====================================================================
      const [rows]: any = await connection.execute(`
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

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
      }

      // Guardamos o dono da publicação e o título (com um fallback caso seja nulo)
      const postOwnerId = rows[0].dono_id; 
      const postTitle = rows[0].titulo || "uma publicação";

      let contentObj;
      try {
        contentObj = JSON.parse(rows[0].conteudo);
      } catch {
        contentObj = { texto_principal: rows[0].conteudo, likes: [], comentarios: [] };
      }
      if (!Array.isArray(contentObj.likes)) {
        contentObj.likes = [];
      }

      const numericUserId = Number(userId);
      

      const isLiking = !contentObj.likes.includes(numericUserId);

      if (!isLiking) {
    
        contentObj.likes = contentObj.likes.filter((id: number) => id !== numericUserId);
      } else {
     
        contentObj.likes.push(numericUserId);
      }

      // =====================================================================
      // PASSO 1: Atualizar o Post com o novo Like (Isto garante que não desaparece)
      // =====================================================================
      await connection.execute(
        'UPDATE mensagem SET conteudo = ? WHERE id = ?',
        [JSON.stringify(contentObj), postId]
      );

      // =====================================================================
      // PASSO 2: Criar a Notificação
      // =====================================================================
      try {
        if (isLiking && postOwnerId && postOwnerId !== numericUserId) {
          
          // Criamos a frase personalizada com o título do post
          const textoNotificacao = `gostou do teu post sobre ${postTitle}.`;
          await connection.execute(
            `INSERT INTO notificacao (utilizador_id, remetente_id, tipo, conteudo, lida) 
             VALUES (?, ?, 'like', ?, 0)`,
            [postOwnerId, numericUserId, textoNotificacao]
          );
        }
      } catch (notifError) {
        console.error(" ERRO A CRIAR NOTIFICAÇÃO DO LIKE:", notifError);
      }

      return NextResponse.json({ 
        success: true, 
        likesCount: contentObj.likes.length,
        isLiked: isLiking // Devolver estado atualizado
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro no like:", error);
    return NextResponse.json({ error: 'Erro ao processar like' }, { status: 500 });
  }
}