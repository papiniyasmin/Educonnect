import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// =========================================================================
// CONFIGURAÇÃO DO CLOUDINARY
// =========================================================================
// O Cloudinary é o serviço externo onde vamos guardar as fotos de perfil.
// Em vez de encher o nosso servidor com imagens, mandamos para lá e guardamos apenas o Link na BD.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Impede o Next.js de guardar as respostas antigas em cache
export const dynamic = 'force-dynamic';

// =========================================================================
// FUNÇÃO AUXILIAR: Extrair ID do Token
// =========================================================================
// Lê o "cartão de cidadão" digital do utilizador (o token guardado nos cookies)
// para sabermos quem é a pessoa que está a tentar ver ou editar o perfil.
function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e) {
    return null; // Se o token for falso, caducado ou inválido
  }
}

// =========================================================================
// GET: Buscar Dados Atuais do Utilizador
// =========================================================================
export async function GET() {
  let connection;
  try {
    // 1. Quem está a pedir os dados?
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    connection = await pool.getConnection();
    
    // 2. Busca os dados principais e os dados secundários (tabela info) de uma só vez usando LEFT JOIN
    const query = `
      SELECT u.id, u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
             i.bio, i.interesses, i.habilidades
      FROM utilizador u
      LEFT JOIN info i ON u.id = i.id_aluno 
      WHERE u.id = ?
    `;
    const [rows]: any = await connection.execute(query, [userId]);
    
    // 3. Fallback: Se não encontrou dados com o JOIN (ex: utilizador não tem linha na tabela 'info')
    if (!rows.length) {
       // Tenta buscar pelo menos os dados básicos da tabela 'utilizador'
       const [u]: any = await connection.execute("SELECT * FROM utilizador WHERE id=?", [userId]);
       if (!u.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
       return NextResponse.json(u[0]);
    }
    
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  } finally {
    if (connection) connection.release(); // Liberta sempre a ligação para a BD não encravar
  }
}

// =========================================================================
// PUT: Atualizar o Perfil do Utilizador
// =========================================================================
export async function PUT(req: Request) {
  let connection;
  try {
    // 1. Quem está a tentar alterar o perfil?
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    // 2. Receber os dados do formulário (que podem incluir ficheiros e texto)
    const formData = await req.formData();
    
    // Função limpa-campos: Se o campo vier com a palavra "null" ou vazio, devolve NULL a sério
    const v = (key: string) => {
      const val = formData.get(key);
      return (val && val !== "null" && val !== "undefined") ? val.toString().trim() : null;
    };

    // 3. Validações Essenciais
    const validAnos = ['10º', '11º', '12º'];
    let ano_escolar = v("ano_escolar");

    // Obriga o ano escolar a ser um dos três valores permitidos
    if (!ano_escolar || !validAnos.includes(ano_escolar)) {
        return NextResponse.json({ 
            error: "Por favor, selecione um Ano Escolar válido (10º, 11º ou 12º)." 
        }, { status: 400 });
    }

    // Lê os restantes campos de texto
    const nome = v("nome") || "";
    const email = v("email") || "";
    const curso = v("curso");
    const telefone = v("telefone");
    const morada = v("morada");
    const bio = v("bio");
    const interesses = v("interesses");
    const habilidades = v("habilidades");

    // ==========================================
    // 4. UPLOAD DA IMAGEM PARA O CLOUDINARY
    // ==========================================
    const file = formData.get("avatar") as File | null;
    let imageUrl = null;

    // Se o utilizador enviou mesmo um ficheiro (não é só texto)
    if (file && typeof file === "object" && file.size > 0) {
      try {
        console.log("Iniciando upload para o Cloudinary...");
        // Transforma o ficheiro num formato que a internet consiga enviar em tempo real
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Faz o envio (stream)
        const uploadResponse: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "educonnect_avatars" }, // Guarda nesta pastinha lá no Cloudinary
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(buffer);
        });
        
        // Sucesso! Temos o link da nova foto de perfil
        imageUrl = uploadResponse.secure_url;
        console.log("Upload feito com sucesso! URL:", imageUrl);
      } catch (cloudErr) {
        console.error("ERRO NO CLOUDINARY:", cloudErr);
        return NextResponse.json({ error: "Falha ao enviar imagem." }, { status: 500 });
      }
    }

    // ==========================================
    // 5. ATUALIZAR AS TABELAS DA BASE DE DADOS
    // ==========================================
    connection = await pool.getConnection();
    
    // MARCO ZERO: A partir de agora, as alterações ficam em espera. 
    // Isto garante que ou atualizamos TUDO, ou cancelamos tudo se der erro a meio.
    await connection.beginTransaction();

    try {
      // 5.1 Preparar a atualização da tabela 'utilizador'
      let qUser = "UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?";
      const pUser = [nome, email, ano_escolar, curso, telefone, morada];
      
      // Se a pessoa enviou uma foto nova, atualizamos também o URL da foto
      if (imageUrl) {
        qUser += ", foto_url=?";
        pUser.push(imageUrl);
      }
      qUser += " WHERE id=?"; // Só atualizamos o utilizador que está logado
      pUser.push(userId);
      
      await connection.execute(qUser, pUser);

      // 5.2 Lidar com a tabela de detalhes 'info'
      const [exists]: any = await connection.execute("SELECT id FROM info WHERE id_aluno = ?", [userId]);
      
      if (exists.length > 0) {
        // Se a pessoa já tinha detalhes antes, atualizamos
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualização=NOW() WHERE id_aluno=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        // ❌ CORREÇÃO CRÍTICA: Se for a primeira vez que a pessoa preenche os detalhes, criamos uma linha nova!
        await connection.execute(
          `INSERT INTO info (id_aluno, aluno_id, bio, interesses, habilidades, data_atualização) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [userId, userId, bio, interesses, habilidades]
        );
      }

      // SUCESSO! Grava as alterações feitas nas duas tabelas definitivamente.
      await connection.commit();
      
      // Devolve o link da nova imagem para o React atualizar a bolinha do perfil na hora
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err: any) {
      // DEU ERRO NUMA DAS TABELAS? Apaga tudo o que tentámos fazer nesta transação.
      await connection.rollback();
      console.error("ERRO SQL AO SALVAR DADOS:", err); 
      throw err;
    }

  } catch (error: any) {
    console.error("ERRO GERAL NO PUT:", error);
    return NextResponse.json({ error: "Erro ao salvar", details: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release(); // Liberta a ligação (mesmo se tiver dado erro)
  }
}