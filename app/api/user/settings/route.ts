import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// =========================================================================
// CONFIGURAÇÃO DO CLOUDINARY
// =========================================================================
// Liga o teu backend à tua conta do Cloudinary para onde as fotos vão ser enviadas.
// Os dados estão protegidos no teu ficheiro .env para não ficarem expostos.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Garante que a API não guarda cache (dados desatualizados)
export const dynamic = 'force-dynamic';

// =========================================================================
// FUNÇÃO AUXILIAR: Extrair e Validar o Token
// =========================================================================
// Em vez de repetires o código de verificação do token no GET e no PUT, 
// criaste esta função que vai aos cookies, lê o token e devolve o ID do utilizador.
function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null; // Se não houver token, devolve null (não autorizado)
  
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e) {
    return null; // Se o token for falso ou expirado, devolve null
  }
}

// =========================================================================
// GET: Buscar os dados do Perfil Atual (Para preencher o formulário)
// =========================================================================
export async function GET() {
  let connection;
  try {
    // 1. Verifica quem está a fazer o pedido
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    // 2. Abre a ligação à BD
    connection = await pool.getConnection();
    
    // 3. Junta os dados principais (utilizador) com os detalhes extra (info)
    const query = `
      SELECT u.id, u.nome, u.email, u.ano_escolar, u.curso, u.foto_url, u.telefone, u.morada,
             i.bio, i.interesses, i.habilidades
      FROM utilizador u
      LEFT JOIN info i ON u.id = i.id_aluno 
      WHERE u.id = ?
    `;
    const [rows]: any = await connection.execute(query, [userId]);
    
    // 4. FALLBACK (Plano B)
    // Se por algum motivo o JOIN falhar (ex: utilizador não tem registo na tabela info),
    // vamos buscar apenas os dados básicos para a app não rebentar.
    if (!rows.length) {
       const [u]: any = await connection.execute("SELECT * FROM utilizador WHERE id=?", [userId]);
       if (!u.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
       return NextResponse.json(u[0]);
    }
    
    // Envia os dados completos
    return NextResponse.json(rows[0]);

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar" }, { status: 500 });
  } finally {
    if (connection) connection.release(); // Liberta a ligação
  }
}

// =========================================================================
// PUT: Atualizar o Perfil (Texto + Upload de Imagem)
// =========================================================================
export async function PUT(req: Request) {
  let connection;
  try {
    // 1. Verifica quem está a fazer o pedido
    const userId = getUserIdFromToken();
    if (!userId) return NextResponse.json({ error: "Sessão expirada" }, { status: 401 });

    // 2. Extrair dados do Formulário (FormData permite receber ficheiros + texto ao mesmo tempo)
    const formData = await req.formData();
    
    // Função auxiliar genial para limpar os campos (evita guardar "null" ou "undefined" como texto na BD)
    const v = (key: string) => {
      const val = formData.get(key);
      return (val && val !== "null" && val !== "undefined") ? val.toString().trim() : null;
    };

    // 3. Validação dos Campos
    const validAnos = ['10º', '11º', '12º'];
    let ano_escolar = v("ano_escolar");

    if (!ano_escolar || !validAnos.includes(ano_escolar)) {
        return NextResponse.json({ 
            error: "Por favor, selecione um Ano Escolar válido (10º, 11º ou 12º)." 
        }, { status: 400 });
    }

    // Extrai o resto dos campos
    const nome = v("nome") || "";
    const email = v("email") || "";
    const curso = v("curso");
    const telefone = v("telefone");
    const morada = v("morada");
    const bio = v("bio");
    const interesses = v("interesses");
    const habilidades = v("habilidades");

    // =======================================================
    // 4. UPLOAD DA IMAGEM PARA O CLOUDINARY
    // =======================================================
    const file = formData.get("avatar") as File | null;
    let imageUrl = null;

    // Garante que o ficheiro existe e que não está vazio
    if (file && typeof file === "object" && file.size > 0) {
      try {
        // Converte o ficheiro num formato que o NodeJS consegue ler (Buffer)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Faz o upload diretamente da memória para o Cloudinary (não precisa gravar no disco do servidor)
        const uploadResponse: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "educonnect_avatars" }, // Guarda na pasta certa no teu Cloudinary
            (error, result) => {
              if (error) {
                console.error("Cloudinary Error:", error);
                reject(error);
              } else {
                resolve(result); // Upload concluído com sucesso!
              }
            }
          );
          stream.end(buffer);
        });
        
        // Guarda o link seguro da imagem gerado pelo Cloudinary
        imageUrl = uploadResponse.secure_url;
      } catch (cloudinaryError) {
        console.error("Erro Fatal no Upload da Imagem:", cloudinaryError);
        return NextResponse.json({ error: "Falha ao enviar a imagem para o servidor." }, { status: 500 });
      }
    }

    // =======================================================
    // 5. ATUALIZAR A BASE DE DADOS (USANDO TRANSAÇÕES)
    // =======================================================
    connection = await pool.getConnection();
    
    // INICIA A TRANSAÇÃO: A partir daqui, as alterações ficam "em espera".
    // Só são gravadas definitivamente quando chamarmos o commit().
    await connection.beginTransaction();

    try {
      // 5.1 Atualiza a tabela principal (Utilizador)
      let qUser = "UPDATE utilizador SET nome=?, email=?, ano_escolar=?, curso=?, telefone=?, morada=?";
      const pUser = [nome, email, ano_escolar, curso, telefone, morada];
      
      // Se houve upload de imagem nova, adiciona-a à query!
      if (imageUrl) {
        qUser += ", foto_url=?";
        pUser.push(imageUrl);
      }
      qUser += " WHERE id=?";
      pUser.push(userId);
      
      await connection.execute(qUser, pUser);

      // 5.2 Verifica se já existem detalhes extra deste utilizador na tabela 'info'
      const [exists]: any = await connection.execute("SELECT id FROM info WHERE id_aluno = ?", [userId]);
      
      if (exists.length > 0) {
        // Se existir, atualiza (UPDATE)
        await connection.execute(
          "UPDATE info SET bio=?, interesses=?, habilidades=?, data_atualização=NOW() WHERE id_aluno=?",
          [bio, interesses, habilidades, userId]
        );
      } else {
        // Se não existir, cria um novo registo (INSERT)
        await connection.execute(
          `INSERT INTO info (id_aluno, aluno_id, bio, interesses, habilidades, data_atualização) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [userId, userId, bio, interesses, habilidades]
        );
      }

      // GRAVA TUDO! Se o código chegou até aqui sem erros, confirmamos a transação.
      await connection.commit();
      
      // Devolve a nova foto para o Frontend atualizar logo o ecrã sem precisar dar refresh à página
      return NextResponse.json({ success: true, newAvatar: imageUrl });

    } catch (err: any) {
      // SE DEU ERRO A MEIO, CANCELA TUDO! Desfaz as alterações feitas no utilizador.
      await connection.rollback();
      console.error("ERRO SQL:", err); 
      throw err; // Repassa o erro para o catch principal tratar da resposta HTTP
    }

  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return NextResponse.json({ error: "Erro ao salvar", details: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release(); // Não esquecer de libertar a ligação!
  }
}