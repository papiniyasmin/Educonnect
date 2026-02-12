import { NextResponse } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  // Se a pesquisa for vazia, evita ir à base de dados desnecessariamente
  if (!q.trim()) {
    return NextResponse.json({ posts: [], grupos: [], pessoas: [] });
  }

  try {
    const searchTerm = `%${q}%`;

    // 1. BUSCA POSTS (Agora: 'mensagem' + 'mensagem_geral')
    // Assumindo que "Posts" são mensagens gerais. Fazemos JOIN para saber quem escreveu (remetente_id).
    const [posts] = await pool.query<RowDataPacket[]>(
      `SELECT 
        m.id, 
        m.titulo AS title, 
        m.tipo,
        mg.remetente_id AS aluno_id 
       FROM mensagem m
       INNER JOIN mensagem_geral mg ON m.id = mg.mensagem_id
       WHERE m.titulo LIKE ?`,
      [searchTerm]
    );

    // 2. BUSCA GRUPOS (Tabela 'grupo')
    const [grupos] = await pool.query<RowDataPacket[]>(
      `SELECT id, nome, tipo 
       FROM grupo 
       WHERE nome LIKE ?`,
      [searchTerm]
    );

    // 3. BUSCA PESSOAS (Antigo 'Aluno' -> Agora 'utilizador')
    const [pessoas] = await pool.query<RowDataPacket[]>(
      `SELECT 
        id, 
        nome, 
        ano_escolar AS ano, 
        curso, 
        foto_url AS avatar 
       FROM utilizador 
       WHERE nome LIKE ?`,
      [searchTerm]
    );

    return NextResponse.json({
      posts,
      grupos,
      pessoas,
    });
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
