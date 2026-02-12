import { NextResponse, NextRequest } from "next/server";
import pool from "@/db";
import { getUserId } from "@/lib/auth"; 
import { RowDataPacket } from "mysql2";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(); 
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'private' ou 'group'

    const connection = await pool.getConnection();

    try {
      let query = "";
      let params: any[] = [];

      if (type === "private") {
        // --- AMIGOS (Conversas Privadas) ---
        // Apanha o ID, Nome e Foto do AMIGO onde o estado é 'ACEITE'
        query = `
          SELECT 
            u.id, 
            u.nome, 
            u.foto_url,
            'private' as type,
            'Online' as sub
          FROM amizade a
          JOIN utilizador u ON u.id = CASE 
            WHEN a.utilizador_id = ? THEN a.amigo_id 
            WHEN a.amigo_id = ? THEN a.utilizador_id 
          END
          WHERE (a.utilizador_id = ? OR a.amigo_id = ?)
          AND a.estado = 'ACEITE'
        `;
        params = [userId, userId, userId, userId];

      } else {
        // --- GRUPOS ---
        // Corrigido: Removemos g.foto_url que não existe
        query = `
          SELECT 
            g.id, 
            g.nome, 
            '' as foto_url, 
            g.tipo as sub,
            'group' as type
          FROM grupo g
          INNER JOIN membro m ON m.grupo_id = g.id
          WHERE m.remetente_id = ?
        `;
        params = [userId];
      }

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);

      const formattedItems = rows.map((item) => ({
        id: item.id,
        nome: item.nome,
        foto_url: item.foto_url || "", 
        tipo: item.type, // Nota: O SQL retorna 'type', aqui mapeamos para 'tipo' se o front precisar
        sub: item.sub || "" 
      }));

      return NextResponse.json({ items: formattedItems });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error("Erro ao carregar lista de chat:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}