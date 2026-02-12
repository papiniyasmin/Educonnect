import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const secret = "EDUCONNECT_SECRET_2024"; // <--- A MESMA CHAVE FIXA
    
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { requestId } = await req.json();

    const connection = await pool.getConnection();
    try {
      // Podes apagar (DELETE) ou marcar como RECUSADA. Aqui vamos apagar o pedido.
      const [result]: any = await connection.execute(
        `DELETE FROM amizade 
         WHERE id = ? AND amigo_id = ?`,
        [requestId, myId]
      );

      return NextResponse.json({ message: 'Pedido recusado/removido.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao recusar:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}