import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
    
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
      // 1. Procurar o pedido original para saber quem o enviou
      // Nota: A coluna correta é 'utilizador_id'
      const [rows] = await connection.execute<RowDataPacket[]>(
        `SELECT utilizador_id, amigo_id FROM amizade WHERE id = ?`,
        [requestId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      const requestSenderId = rows[0].utilizador_id; // Quem enviou o pedido (ex: Rui)
      const requestReceiverId = rows[0].amigo_id;    // Quem recebeu (Tu)

      // Verificação de segurança: Só tu podes aceitar pedidos dirigidos a ti
      if (requestReceiverId !== myId) {
        return NextResponse.json({ error: 'Este pedido não é para ti' }, { status: 403 });
      }

      // 2. Atualizar o pedido original para 'ACEITE'
      await connection.execute(
        `UPDATE amizade SET estado = 'ACEITE' WHERE id = ?`,
        [requestId]
      );

      // 3. Criar a relação inversa (Tu -> Rui) para aparecer no teu chat
      // Verificamos se já existe para não dar erro de duplicado
      const [checkExists] = await connection.execute<RowDataPacket[]>(
        `SELECT id FROM amizade WHERE utilizador_id = ? AND amigo_id = ?`,
        [myId, requestSenderId]
      );

      if (checkExists.length === 0) {
        await connection.execute(
          `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) VALUES (?, ?, NOW(), 'ACEITE')`,
          [myId, requestSenderId]
        );
      } else {
        // Se já existia (ex: amizade antiga), reativamos
        await connection.execute(
            `UPDATE amizade SET estado = 'ACEITE' WHERE utilizador_id = ? AND amigo_id = ?`,
            [myId, requestSenderId]
        );
      }

      return NextResponse.json({ message: 'Amizade aceite com sucesso!' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao aceitar:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}