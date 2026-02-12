import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// 1. Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

// Função auxiliar para validar o utilizador
function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null;

  try {
    const secret = "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e) {
    return null;
  }
}

// --- GET: Carregar dados do perfil ---
export async function GET() {
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const connection = await pool.getConnection();

    try {
      // Query ajustada aos nomes das tabelas do teu SQL (utilizador e info)
      const query = `
        SELECT 
          u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
          i.bio, i.interesses, i.habilidades
        FROM utilizador u
        LEFT JOIN info i ON u.id = i.aluno_id
        WHERE u.id = ?
      `;

      const [rows]: any = await connection.execute(query, [userId]);

      if (rows.length === 0) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });

      return NextResponse.json({
        id: userId,
        ...rows[0],
        telefone: rows[0].telefone || "",
        morada: rows[0].morada || "",
        bio: rows[0].bio || "",
        interesses: rows[0].interesses || "",
        habilidades: rows[0].habilidades || ""
      });
      
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro GET settings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// --- PUT: Atualizar perfil com Cloudinary ---
export async function PUT(req: Request) {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    
    // Captura de todos os campos do formulário
    const nome = (formData.get("nome") as string) || "";
    const email = (formData.get("email") as string) || "";
    const ano_escolar = (formData.get("ano_escolar") as string) || "";
    const curso = (formData.get("curso") as string) || "";
    const telefone = (formData.get("telefone") as string) || "";
    const morada = (formData.get("morada") as string) || "";
    const bio = (formData.get("bio") as string) || "";
    const interesses = (formData.get("interesses") as string) || "";
    const habilidades = (formData.get("habilidades") as string) || "";
    const file = formData.get("avatar") as File | null;

    let imageUrl = null;

    // Lógica de Upload Cloudinary (Sem usar o disco rígido da Vercel)
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadResponse: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "educonnect_avatars" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = uploadResponse.secure_url; // URL HTTPS final
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Atualizar Tabela 'utilizador'
      let queryUser = `UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?`;
      const paramsUser: any[] = [nome, email, ano_escolar, curso, telefone, morada];

      if (imageUrl) {
        queryUser += `, foto_url=?`;
        paramsUser.push(imageUrl);
      }
      queryUser += ` WHERE id=?`;
      paramsUser.push(userId);

      await connection.execute(queryUser, paramsUser);

      // 2. Atualizar ou Inserir na Tabela 'info'
      const [infoRows]: any = await connection.execute("SELECT id FROM info WHERE aluno_id = ?", [userId]);

      if (infoRows.length > 0) {
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualizacao=NOW() WHERE aluno_id=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        await connection.execute(
          "INSERT INTO info (aluno_id, bio, interesses, habilidades, email, data_atualizacao) VALUES (?, ?, ?, ?, ?, NOW())",
          [userId, bio, interesses, habilidades, email]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err) {
      if (connection) await connection.rollback();
      throw err;
    }
  } catch (error) {
    console.error("Erro PUT settings:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}