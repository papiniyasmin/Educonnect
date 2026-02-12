import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

// GET: Busca mensagens
export async function GET(req: NextRequest) {
  const userId = getUserId(); // <--- ID SEGURO
  
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
        SELECT 
          m.id, 
          m.conteudo, 
          m.data AS timestamp, 
          u.nome AS senderName, 
          u.id AS senderId, 
          u.foto_url AS senderAvatar
        FROM mensagem_grupo mg 
        JOIN mensagem m ON mg.mensagem_id = m.id 
        JOIN membro mem ON mg.remetente_id = mem.id 
        JOIN utilizador u ON mem.remetente_id = u.id 
        WHERE mem.grupo_id = ? 
        ORDER BY m.data ASC
      `;
      params = [id];

    } else {
      query = `
        SELECT 
          m.id, 
          m.conteudo, 
          m.data AS timestamp, 
          u.nome AS senderName, 
          mp.remetente_id AS senderId, 
          u.foto_url AS senderAvatar
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
    console.error("Erro ao buscar mensagens:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Envia mensagem (Versão completa)
export async function POST(req: NextRequest) {
  const userId = getUserId(); // <--- ID SEGURO
  
  if (!userId) return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });

  const body = await req.json();
  const { type, targetId, content } = body; 

  if (!content || !targetId || !type) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const [msgResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO mensagem (conteudo, data, tipo) VALUES (?, NOW(), ?)`,
      [content, type === 'group' ? 'grupo' : 'particular']
    );
    const msgId = msgResult.insertId;

    if (type === "group") {
      const [membroRows] = await connection.query<RowDataPacket[]>(
        "SELECT id FROM membro WHERE remetente_id = ? AND grupo_id = ?",
        [userId, targetId]
      );

      if (membroRows.length === 0) {
        throw new Error("Usuário não é membro deste grupo");
      }

      const membroId = membroRows[0].id;

      await connection.query(
        "INSERT INTO mensagem_grupo (remetente_id, mensagem_id) VALUES (?, ?)",
        [membroId, msgId]
      );

    } else {
      await connection.query(
        "INSERT INTO mensagem_particular (remetente_id, destinatario_id, mensagem_id) VALUES (?, ?, ?)",
        [userId, targetId, msgId]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, id: msgId });

  } catch (err: any) {
    await connection.rollback();
    console.error("Erro ao enviar:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    connection.release();
  }
}