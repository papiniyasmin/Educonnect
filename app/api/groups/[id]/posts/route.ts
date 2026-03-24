import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/db"; // A ligação à tua base de dados
import { writeFile, mkdir } from "fs/promises"; // Para criar pastas e guardar ficheiros localmente
import path from "path"; // Para lidar com caminhos de pastas de forma segura

const SECRET = "EDUCONNECT_SECRET_2024";

// =========================================================================
// GET: BUSCAR TODOS OS POSTS DE UM GRUPO
// =========================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    if (!groupId) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    
    // ---------------------------------------------------------
    // 1. DESCOBRIR QUEM ESTÁ A VER A PÁGINA
    // ---------------------------------------------------------
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    let loggedInUserId = 0; // Assume-se 0 (não logado) por defeito

    if (token) {
      try {
        const decoded = jwt.verify(token.value, SECRET) as { id: number };
        loggedInUserId = decoded.id; // Sucesso, sabemos quem é!
      } catch (e) {
        // Se o token estiver caducado, ignoramos e a pessoa fica como "visitante" (id = 0)
      } 
    }

    // ---------------------------------------------------------
    // 2. BUSCAR AS MENSAGENS DE UM GRUPO
    // ---------------------------------------------------------
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
      ORDER BY msg.data DESC -- Mostra os mais recentes primeiro (estilo Feed)
    `;

    const [rows]: any = await pool.query(query, [groupId]);

    // ---------------------------------------------------------
    // 3. PROCESSAR OS DADOS ANTES DE ENVIAR
    // ---------------------------------------------------------
    const posts = rows.map((row: any) => {
      let textoFinal = row.conteudo;
      let listaComentarios = [];
      let imagemUrl = null;

      try {
        // Como o conteúdo na BD foi guardado em formato JSON, temos de o "desempacotar"
        const jsonConteudo = JSON.parse(row.conteudo);
        if (jsonConteudo.texto_principal) textoFinal = jsonConteudo.texto_principal;
        if (jsonConteudo.comentarios) listaComentarios = jsonConteudo.comentarios;
        if (jsonConteudo.imagem_url) imagemUrl = jsonConteudo.imagem_url;
      } catch (e) {
        // Se por acaso a BD tiver um texto antigo que não seja JSON, cai aqui para não dar erro
        textoFinal = row.conteudo; 
      }

      // Constrói o objeto "limpinho" que o Frontend (React) está à espera de receber
      return {
        id: row.id,
        title: row.titulo || "", 
        content: textoFinal,
        image: imagemUrl,
        comentarios: listaComentarios,
        timestamp: new Date(row.data).toISOString(), // Formata a data para padrão universal
        type: row.tipo || 'geral',
        authorName: row.authorName,
        authorAvatar: row.authorAvatar,
        isOwner: row.authorId === loggedInUserId // MÁGICA: O React saberá logo se deve mostrar o ícone de "Apagar post"
      };
    });

    return NextResponse.json(posts, { status: 200 });

  } catch (error) {
    console.error("Erro no GET /posts:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// =========================================================================
// POST: CRIAR UMA NOVA PUBLICAÇÃO 
// =========================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    
    // ---------------------------------------------------------
    // 1. VERIFICAR AUTENTICAÇÃO
    // ---------------------------------------------------------
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

    // ---------------------------------------------------------
    // 2. SEGURANÇA: SÓ MEMBROS PODEM PUBLICAR
    // ---------------------------------------------------------
    const [membros]: any = await pool.query(
      "SELECT id FROM membro WHERE grupo_id = ? AND remetente_id = ?",
      [groupId, userId]
    );

    // Se o array de membros vier vazio, é porque é um intruso a tentar publicar!
    if (membros.length === 0) {
      return NextResponse.json({ error: "Apenas membros podem publicar." }, { status: 403 });
    }

    // Apanhamos o ID dele *enquanto membro deste grupo específico*
    const membroId = membros[0].id;

    // ---------------------------------------------------------
    // 3. RECEBER OS DADOS DO POST
    // ---------------------------------------------------------
    // O Frontend tem de enviar um FormData porque os posts podem ter Ficheiros (imagens)
    const formData = await request.formData();
    const content = formData.get("content") as string || "";
    const type = formData.get("type") as string || "geral";
    const image = formData.get("image") as File | null;

    // Não permitimos posts vazios (tem de ter texto OU imagem)
    if (!content.trim() && !image) {
      return NextResponse.json({ error: "A publicação não pode estar vazia" }, { status: 400 });
    }

    let imageUrl = null;

    // ---------------------------------------------------------
    // 4. UPLOAD DA IMAGEM PARA O DISCO LOCAL
    // ---------------------------------------------------------
    if (image && image.name) {
      // Converte o ficheiro num formato legível (Buffer)
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Criar um nome único e seguro para não substituir ficheiros com o mesmo nome (ex: "foto.jpg")
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9); // Ex: 1698765432-12345
      const safeFilename = image.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // Substitui espaços e símbolos estranhos por '_'
      const filename = `${uniqueSuffix}-${safeFilename}`; 
      
      // Define a pasta onde vai ser guardado (public/uploads/groups)
      const uploadDir = path.join(process.cwd(), "public/uploads/groups");
      // Cria a pasta automaticamente se ela ainda não existir no teu projeto!
      await mkdir(uploadDir, { recursive: true });
      
      // Grava efetivamente o ficheiro no disco do teu computador/servidor
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      
      // Este é o URL público que o React vai usar na tag <img src="..." />
      imageUrl = `/uploads/groups/${filename}`;
    }

    // ---------------------------------------------------------
    // 5. EMPACOTAR OS DADOS EM JSON
    // ---------------------------------------------------------

    const jsonConteudo = JSON.stringify({
      texto_principal: content,
      comentarios: [], // Nasce vazio, os membros vão comentar depois
      imagem_url: imageUrl
    });

    // ---------------------------------------------------------
    // 6. INSERIR NA BASE DE DADOS
    // ---------------------------------------------------------
    const [msgResult]: any = await pool.query(
      "INSERT INTO mensagem (titulo, conteudo, tipo, data) VALUES (?, ?, ?, NOW())",
      ["", jsonConteudo, type]
    );
    
    // O MySQL devolve-nos o ID automático que gerou para esta nova mensagem
    const mensagemId = msgResult.insertId;

    // Por fim, ligamos essa nova mensagem ao grupo e ao membro que a criou
    await pool.query(
      "INSERT INTO mensagem_grupo (mensagem_id, remetente_id) VALUES (?, ?)",
      [mensagemId, membroId]
    );

    // Sucesso total! Devolvemos os dados para o Frontend atualizar a página imediatamente
    return NextResponse.json({ success: true, messageId: mensagemId, imageUrl }, { status: 201 });

  } catch (error) {
    console.error("Erro no POST /posts:", error);
    return NextResponse.json({ error: "Erro ao publicar" }, { status: 500 });
  }
}