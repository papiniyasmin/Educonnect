import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";

// =================================================================================
// GET: LISTAR PEDIDOS RECEBIDOS (Para mostrar no "Sino" ou na página de Amigos)
// =================================================================================
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      // Procura quem quer ser MEU amigo (eu sou o amigo_id)
      const query = `
        SELECT 
          a.id, 
          a.utilizador_id as requesterId, 
          u.nome as name, 
          u.foto_url as avatar, 
          u.curso as course, 
          a.data as timestamp
        FROM amizade a
        JOIN utilizador u ON a.utilizador_id = u.id
        WHERE a.amigo_id = ? AND a.estado = 'PENDENTE'
      `;

      const [rows]: any = await connection.execute(query, [myId]);

      return NextResponse.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// =================================================================================
// POST: ENVIAR UM NOVO PEDIDO DE AMIZADE
// =================================================================================
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'ID do utilizador em falta' }, { status: 400 });
    }

    // Converter para números para evitar erros de comparação
    const myIdNum = Number(myId);
    const targetIdNum = Number(targetUserId);

    if (myIdNum === targetIdNum) {
      return NextResponse.json({ error: 'Não pode adicionar-se a si mesmo' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // 1. Verificar se já existe relação (em qualquer direção)
      const [existing]: any = await connection.execute(
        `SELECT id, estado FROM amizade 
         WHERE (utilizador_id = ? AND amigo_id = ?) 
            OR (utilizador_id = ? AND amigo_id = ?)`,
        [myIdNum, targetIdNum, targetIdNum, myIdNum]
      );

      if (existing.length > 0) {
        const status = existing[0].estado;
        if (status === 'ACEITE') {
          return NextResponse.json({ error: 'Já são amigos!' }, { status: 409 });
        } else if (status === 'PENDENTE') {
          return NextResponse.json({ error: 'Já existe um pedido pendente.' }, { status: 409 });
        } else if (status === 'RECUSADA') {
            // Opcional: Permitir reenviar se foi recusado, ou bloquear
            // Aqui apagamos a recusa antiga para criar um novo pedido
            await connection.execute('DELETE FROM amizade WHERE id = ?', [existing[0].id]);
        }
      }

      // 2. Criar o pedido (Eu peço -> Ele recebe)
      await connection.execute(
        `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) 
         VALUES (?, ?, NOW(), 'PENDENTE')`,
        [myIdNum, targetIdNum]
      );

      return NextResponse.json({ message: 'Pedido de amizade enviado!' });

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}