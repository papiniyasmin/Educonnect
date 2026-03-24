import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/db";
import { unlink, writeFile, mkdir } from "fs/promises";
import path from "path";

const SECRET = "EDUCONNECT_SECRET_2024";

// =========================================================================
// FUNÇÃO AUXILIAR: Descobrir quem é o autor da publicação e de que tipo é
// =========================================================================
async function findMessageOwner(postId: string) {
  const [geral]: any = await pool.query(
    "SELECT remetente_id, 'geral' as tipo FROM mensagem_geral WHERE mensagem_id = ?",
    [postId]
  );
  if (geral.length > 0) return geral[0];


  const [grupo]: any = await pool.query(
    `SELECT mem.remetente_id, 'grupo' as tipo 
     FROM mensagem_grupo mg 
     JOIN membro mem ON mg.remetente_id = mem.id 
     WHERE mg.mensagem_id = ?`,
    [postId]
  );
  if (grupo.length > 0) return grupo[0];

  return null;
}

// =========================================================================
// PUT: Editar uma publicação existente (Texto e/ou Imagem)
// =========================================================================
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    
    // --- VERIFICAÇÃO DE SEGURANÇA (AUTENTICAÇÃO) ---
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const decoded = jwt.verify(token.value, SECRET) as { id: number };

    // --- VERIFICAÇÃO DE PERMISSÕES (É O DONO?) ---
    const ownerInfo = await findMessageOwner(postId);
    if (!ownerInfo) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    // Se o ID do token for diferente do ID de quem criou o post, bloqueia a edição!
    if (ownerInfo.remetente_id !== decoded.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // --- RECEBER OS NOVOS DADOS DO FRONTEND ---
    const formData = await request.formData();
    const newText = formData.get("content") as string;
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true"; 

    // --- LER O CONTEÚDO ATUAL DA BASE DE DADOS ---
    const [msgRow]: any = await pool.query("SELECT conteudo FROM mensagem WHERE id = ?", [postId]);
    let conteudoObj = JSON.parse(msgRow[0].conteudo);
    conteudoObj.texto = newText; 

    // --- LÓGICA DAS IMAGENS (LOCAL FILE SYSTEM) ---
    if (removeImage || (imageFile && imageFile.size > 0)) {
      if (conteudoObj.imagem_url) {
        const oldPath = path.join(process.cwd(), "public", conteudoObj.imagem_url);
        await unlink(oldPath).catch(() => {});
        conteudoObj.imagem_url = null;
      }
    }

    // Se enviou uma imagem nova, guardo na pasta public/uploads
    if (imageFile && imageFile.size > 0) {
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${Date.now()}-${imageFile.name.replace(/\s+/g, '_')}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer); 
      conteudoObj.imagem_url = `/uploads/${filename}`; 
    }

    await pool.query("UPDATE mensagem SET conteudo = ? WHERE id = ?", [JSON.stringify(conteudoObj), postId]);

    return NextResponse.json({ success: true, updatedImage: conteudoObj.imagem_url });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// =========================================================================
// DELETE: Apagar uma publicação
// =========================================================================
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const postId = params.id;
    
    // --- SEGURANÇA E PERMISSÕES ---
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const decoded = jwt.verify(token.value, SECRET) as { id: number };

    const ownerInfo = await findMessageOwner(postId);
    if (!ownerInfo) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
    if (ownerInfo.remetente_id !== decoded.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // --- APAGAR IMAGEM DO DISCO ---
    const [msgRow]: any = await pool.query("SELECT conteudo FROM mensagem WHERE id = ?", [postId]);
    const conteudo = JSON.parse(msgRow[0].conteudo);
    if (conteudo.imagem_url) {
      // Se o post tinha foto, vai à pasta public/uploads e elimina-a para não ocupar espaço
      await unlink(path.join(process.cwd(), "public", conteudo.imagem_url)).catch(() => {});
    }

    // --- APAGAR REGISTOS DA BASE DE DADOS ---
    if (ownerInfo.tipo === 'geral') {
      await pool.query("DELETE FROM mensagem_geral WHERE mensagem_id = ?", [postId]);
    } else {
      await pool.query("DELETE FROM mensagem_grupo WHERE mensagem_id = ?", [postId]);
    }

    await pool.query("DELETE FROM mensagem WHERE id = ?", [postId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao eliminar" }, { status: 500 });
  }
}