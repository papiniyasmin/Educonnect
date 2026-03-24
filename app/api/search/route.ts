import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

// =========================================================================
// OBRIGA A API A NÃO GUARDAR CACHE
// =========================================================================
// Garante que a pesquisa é sempre feita em tempo real à base de dados.
export const dynamic = 'force-dynamic';

// =========================================================================
// GET: Pesquisar utilizadores e grupos pelo nome
// =========================================================================
export async function GET(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. CAPTURAR O TERMO DE PESQUISA
    // ---------------------------------------------------------
    // Vai buscar o parâmetro 'q' ao link. Ex: /api/search?q=Maria
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    // ---------------------------------------------------------
    // 2. VERIFICAÇÃO DE AUTENTICAÇÃO
    // ---------------------------------------------------------
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id; // Guarda o ID da pessoa que está a fazer a pesquisa
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 3. EVITAR PESQUISAS VAZIAS NA BD
    // ---------------------------------------------------------
    // Se o utilizador apagar o texto todo da barra de pesquisa, nem vamos à Base de Dados. 
    // Poupamos recursos devolvendo logo arrays vazios!
    if (!query.trim()) {
      return NextResponse.json({ pessoas: [], grupos: [] });
    }

    const connection = await pool.getConnection();

    try {
      // ---------------------------------------------------------
      // 4. PREPARAR A PESQUISA (PREFIX SEARCH)
      // ---------------------------------------------------------
      // REGRA CRUCIAL: O '%' apenas no final garante que a busca seja pela letra/sílaba inicial.
      const searchTermStart = `${query.trim()}%`;

      // ---------------------------------------------------------
      // 5. BUSCAR PESSOAS E O ESTADO DA AMIZADE
      // ---------------------------------------------------------
      const [pessoas]: any = await connection.execute(
        `SELECT 
            u.id, 
            u.nome, 
            u.foto_url as avatar, 
            u.ano_escolar as ano, 
            u.curso,
            -- Subquery: Verifica se já são amigos ou se há pedido pendente
            (SELECT a.estado FROM amizade a 
             WHERE (a.utilizador_id = ? AND a.amigo_id = u.id) 
                OR (a.utilizador_id = u.id AND a.amigo_id = ?) 
             LIMIT 1) as estado_amizade
         FROM utilizador u
         WHERE u.nome LIKE ? 
         AND u.id != ? -- Garante que o utilizador não aparece na sua própria pesquisa
         ORDER BY u.nome ASC
         LIMIT 10`, // Mostra no máximo 10 pessoas para não sobrecarregar
        [myId, myId, searchTermStart, myId]
      );

      // ---------------------------------------------------------
      // 6. BUSCAR GRUPOS
      // ---------------------------------------------------------
      const [grupos]: any = await connection.execute(
        `SELECT id, nome, tipo, descricao 
         FROM grupo 
         WHERE nome LIKE ? 
         ORDER BY nome ASC
         LIMIT 5`, // Mostra no máximo 5 grupos
        [searchTermStart]
      );

      // ---------------------------------------------------------
      // 7. DEVOLVER RESULTADOS
      // ---------------------------------------------------------
      return NextResponse.json({ pessoas, grupos });

    } finally {
      // É obrigatório libertar a ligação para a BD não encravar
      connection.release();
    }
  } catch (error) {
    console.error("Erro na pesquisa:", error);
    return NextResponse.json({ error: 'Erro interno na pesquisa' }, { status: 500 });
  }
}