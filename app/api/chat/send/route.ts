import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { ResultSetHeader } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

export async function POST(req: NextRequest) {
  // 1. Identificar quem está a enviar DE VERDADE
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // Validamos se existe conteúdo e destinatário. 
  // O senderId do body é IGNORADO por segurança.
  if (!body.receiverId || !body.content) {
    return NextResponse.json({ error: "Campos inválidos" }, { status: 400 });
  }

  try {
    // 1. Inserir o CONTEÚDO na tabela 'mensagem'
    const [msgResult] = await pool.query<ResultSetHeader>(
      `INSERT INTO mensagem (conteudo, data, titulo, tipo)
       VALUES (?, NOW(), ?, ?)`,
      [
        body.content, 
        'Mensagem Privada', 
        'experiencia'
      ]
    );

    const novaMensagemId = msgResult.insertId;

    // 2. Inserir a RELAÇÃO usando o userId seguro (token)
    await pool.query(
      `INSERT INTO mensagem_particular (remetente_id, destinatario_id, mensagem_id)
       VALUES (?, ?, ?)`,
      [userId, body.receiverId, novaMensagemId] // <--- userId aqui!
    );

    return NextResponse.json({
      id: novaMensagemId,
      senderId: userId, // Retorna o ID real
      receiverId: body.receiverId,
      content: body.content,
      timestamp: new Date(),
      isRead: false,
    });

  } catch (err: any) {
    console.error("Erro ao enviar mensagem:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}