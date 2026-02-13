import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary"; // <--- Import Cloudinary

// Configuração do Cloudinary (Certifique-se que estas vars estão na Vercel)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  if (!token) return null;

  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e: any) {
    return null;
  }
}

// 2. GET: Buscar dados do utilizador
export async function GET() {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    connection = await pool.getConnection();

    try {
      // AJUSTE: No seu BD Aiven, a coluna chama-se 'id_aluno'
      const query = `
        SELECT 
          u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
          i.bio, i.interesses, i.habilidades
        FROM utilizador u
        LEFT JOIN info i ON u.id = i.id_aluno 
        WHERE u.id = ?
      `;

      const [rows]: any = await connection.execute(query, [userId]);

      if (!rows || rows.length === 0) {
        // Se não achar, tenta buscar pelo menos o user sem o join
        const [userRows]: any = await connection.execute("SELECT * FROM utilizador WHERE id = ?", [userId]);
        if (userRows.length === 0) return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 404 });
        rows[0] = userRows[0]; // Fallback
      }

      const user = rows[0];
      
      return NextResponse.json({
        id: userId,
        nome: user.nome,
        email: user.email,
        ano_escolar: user.ano_escolar,
        curso: user.curso,
        foto_url: user.foto_url,
        telefone: user.telefone || "",
        morada: user.morada || "",
        bio: user.bio || "",
        interesses: user.interesses || "",
        habilidades: user.habilidades || ""
      });
      
    } finally {
      if (connection) connection.release();
    }

  } catch (error) {
    console.error("Erro GET settings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 3. PUT: Atualizar dados (incluindo upload CLOUDINARY)
export async function PUT(req: Request) {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    
    // Helper para evitar strings "null" ou "undefined"
    const getString = (key: string) => {
      const val = formData.get(key);
      return (val && val !== "null" && val !== "undefined") ? val.toString() : null;
    };

    const nome = getString("nome") || "";
    const email = getString("email") || "";
    const ano_escolar = getString("ano_escolar");
    const curso = getString("curso");
    const telefone = getString("telefone");
    const morada = getString("morada");
    const bio = getString("bio");
    const interesses = getString("interesses");
    const habilidades = getString("habilidades");
    const file = formData.get("avatar") as File | null;

    let imageUrl = null;

    // --- Lógica da Imagem (Cloudinary) ---
    if (file && file.size > 0) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const uploadResponse: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "educonnect_avatars" }, // Pasta no Cloudinary
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
        
        imageUrl = uploadResponse.secure_url;
      } catch (uploadError) {
        console.error("Erro Cloudinary:", uploadError);
        return NextResponse.json({ error: "Erro ao enviar imagem" }, { status: 500 });
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Atualizar Tabela UTILIZADOR
      let queryUser = `UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?`;
      const paramsUser: any[] = [nome, email, ano_escolar, curso, telefone, morada];

      if (imageUrl) {
        queryUser += `, foto_url=?`;
        paramsUser.push(imageUrl);
      }
      queryUser += ` WHERE id=?`;
      paramsUser.push(userId);

      await connection.execute(queryUser, paramsUser);

      // 2. Atualizar Tabela INFO
      // IMPORTANTE: Verifica usando id_aluno (padrão Aiven/MySQL Workbench)
      const [infoRows]: any = await connection.execute("SELECT id FROM info WHERE id_aluno = ?", [userId]);

      if (infoRows.length > 0) {
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualização=NOW() WHERE id_aluno=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        // CORREÇÃO CRÍTICA PARA O ERRO 500:
        // O seu banco exige 'id_aluno' E 'aluno_id'. Preenchemos os dois com o userId.
        await connection.execute(
          "INSERT INTO info (id_aluno, aluno_id, bio, interesses, habilidades, email, data_atualização) VALUES (?, ?, ?, ?, ?, ?, NOW())",
          [userId, userId, bio, interesses, habilidades, email]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err: any) {
      await connection.rollback();
      console.error("Erro Transação SQL:", err); // Veja isso nos logs da Vercel
      throw err;
    }

  } catch (error: any) {
    console.error("ERRO CRITICO PUT:", error);
    return NextResponse.json({ error: "Erro ao atualizar", details: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}