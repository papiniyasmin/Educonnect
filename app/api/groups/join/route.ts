import { NextResponse } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2";

export async function POST(req: Request) {
  try {
    const { groupId, userId, join } = await req.json();

    if (join) {
      // ENTRAR: Verifica se já existe na tabela 'membro'
      const [exists] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM membro WHERE grupo_id = ? AND remetente_id = ?", 
        [groupId, userId]
      );

      if (exists.length === 0) {
        // Inserir usando 'remetente_id' como ID do usuario (conforme teu SQL)
        await pool.query(
          "INSERT INTO membro (grupo_id, remetente_id) VALUES (?, ?)",
          [groupId, userId]
        );
      }
    } else {
      // SAIR
      await pool.query(
        "DELETE FROM membro WHERE grupo_id = ? AND remetente_id = ?",
        [groupId, userId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao entrar/sair do grupo:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}