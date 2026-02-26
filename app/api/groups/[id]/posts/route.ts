import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const SECRET = "EDUCONNECT_SECRET_2024";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    
    // 1. Descobrir quem está logado para saber se é o dono dos posts
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    let loggedInUserId = 0;

    if (token) {
      try {
        const decoded = jwt.verify(token.value, SECRET) as { id: number };
        loggedInUserId = decoded.id;
      } catch (e) {} // Falhou silenciosamente, fica como 0 (visitante)
    }

    // 2. Query com o u.id incluído
    const query = `
      SELECT 
        msg.id, 
        msg.titulo,
        msg.conteudo, 
        msg.data,  
        msg.tipo, 
        u.id as authorId, 
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

    const posts = rows.map((row: any) => {
      let textoFinal = row.conteudo;
      let listaComentarios = [];
      let imagemUrl = null;

      try {
        const jsonConteudo = JSON.parse(row.conteudo);
        if (jsonConteudo.texto_principal) textoFinal = jsonConteudo.texto_principal;
        if (jsonConteudo.comentarios) listaComentarios = jsonConteudo.comentarios;
        if (jsonConteudo.imagem_url) imagemUrl = jsonConteudo.imagem_url;
      } catch (e) {
        textoFinal = row.conteudo; 
      }

      return {
        id: row.id,
        title: row.titulo || "", 
        content: textoFinal,
        image: imagemUrl,
        comentarios: listaComentarios,
        timestamp: new Date(row.data).toISOString(),
        type: row.tipo || 'geral',
        authorName: row.authorName,
        authorAvatar: row.authorAvatar,
        isOwner: row.authorId === loggedInUserId // True se for dono do post
      };
    });

    return NextResponse.json(posts, { status: 200 });

  } catch (error) {
    console.error("Erro no GET /posts:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    
    // 1. Verificar Autenticação
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    let userId = 0;

    if (token) {
      try {
        const decoded = jwt.verify(token.value, SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
      }
    }

    if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    // 2. Verificar se é membro do grupo
    const [membros]: any = await pool.query(
      "SELECT id FROM membro WHERE grupo_id = ? AND remetente_id = ?",
      [groupId, userId]
    );

    if (membros.length === 0) {
      return NextResponse.json({ error: "Apenas membros podem publicar." }, { status: 403 });
    }

    const membroId = membros[0].id;

    // 3. Receber FormData
    const formData = await request.formData();
    const content = formData.get("content") as string || "";
    const type = formData.get("type") as string || "geral";
    const image = formData.get("image") as File | null;

    if (!content.trim() && !image) {
      return NextResponse.json({ error: "A publicação não pode estar vazia" }, { status: 400 });
    }

    let imageUrl = null;

    // 4. Processar e guardar a imagem
    if (image && image.name) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const safeFilename = image.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${uniqueSuffix}-${safeFilename}`; 
      
      const uploadDir = path.join(process.cwd(), "public/uploads/groups");
      await mkdir(uploadDir, { recursive: true });
      
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      imageUrl = `/uploads/groups/${filename}`;
    }

    // 5. Preparar JSON para DB
    const jsonConteudo = JSON.stringify({
      texto_principal: content,
      comentarios: [],
      imagem_url: imageUrl
    });

    // 6. Inserir mensagem
    const [msgResult]: any = await pool.query(
      "INSERT INTO mensagem (titulo, conteudo, tipo, data) VALUES (?, ?, ?, NOW())",
      ["", jsonConteudo, type]
    );
    
    const mensagemId = msgResult.insertId;

    // 7. Ligar ao grupo
    await pool.query(
      "INSERT INTO mensagem_grupo (mensagem_id, remetente_id) VALUES (?, ?)",
      [mensagemId, membroId]
    );

    return NextResponse.json({ success: true, messageId: mensagemId, imageUrl }, { status: 201 });

  } catch (error) {
    console.error("Erro no POST /posts:", error);
    return NextResponse.json({ error: "Erro ao publicar" }, { status: 500 });
  }
}