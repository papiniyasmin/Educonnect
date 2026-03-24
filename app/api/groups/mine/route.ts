import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db"; 
import { getUserId } from "@/lib/auth"; 

// =========================================================================
// GET: LISTAR APENAS OS MEUS GRUPOS 
// =========================================================================
export async function GET(req: NextRequest) {
  // ---------------------------------------------------------
  // 1. AUTENTICAÇÃO SEGURA
  // ---------------------------------------------------------
  const userId = getUserId(); 
  if (!userId) {
    return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });
  }

  try {
    // ---------------------------------------------------------
    // 2. BUSCA DOS DADOS
    // ---------------------------------------------------------    
    const [rows]: any = await pool.query(
      `SELECT 
        g.id, 
        g.nome, 
        g.descricao, 
        g.tipo,
        g.foto_url
       FROM grupo g
       INNER JOIN membro m ON g.id = m.grupo_id
       WHERE m.remetente_id = ?
       ORDER BY g.nome ASC`, // Organiza por ordem alfabética para ser mais fácil de ler
      [userId]
    );

    // ---------------------------------------------------------
    // 3. RETORNO DOS DADOS
    // ---------------------------------------------------------
    return NextResponse.json({ groups: rows });

  } catch (err: any) {
    console.error("Erro ao buscar meus grupos:", err);
    return NextResponse.json({ error: "Erro ao carregar a sua lista de grupos." }, { status: 500 });
  }
}