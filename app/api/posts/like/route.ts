import { NextResponse } from 'next/server';
import pool from "@/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { postId } = await req.json();

   
    const idRegex = /^\d+$/;
    
    if (!postId || !idRegex.test(String(postId))) {
      return NextResponse.json(
        { error: "ID do post inválido." }, 
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    let userId: number;
    
    try {
      const secret = "EDUCONNECT_SECRET_2024"; // Mesma chave usada no login
      const decoded: any = jwt.verify(token, secret);
      userId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }


    const connection = await pool.getConnection();

    try {
     
      const [rows]: any = await connection.execute(
        'SELECT conteudo FROM mensagem WHERE id = ?', 
        [postId]
      );
      
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Post não encontrado' }, { status: 404 });
      }

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

      if (contentObj.likes.includes(numericUserId)) {

        contentObj.likes = contentObj.likes.filter((id: number) => id !== numericUserId);
      } else {

        contentObj.likes.push(numericUserId);
      }


      await connection.execute(
        'UPDATE mensagem SET conteudo = ? WHERE id = ?',
        [JSON.stringify(contentObj), postId]
      );

      return NextResponse.json({ 
        success: true, 
        likesCount: contentObj.likes.length,
        isLiked: contentObj.likes.includes(numericUserId)
      });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro no like:", error);
    return NextResponse.json({ error: 'Erro ao processar like' }, { status: 500 });
  }
}