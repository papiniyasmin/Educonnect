import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getUserId } from "@/lib/auth";

// ==========================================
// 1. GET: LER AS MENSAGENS E MOSTRAR NO CHAT
// ==========================================
export async function GET(req: NextRequest) {
  const userId = getUserId(); 
  if (!userId) return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!id || !type) return NextResponse.json({ error: "Parâmetros em falta" }, { status: 400 });

  try {
    let query = "";
    let params: any[] = [];

    if (type === "group") {
      query = `
        SELECT m.id, m.conteudo, m.data AS timestamp, u.nome AS senderName, u.id AS senderId, u.foto_url AS senderAvatar
        FROM mensagem_grupo mg 
        JOIN mensagem m ON mg.mensagem_id = m.id 
        JOIN membro mem ON mg.remetente_id = mem.id 
        JOIN utilizador u ON mem.remetente_id = u.id 
        WHERE mem.grupo_id = ? ORDER BY m.data ASC
      `;
      params = [id];
    } else {
      query = `
        SELECT m.id, m.conteudo, m.data AS timestamp, u.nome AS senderName, mp.remetente_id AS senderId, u.foto_url AS senderAvatar
        FROM mensagem_particular mp 
        JOIN mensagem m ON mp.mensagem_id = m.id 
        JOIN utilizador u ON mp.remetente_id = u.id 
        WHERE (mp.remetente_id = ? AND mp.destinatario_id = ?) 
           OR (mp.remetente_id = ? AND mp.destinatario_id = ?) 
        ORDER BY m.data ASC
      `;
      params = [userId, id, id, userId];
    }

    const [rows] = await pool.query<RowDataPacket[]>(query, params);
    return NextResponse.json({ messages: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// 2. POST: GUARDAR A NOVA MENSAGEM NA BD
// ==========================================
export async function POST(req: NextRequest) {
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // Verifica targetId, content e type que vêm do frontend
  if (!body.targetId || !body.content || !body.type) {
    return NextResponse.json({ error: "Campos inválidos" }, { status: 400 });
  }

  try {
    // TRUQUE PARA A BD NÃO DAR ERRO: Usar 'experiencia' e um título automático
    const tituloMsg = body.type === 'group' ? 'Mensagem de Grupo' : 'Mensagem Privada';

    const [msgResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO mensagem (conteudo, data, titulo, tipo) VALUES (?, NOW(), ?, ?)`,
      [body.content, tituloMsg, 'experiencia']
    );

    const novaMensagemId = msgResult.insertId;

    if (body.type === 'group') {
      
      // Buscar o ID de membro (Na tua BD a coluna utilizador chama-se remetente_id na tabela membro)
      const [membros] = await pool.query<RowDataPacket[]>(
        `SELECT id FROM membro WHERE remetente_id = ? AND grupo_id = ? LIMIT 1`,
        [userId, body.targetId]
      );

      if (membros.length > 0) {
        await pool.query(
          `INSERT INTO mensagem_grupo (remetente_id, mensagem_id) VALUES (?, ?)`,
          [membros[0].id, novaMensagemId]
        );
      } else {
        return NextResponse.json({ error: "Não és membro deste grupo" }, { status: 403 });
      }

    } else {
      
      // MENSAGEM PARTICULAR
      await pool.query(
        `INSERT INTO mensagem_particular (remetente_id, destinatario_id, mensagem_id) VALUES (?, ?, ?)`,
        [userId, body.targetId, novaMensagemId]
      );
      
    }

    return NextResponse.json({
      id: novaMensagemId,
      success: true
    });

  } catch (err: any) {
    console.error("Erro ao enviar mensagem:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}