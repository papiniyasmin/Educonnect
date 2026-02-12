import { NextResponse } from "next/server";
import  pool  from "@/db"; // <--- AJUSTADO PARA O TEU FICHEIRO
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';

function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  // DIAGNÓSTICO 1: O cookie chega ao servidor?
  if (!token) {
    console.log("❌ ERRO: O cookie 'token' não foi encontrado no servidor.");
    return null;
  }

  try {
    // TEM QUE SER IGUAL AO LOGIN (Verifica se não há espaços extra)
    const secret = "EDUCONNECT_SECRET_2024"; 
    
    const decoded: any = jwt.verify(token.value, secret);
    
    // DIAGNÓSTICO 2: Sucesso
    console.log("✅ SUCESSO: Token válido. ID do utilizador:", decoded.id);
    return decoded.id;

  } catch (e: any) {
    // DIAGNÓSTICO 3: O token existe mas é inválido
    console.error("❌ ERRO DE VALIDAÇÃO:", e.message);
    
    if (e.message === "invalid signature") {
      console.error("⚠️ PISTA: A chave secreta no Login e aqui são diferentes!");
    }
    
    return null;
  }
}

// 2. GET: Buscar dados do utilizador
export async function GET() {
  try {
    const userId = getUserIdFromToken();
    
    // Se não tiver token, retorna 401 (Frontend deve redirecionar para login)
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const connection = await pool.getConnection();

    try {
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

      const user = rows[0];
      
      // Retorna os dados limpos
      return NextResponse.json({
        id: userId, // Importante retornar o ID também
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
      connection.release();
    }

  } catch (error) {
    console.error("Erro GET settings:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// 3. PUT: Atualizar dados (incluindo upload de imagem)
export async function PUT(req: Request) {
  let connection;
  try {
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const formData = await req.formData();
    
    // Ler os campos do formulário (com verificação de nulos)
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

    // Lógica da Imagem (Upload Local)
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      // Limpa o nome do ficheiro para evitar erros
      const ext = path.extname(file.name);
      const filename = `u${userId}-${Date.now()}${ext}`; 
      
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      
      imageUrl = `/uploads/avatars/${filename}`;
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Atualizar Tabela UTILIZADOR
      let queryUser = `UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?`;
      const paramsUser: any[] = [nome, email, ano_escolar, curso, telefone, morada];

      if (imageUrl) {
        queryUser += `, foto_url=?`;
        paramsUser.push(imageUrl);
      }
      queryUser += ` WHERE id=?`;
      paramsUser.push(userId);

      await connection.execute(queryUser, paramsUser);

      // Atualizar Tabela INFO (Verifica se já existe registo)
      const [infoRows]: any = await connection.execute("SELECT id FROM info WHERE aluno_id = ?", [userId]);

      if (infoRows.length > 0) {
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualização=NOW() WHERE aluno_id=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        // Se não existir na tabela info, cria agora
        await connection.execute(
          "INSERT INTO info (aluno_id, bio, interesses, habilidades, email, data_atualização) VALUES (?, ?, ?, ?, ?, NOW())",
          [userId, bio, interesses, habilidades, email]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err) {
      await connection.rollback();
      throw err;
    }

  } catch (error) {
    console.error("Erro PUT settings:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}