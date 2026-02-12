import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db"; // IMPORTAÇÃO CORRETA

interface SendMessageBody {
  senderId: number;
  receiverId: number;
  content: string;
}

export async function POST(req: NextRequest) {
  const body: SendMessageBody = await req.json();

  if (!body.senderId || !body.receiverId || !body.content) {
    return NextResponse.json({ error: "Campos inválidos" }, { status: 400 });
  }

  try {
    const [result]: any = await pool.execute(
      `INSERT INTO Mensagem (remetente_id, destinatario_id, conteudo)
       VALUES (?, ?, ?)`,
      [body.senderId, body.receiverId, body.content]
    );

    return NextResponse.json({
      id: result.insertId,
      senderId: body.senderId,
      receiverId: body.receiverId,
      content: body.content,
      timestamp: new Date(),
      isRead: false,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
