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

// Função para extrair ID do utilizador
function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null;

  try {
    const secret = "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e) {
    console.error("❌ Erro JWT:", e);
    return null;
  }
}

// --- GET: Carregar dados ---
export async function GET() {
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
               i.bio, i.interesses, i.habilidades
        FROM utilizador u
        LEFT JOIN info i ON u.id = i.aluno_id
        WHERE u.id = ?
      `;
      const [rows]: any = await connection.execute(query, [userId]);
      return NextResponse.json(rows[0] || {});
    } finally {
      connection.release();
    }
  } catch (error) {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// --- PUT: Atualizar Perfil ---
export async function PUT(req: Request) {
  let connection;
  try {
    const userId = getUserIdFromToken();
    console.log(">>> [DEBUG] Tentativa de update para o user ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });
    }

    const formData = await req.formData();
    const nome = formData.get("nome") as string;
    const email = formData.get("email") as string;
    const ano_escolar = formData.get("ano_escolar") as string;
    const curso = formData.get("curso") as string;
    const telefone = formData.get("telefone") as string;
    const morada = formData.get("morada") as string;
    const bio = formData.get("bio") as string;
    const interesses = formData.get("interesses") as string;
    const habilidades = formData.get("habilidades") as string;
    const file = formData.get("avatar") as File | null;

    let imageUrl = null;

    // 2. Upload para Cloudinary
    if (file && file.size > 0) {
      console.log(">>> [DEBUG] Ficheiro detetado, a iniciar upload para Cloudinary...");
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResponse: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "educonnect_avatars" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });

        imageUrl = uploadResponse.secure_url;
        console.log("✅ [DEBUG] Upload feito com sucesso:", imageUrl);
      } catch (cloudErr: any) {
        console.error("❌ [ERROR] Erro no Cloudinary:", cloudErr.message || cloudErr);
        return NextResponse.json({ error: "Falha no Cloudinary", details: cloudErr.message }, { status: 500 });
      }
    }

    // 3. Base de Dados
    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      console.log(">>> [DEBUG] A iniciar queries no MySQL...");

      // Update Utilizador
      let queryUser = "UPDATE `utilizador` SET `nome`=?, `email`=?, `ano_escolar`=?, `curso`=?, `telefone`=?, `morada`=?";
      const paramsUser = [nome, email, ano_escolar, curso, telefone, morada];

      if (imageUrl) {
        queryUser += ", `foto_url`=?";
        paramsUser.push(imageUrl);
      }
      queryUser += " WHERE `id`=?";
      paramsUser.push(userId);

      await connection.execute(queryUser, paramsUser);

      // Update ou Insert na tabela info
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
      console.log("✅ [DEBUG] Transação concluída no MySQL.");
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (dbErr: any) {
      if (connection) await connection.rollback();
      console.error("❌ [ERROR] Erro no MySQL:", dbErr.message);
      return NextResponse.json({ error: "Erro na BD", details: dbErr.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("❌ [ERROR] Erro Geral:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}