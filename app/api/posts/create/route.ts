import { NextResponse } from "next/server";
import pool from "@/db";
import { writeFile } from "fs/promises";
import path from "path";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // 1. Verificar Autenticação
    const cookieStore = cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token.value, process.env.JWT_SECRET || "segredo");
    const userId = decoded.id; 

    // 2. Receber dados
    const formData = await req.formData();
    const content = formData.get("content") as string;
    const file = formData.get("image") as File | null;

    if (!content && !file) {
      return NextResponse.json({ error: "O post precisa de conteúdo ou imagem" }, { status: 400 });
    }

    let imageUrl = null;

    // 3. Salvar Imagem no Disco (se houver)
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Nome único: data + nome original (sem espaços)
      const filename = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      imageUrl = `/uploads/${filename}`;
    }


    const [result]: any = await pool.query(
      `INSERT INTO mensagem (utilizador_id, conteudo, imagem, data) 
       VALUES (?, ?, ?, NOW())`,
      [userId, content, imageUrl]
    );

   
    return NextResponse.json({ 
      success: true, 
      post: {
        id: result.insertId,
        author: decoded.nome,
        authorAvatar: "/avatars/default.png", 
        content: content,
        image: imageUrl,
        likes: 0,
        isLiked: false,
        comments: [],
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error("Erro ao criar post:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}