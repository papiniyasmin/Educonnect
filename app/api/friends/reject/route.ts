import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

// =========================================================================
// POST: Recusar ou Cancelar um Pedido de Amizade
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    // É recomendado usar a variável de ambiente primeiro por segurança. 
    // Se não existir, usamos a tua chave fixa de fallback.
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO (Saber quem está logado)
    // ---------------------------------------------------------
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      // Extrai o ID do utilizador através do Token
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. RECEBER OS DADOS
    // ---------------------------------------------------------
    // Em vez de recebermos o ID do amigo, recebemos o ID da linha da tabela 'amizade'
    const { requestId } = await req.json();

    const connection = await pool.getConnection();
    
    // ---------------------------------------------------------
    // 3. EXECUTAR A AÇÃO (APAGAR DA BD)
    // ---------------------------------------------------------
    try {
     
      const [result]: any = await connection.execute(
        `DELETE FROM amizade 
         WHERE id = ? AND amigo_id = ?`, // Segurança: garante que eu sou o destinatário!
        [requestId, myId]
      );

      return NextResponse.json({ message: 'Pedido recusado/removido.' });
    } finally {
      // ---------------------------------------------------------
      // 4. LIBERTAR LIGAÇÃO
      // ---------------------------------------------------------
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao recusar:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}