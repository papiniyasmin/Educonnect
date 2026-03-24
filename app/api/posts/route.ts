import { NextResponse } from "next/server";
import pool from "@/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { v2 as cloudinary } from "cloudinary";

// =========================================================================
// 1. CONFIGURAÇÃO DO CLOUDINARY
// =========================================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

// =========================================================================
// GET: Buscar todos os posts do Feed Principal (Geral) com os seus Tópicos
// =========================================================================
export async function GET() {
  try {
    // --- 1. VERIFICAR QUEM ESTÁ A VER O FEED ---
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
      // --- 2. CONSULTA SQL COMPLEXA (COM JOINS) ---
      // - mensagem (texto, data)
      // - mensagem_geral e utilizador (para saber quem publicou)
      // - mensagem_topico e topico (para saber a categoria/tópico do post)
      const query = `
        SELECT 
          m.id, 
          m.conteudo as raw_content, 
          m.data as timestamp, 
          u.nome as author, 
          u.foto_url as authorAvatar,
          t.nome as topic
        FROM mensagem m
        JOIN mensagem_geral mg ON m.id = mg.mensagem_id
        JOIN utilizador u ON mg.remetente_id = u.id
        LEFT JOIN mensagem_topico mt ON m.id = mt.mensagem_id
        LEFT JOIN topico t ON mt.topico_id = t.id
        ORDER BY m.data DESC
      `;
      const [rows]: any = await connection.execute(query);

      // --- 3. FORMATAR OS DADOS PARA O FRONTEND ---
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
          topic: row.topic || null,
          likes: Array.isArray(contentObj.likes) ? contentObj.likes.length : 0,
          isLiked: Array.isArray(contentObj.likes) ? contentObj.likes.includes(currentUserId) : false, 
        };
      });

      return NextResponse.json(posts);
    } finally {
      connection.release(); 
    }
  } catch (error) {
    console.error("Erro GET posts:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// =========================================================================
// POST: Criar um Post Novo 
// =========================================================================
export async function POST(req: Request) {
  let connection;
  try {
    // --- 1. AUTENTICAÇÃO ---
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

    // --- 2. RECEBER OS DADOS DO FORMULÁRIO ---
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;
    const topicId = formData.get("topicId") as string; 

    // Validação: Tem de ter pelo menos texto ou imagem
    if ((!content || !content.trim()) && !file) {
      return NextResponse.json({ error: "O post precisa de texto ou de uma imagem." }, { status: 400 });
    }

    // --- 3. LÓGICA DE UPLOAD PARA O CLOUDINARY ---
    let imageUrl = null;
    if (file && file.size > 0) {
      // Converte o ficheiro em algo que o Node.js consiga ler (Buffer)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Fazemos o upload usando uma "Promise" para esperar que o Cloudinary termine de processar
      const uploadResponse: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "educonnect_posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
      imageUrl = uploadResponse.secure_url;
    }

    // --- 4. PREPARAR O JSON PARA GUARDAR NA BD ---
    const contentJSON = JSON.stringify({
      texto_principal: content ? content.trim() : "",
      imagem_url: imageUrl,
      likes: [],
      comentarios: []
    });

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Passo A: Insere o conteúdo principal na tabela 'mensagem'
      const [resMsg]: any = await connection.execute(
        'INSERT INTO mensagem (data, titulo, conteudo, tipo) VALUES (NOW(), ?, ?, ?)',
        ['Post Geral', contentJSON, 'experiencia']
      );
      const mensagem_id = resMsg.insertId; // Apanha o ID que a BD acabou de gerar
      
      // Passo B: Liga o post ao utilizador que o criou na tabela 'mensagem_geral'
      await connection.execute(
        'INSERT INTO mensagem_geral (remetente_id, mensagem_id) VALUES (?, ?)',
        [userId, mensagem_id]
      );

      // Passo C: Se o utilizador escolheu um tópico, faz a ligação na tabela 'mensagem_topico'
      if (topicId && topicId !== "0") {
        await connection.execute(
          "INSERT INTO mensagem_topico (mensagem_id, topico_id) VALUES (?, ?)",
          [mensagem_id, topicId]
        );
      }

      // Se tudo correu bem até aqui, GUARDA EFETIVAMENTE na BD (Commit)
      await connection.commit();
      return NextResponse.json({ success: true });

    } catch (err) {
      // Se deu erro num dos inserts, DESFAZ TUDO (Rollback) para não criar posts "órfãos"
      await connection.rollback();
      throw err; // Lança o erro para o "catch" principal em baixo
    }

  } catch (error) {
    console.error("Erro POST:", error);
    return NextResponse.json({ error: 'Erro ao criar post' }, { status: 500 });
  } finally {
    // Liberta a ligação aconteça o que acontecer
    if (connection) connection.release();
  }
}