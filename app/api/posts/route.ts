import { NextResponse } from "next/server";
import pool from "@/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// GET: Buscar posts
export async function GET() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    let currentUserId = 0;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024");
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

        const likesList = Array.isArray(contentObj.likes) ? contentObj.likes : [];
        const commentsList = Array.isArray(contentObj.comentarios) ? contentObj.comentarios : [];

        return {
          id: row.id,
          content: contentObj.texto_principal || "",
          image: contentObj.imagem_url || null,
          timestamp: row.timestamp,
          author: row.author,
          authorAvatar: row.authorAvatar,
          likes: likesList.length,
          isLiked: likesList.includes(currentUserId),
          comments: commentsList
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

// POST: Criar Post
export async function POST(req: Request) {
  try {
    // 1. Autenticação
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    let userId;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024");
      userId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // 2. Processar FormData
    const formData = await req.formData();
    const content = formData.get("content") as string; // Pode vir vazio
    const file = formData.get("image") as File | null;

    // --- CORREÇÃO DO ERRO 400 ---
    // Só dá erro se AMBOS estiverem vazios. Se tiver imagem e sem texto, passa.
    if ((!content || !content.trim()) && !file) {
      return NextResponse.json({ error: "O post precisa de texto ou de uma imagem." }, { status: 400 });
    }

    // 3. Upload Imagem
    let imageUrl = null;
    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    }

    // 4. Salvar na Base de Dados
    const contentJSON = JSON.stringify({
      texto_principal: content ? content.trim() : "",
      imagem_url: imageUrl,
      likes: [],
      comentarios: []
    });

    const connection = await pool.getConnection();
    try {
      const [resMsg]: any = await connection.execute(
        'INSERT INTO mensagem (data, titulo, conteudo, tipo) VALUES (NOW(), ?, ?, ?)',
        ['Post Geral', contentJSON, 'experiencia']
      );
      
      await connection.execute(
        'INSERT INTO mensagem_geral (remetente_id, mensagem_id) VALUES (?, ?)',
        [userId, resMsg.insertId]
      );

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Erro POST:", error);
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
  }
}