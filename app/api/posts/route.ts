import { NextResponse } from "next/server";
import pool from "@/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// 1. Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

// --- GET: Buscar posts (Mantém a lógica, mas garante a conexão) ---
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    let currentUserId = 0;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
        currentUserId = decoded.id;
      } catch (e) {}
    }

    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT m.id, m.conteudo as raw_content, m.data as timestamp, u.nome as author, u.foto_url as authorAvatar
        FROM mensagem m
        JOIN mensagem_geral mg ON m.id = mg.mensagem_id
        JOIN utilizador u ON mg.remetente_id = u.id
        ORDER BY m.data DESC
      `;

      const [rows]: any = await connection.execute(query);

      const posts = rows.map((row: any) => {
        let contentObj;
        try {
          contentObj = JSON.parse(row.raw_content);
        } catch (e) {
          contentObj = { texto_principal: row.raw_content, imagem_url: null, likes: [], comentarios: [] };
        }

        return {
          id: row.id,
          content: contentObj.texto_principal || "",
          image: contentObj.imagem_url || null,
          timestamp: row.timestamp,
          author: row.author,
          authorAvatar: row.authorAvatar,
          likes: Array.isArray(contentObj.likes) ? contentObj.likes.length : 0,
          isLiked: Array.isArray(contentObj.likes) ? contentObj.likes.includes(currentUserId) : false,
          comments: Array.isArray(contentObj.comentarios) ? contentObj.comentarios : []
        };
      });

      return NextResponse.json(posts);
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// --- POST: Criar Post com Cloudinary ---
export async function POST(req: Request) {
  let connection;
  try {
    // 1. Autenticação
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    let userId;
    try {
      const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
      userId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // 2. Processar FormData
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;

    if ((!content || !content.trim()) && !file) {
      return NextResponse.json({ error: "O post precisa de texto ou de uma imagem." }, { status: 400 });
    }

    // 3. LÓGICA CLOUDINARY (Substitui o salvamento local)
    let imageUrl = null;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "educonnect_posts" }, // Pasta diferente para organizar
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResponse.secure_url;
    }

    // 4. Salvar na Base de Dados
    const contentJSON = JSON.stringify({
      texto_principal: content ? content.trim() : "",
      imagem_url: imageUrl,
      likes: [],
      comentarios: []
    });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [resMsg]: any = await connection.execute(
        'INSERT INTO mensagem (data, titulo, conteudo, tipo) VALUES (NOW(), ?, ?, ?)',
        ['Post Geral', contentJSON, 'experiencia']
      );
      
      await connection.execute(
        'INSERT INTO mensagem_geral (remetente_id, mensagem_id) VALUES (?, ?)',
        [userId, resMsg.insertId]
      );

      await connection.commit();
      return NextResponse.json({ success: true });
    } catch (err) {
      await connection.rollback();
      throw err;
    }

  } catch (error) {
    console.error("Erro POST:", error);
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}