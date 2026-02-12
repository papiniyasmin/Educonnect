import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

// GET: Buscar mensagens do grupo
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(); // <--- ID SEGURO
  const groupId = params.id;

  if (!userId) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        m.id,
        m.conteudo,
        m.data AS timestamp,
        u.id AS senderId,
        u.nome AS senderName,
        u.foto_url AS senderAvatar
       FROM mensagem m
       INNER JOIN mensagem_grupo mg ON m.id = mg.mensagem_id
       INNER JOIN membro mb ON mg.remetente_id = mb.id 
       INNER JOIN utilizador u ON mb.remetente_id = u.id 
       WHERE mb.grupo_id = ?
       ORDER BY m.data ASC`,
      [groupId]
    );

    return NextResponse.json({ messages: rows });
  } catch (err: any) {
    console.error("Erro GET mensagens grupo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Enviar mensagem para o grupo
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(); // <--- ID SEGURO
  const groupId = params.id;
  const { content } = await req.json();

  if (!userId || !content) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  try {
    // PASSO 1: Descobrir o ID DO MEMBRO deste utilizador neste grupo
    const [membroRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM membro 
       WHERE grupo_id = ? AND remetente_id = ?`, 
      [groupId, userId]
    );

    const membro = membroRows[0];

    if (!membro) {
      return NextResponse.json(
        { error: "Não és membro deste grupo." }, 
        { status: 403 }
      );
    }

    // PASSO 2: Inserir a mensagem
    const [msgResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO mensagem (conteudo, data, titulo, tipo)
       VALUES (?, NOW(), 'Chat Grupo', 'experiencia')`,
      [content]
    );

    const novaMensagemId = msgResult.insertId;

    // PASSO 3: Ligar a mensagem ao membro
    await pool.query(
      `INSERT INTO mensagem_grupo (mensagem_id, remetente_id)
       VALUES (?, ?)`,
      [novaMensagemId, membro.id]
    );

    return NextResponse.json({ success: true, messageId: novaMensagemId });
  } catch (err: any) {
    console.error("Erro POST mensagem grupo:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}