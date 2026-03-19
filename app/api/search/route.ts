import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    // 1. Verificação de Autenticação
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Se a query estiver vazia, retorna arrays vazios
    if (!query.trim()) {
      return NextResponse.json({ pessoas: [], grupos: [] });
    }

    const connection = await pool.getConnection();

    try {
      // REGRA CRUCIAL: O '%' apenas no final garante que a busca seja pela letra inicial
      const searchTermStart = `${query.trim()}%`;

      // Busca de Pessoas (Apenas nome que começa com a letra)
      const [pessoas]: any = await connection.execute(
        `SELECT 
            u.id, 
            u.nome, 
            u.foto_url as avatar, 
            u.ano_escolar as ano, 
            u.curso,
            (SELECT a.estado FROM amizade a 
             WHERE (a.utilizador_id = ? AND a.amigo_id = u.id) 
                OR (a.utilizador_id = u.id AND a.amigo_id = ?) 
             LIMIT 1) as estado_amizade
         FROM utilizador u
         WHERE u.nome LIKE ? 
         AND u.id != ? 
         ORDER BY u.nome ASC
         LIMIT 10`,
        [myId, myId, searchTermStart, myId]
      );

      // Busca de Grupos (Apenas nome que começa com a letra)
      const [grupos]: any = await connection.execute(
        `SELECT id, nome, tipo, descricao 
         FROM grupo 
         WHERE nome LIKE ? 
         ORDER BY nome ASC
         LIMIT 5`,
        [searchTermStart]
      );

      return NextResponse.json({ pessoas, grupos });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro na pesquisa:", error);
    return NextResponse.json({ error: 'Erro interno na pesquisa' }, { status: 500 });
  }
}