import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db"; // A ligação à base de dados
import jwt from 'jsonwebtoken';

// Constante global para a chave secreta, assim não repetimos código!
const JWT_SECRET = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";

// =================================================================================
// GET: LISTAR PEDIDOS RECEBIDOS 
// =================================================================================
export async function GET(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO
    // ---------------------------------------------------------
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      myId = decoded.id; // Quem sou eu?
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      // ---------------------------------------------------------
      // 2. BUSCAR PEDIDOS PENDENTES COM JOIN
      // ---------------------------------------------------------
      // Procura quem quer ser MEU amigo (eu sou o amigo_id e o estado é PENDENTE).
      // O JOIN junta a tabela 'amizade' com a tabela 'utilizador' para trazer logo
      // o nome, a foto e o curso de quem me enviou o pedido. Genial para o Frontend!
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

      // Devolve a lista pronta a ser desenhada no ecrã (Sino de notificações)
      return NextResponse.json(rows);
    } finally {
      // 3. Libertar a ligação
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
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO
    // ---------------------------------------------------------
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. VALIDAÇÃO DE DADOS
    // ---------------------------------------------------------
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'ID do utilizador em falta' }, { status: 400 });
    }

    const myIdNum = Number(myId);
    const targetIdNum = Number(targetUserId);

    if (myIdNum === targetIdNum) {
      return NextResponse.json({ error: 'Não pode adicionar-se a si mesmo' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // ---------------------------------------------------------
      // 3. VERIFICAR RELAÇÕES EXISTENTES (DUPLA DIREÇÃO)
      // ---------------------------------------------------------
      const [existing]: any = await connection.execute(
        `SELECT id, estado FROM amizade 
         WHERE (utilizador_id = ? AND amigo_id = ?) 
            OR (utilizador_id = ? AND amigo_id = ?)`,
        [myIdNum, targetIdNum, targetIdNum, myIdNum]
      );

      if (existing.length > 0) {
        const status = existing[0].estado;
        
        // Bloqueia se já são amigos ou se já há pedido pendente
        if (status === 'ACEITE') {
          return NextResponse.json({ error: 'Já são amigos!' }, { status: 409 });
        } else if (status === 'PENDENTE') {
          return NextResponse.json({ error: 'Já existe um pedido pendente.' }, { status: 409 });
        
        // Se a pessoa recusou no passado, damos uma segunda oportunidade!
        // Apagamos a linha antiga (RECUSADA) para a query de INSERT em baixo funcionar limpinha.
        } else if (status === 'RECUSADA') {
            await connection.execute('DELETE FROM amizade WHERE id = ?', [existing[0].id]);
        }
      }

      // ---------------------------------------------------------
      // 4. CRIAR O NOVO PEDIDO
      // ---------------------------------------------------------
      // Regista o pedido: Eu (utilizador_id) peço amizade a Ele (amigo_id)
      await connection.execute(
        `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) 
         VALUES (?, ?, NOW(), 'PENDENTE')`,
        [myIdNum, targetIdNum]
      );

      return NextResponse.json({ message: 'Pedido de amizade enviado!' });

    } finally {
      // 5. Libertar a ligação
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao enviar pedido:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}