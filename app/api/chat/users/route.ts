import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

interface User {
  id: number;
  name: string;
  year: string;
  course: string;
  avatar: string | null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(); // <--- ID SEGURO

  if (!userId) {
    return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });
  }

  try {
    const [rows] = await pool.query<User[] & RowDataPacket[]>(
      `SELECT 
        id, 
        nome AS name, 
        ano_escolar AS year, 
        curso AS course, 
        foto_url AS avatar
       FROM utilizador 
       WHERE id != ?`,
      [userId]
    );

    return NextResponse.json({ users: rows });
  } catch (err: any) {
    console.error("Erro ao buscar usuários:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}