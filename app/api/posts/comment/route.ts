import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

// =========================================================================
// POST: Adicionar um comentário 
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. OBTER O TOKEN DO COOKIE
    // ---------------------------------------------------------
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. VERIFICAR O TOKEN (AUTENTICAÇÃO)
    // ---------------------------------------------------------
    let myId;
    try {
      const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (error) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 3. LER DADOS DO FRONTEND E VALIDAR (REGEX)
    // ---------------------------------------------------------
    const { postId, content } = await req.json();

    // A. Validar se o comentário é vazio
    const contentRegex = /\S/; 
    if (!content || !contentRegex.test(content)) {
      return NextResponse.json(
        { error: 'O comentário não pode estar vazio.' }, 
        { status: 400 }
      );
    }

    // B. Validar se o postId é mesmo um número
    const idRegex = /^\d+$/;
    if (!postId || !idRegex.test(String(postId))) {
      return NextResponse.json(
        { error: 'ID do post inválido.' }, 
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // PREPARAR A LIGAÇÃO À BASE DE DADOS
    // ---------------------------------------------------------
    const connection = await pool.getConnection();

    try {
      // ---------------------------------------------------------
      // 4. BUSCAR DADOS DO AUTOR (QUEM ESTÁ A COMENTAR)
      // ---------------------------------------------------------
      const [userRows]: any = await connection.execute(
        'SELECT nome, foto_url FROM utilizador WHERE id = ?', 
        [myId]
      );

      if (userRows.length === 0) {
        return NextResponse.json({ error: 'Utilizador não encontrado' }, { status: 404 });
      }

      const author = userRows[0];

      // ---------------------------------------------------------
      // 5. BUSCAR O POST ORIGINAL NA BASE DE DADOS
      // ---------------------------------------------------------
      const [msgRows]: any = await connection.execute(
        'SELECT conteudo FROM mensagem WHERE id = ?', 
        [postId]
      );
      
      if (msgRows.length === 0) {
        return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
      }

      // ---------------------------------------------------------
      // 6. PROCESSAR O CONTEÚDO JSON DO POST
      // ---------------------------------------------------------
      let contentObj;
      try {
        contentObj = JSON.parse(msgRows[0].conteudo);
      } catch {
        contentObj = { texto_principal: msgRows[0].conteudo, likes: [], comentarios: [] };
      }
      if (!Array.isArray(contentObj.comentarios)) {
        contentObj.comentarios = [];
      }

      // ---------------------------------------------------------
      // 7. CRIAR O NOVO COMENTÁRIO
      // ---------------------------------------------------------
      const newComment = {
        id: Date.now(),
        content: content.trim(), 
        author: author.nome,
        authorAvatar: author.foto_url,
        timestamp: new Date().toISOString() 
      };

      contentObj.comentarios.push(newComment);

      // ---------------------------------------------------------
      // 8. ATUALIZAR O POST NA BASE DE DADOS
      // ---------------------------------------------------------
      await connection.execute(
        'UPDATE mensagem SET conteudo = ? WHERE id = ?',
        [JSON.stringify(contentObj), postId]
      );

      // ---------------------------------------------------------
      // 9. ENVIAR RESPOSTA FINAL AO FRONTEND
      // ---------------------------------------------------------
      return NextResponse.json(newComment, { status: 200 });

    } finally {
      connection.release();
    }
  } catch (error) {
   
    console.error("Erro Crítico na API de Comentários:", error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}