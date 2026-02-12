import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
    
    // 1. Autenticação
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. Receber o ID do amigo alvo
    const { targetUserId } = await req.json();

    if (!targetUserId) {
        return NextResponse.json({ error: 'ID do amigo em falta' }, { status: 400 });
    }

    if (myId === targetUserId) {
        return NextResponse.json({ error: 'Não pode adicionar-se a si mesmo' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // 3. Verificar se já existe alguma relação (Pendente ou Aceite)
      // Verificamos nas duas direções (Eu -> Ele OU Ele -> Eu)
      const [existing]: any = await connection.execute(
        `SELECT id, estado FROM amizade 
         WHERE (utilizador_id = ? AND amigo_id = ?) 
            OR (utilizador_id = ? AND amigo_id = ?)`,
        [myId, targetUserId, targetUserId, myId]
      );

      if (existing.length > 0) {
        const status = existing[0].estado;
        if (status === 'ACEITE') {
            return NextResponse.json({ error: 'Já são amigos!' }, { status: 409 });
        } else if (status === 'PENDENTE') {
            return NextResponse.json({ error: 'Já existe um pedido pendente.' }, { status: 409 });
        }
      }

      // 4. CRIAR O PEDIDO
      // Inserimos: EU sou o utilizador_id (quem pede), ELE é o amigo_id (quem recebe)
      await connection.execute(
        `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) 
         VALUES (?, ?, NOW(), 'PENDENTE')`,
        [myId, targetUserId]
      );

      return NextResponse.json({ message: 'Pedido enviado com sucesso!' });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao adicionar amigo:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}