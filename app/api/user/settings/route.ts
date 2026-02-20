import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

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
  } catch (e) {
    return null;
  }
}

// GET: CORRIGIDO! Agora pede o "u.id" logo no início do SELECT
export async function GET() {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    connection = await pool.getConnection();
    const query = `
      SELECT u.id, u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
             i.bio, i.interesses, i.habilidades
      FROM utilizador u
      LEFT JOIN info i ON u.id = i.id_aluno 
      WHERE u.id = ?
    `;
    const [rows]: any = await connection.execute(query, [userId]);
    
    // Fallback se não tiver info
    if (!rows.length) {
       const [u]: any = await connection.execute("SELECT * FROM utilizador WHERE id=?", [userId]);
       if (!u.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
       return NextResponse.json(u[0]);
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT: MANTIDO EXATAMENTE IGUAL AO TEU
export async function PUT(req: Request) {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    const formData = await req.formData();
    const v = (key: string) => {
      const val = formData.get(key);
      return (val && val !== "null" && val !== "undefined") ? val.toString().trim() : null;
    };

    // 1. Validação dos Campos Obrigatórios (ENUM)
    const validAnos = ['10º', '11º', '12º'];
    let ano_escolar = v("ano_escolar");

    // Se o ano não for válido, forçamos NULL ou lançamos erro amigável
    if (!ano_escolar || !validAnos.includes(ano_escolar)) {
        return NextResponse.json({ 
            error: "Por favor, selecione um Ano Escolar válido (10º, 11º ou 12º)." 
        }, { status: 400 });
    }

    const nome = v("nome") || "";
    const email = v("email") || "";
    const curso = v("curso");
    const telefone = v("telefone");
    const morada = v("morada");
    
    const bio = v("bio");
    const interesses = v("interesses");
    const habilidades = v("habilidades");

    // Upload Imagem
    const file = formData.get("avatar") as File | null;
    let imageUrl = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const uploadResponse: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "educonnect_avatars" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
      });
      imageUrl = uploadResponse.secure_url;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {

      let qUser = "UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?";
      const pUser = [nome, email, ano_escolar, curso, telefone, morada];
      
      if (imageUrl) {
        qUser += ", foto_url=?";
        pUser.push(imageUrl);
      }
      qUser += " WHERE id=?";
      pUser.push(userId);
      
      await connection.execute(qUser, pUser);

      const [exists]: any = await connection.execute("SELECT id FROM info WHERE id_aluno = ?", [userId]);
      
      if (exists.length > 0) {
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualização=NOW() WHERE id_aluno=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        
        await connection.execute(
          `INSERT INTO info (id_aluno, aluno_id, bio, interesses, habilidades, email, data_atualização) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [userId, userId, bio, interesses, habilidades, email]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err: any) {
      await connection.rollback();
      console.error("ERRO SQL:", err); 
      throw err;
    }

  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao salvar", details: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}