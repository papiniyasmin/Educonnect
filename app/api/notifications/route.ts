import { NextRequest, NextResponse } from "next/server";
import pool from "@/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `SELECT n.id, n.tipo AS type, n.lida AS isRead, n.data_notificacao AS timestamp,
              a.nome AS title, NULL AS description, NULL AS avatar, NULL AS actionUrl
      FROM Notificacao n
      JOIN Aluno a ON a.id = n.aluno_id
      ORDER BY n.data_notificacao DESC`
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}