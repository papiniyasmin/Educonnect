import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    // 1. Autenticação
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      // Tenta usar variável de ambiente, fallback para string fixa
      const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      const searchTerm = `%${query}%`;

      // 2. Procurar PESSOAS + Estado da Amizade
      // Adicionei LIMIT 10 para não sobrecarregar
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
         WHERE (u.nome LIKE ? OR u.curso LIKE ?) 
         AND u.id != ? -- Não mostrar o próprio utilizador
         LIMIT 10`,
        [myId, myId, searchTerm, searchTerm, myId]
      );

      // 3. Procurar GRUPOS
      const [grupos]: any = await connection.execute(
        `SELECT id, nome, tipo, descricao 
         FROM grupo 
         WHERE nome LIKE ? OR descricao LIKE ? 
         LIMIT 5`,
        [searchTerm, searchTerm]
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