import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise";

interface Message {
  id: number;
  senderId: number;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(cookieHeader.split("; ").map(c => {
    const [key, ...v] = c.split("=");
    return [key, v.join("=")];
  }));

  const userId = cookies["userId"];
  if (!userId) return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });

  const otherId = req.nextUrl.searchParams.get("otherId");
  if (!otherId) return NextResponse.json({ error: "otherId requerido" }, { status: 400 });

  try {
    const [rows] = await pool.query<Message[] & RowDataPacket[]>(
      `SELECT id, remetente_id AS senderId, conteudo AS content, data_envio AS timestamp, lida AS isRead
       FROM Mensagem
       WHERE (remetente_id = ? AND destinatario_id = ?) 
          OR (remetente_id = ? AND destinatario_id = ?)
       ORDER BY data_envio ASC`,
      [userId, otherId, otherId, userId]
    );

    return NextResponse.json({ messages: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
