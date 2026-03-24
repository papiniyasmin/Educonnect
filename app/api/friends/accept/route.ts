import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db";
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';


// Define a estrutura ao procurar os IDs do pedido
interface AmizadeRow extends RowDataPacket {
  utilizador_id: number;
  amigo_id: number;
}

// Define a estrutura ao verificar se a amizade inversa já existe
interface CheckExistsRow extends RowDataPacket {
  id: number;
}

export async function POST(req: NextRequest) {
  try {
    // 1. AUTENTICAÇÃO VIA JWT (JSON Web Token)
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
    
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id; // Descobre quem é o utilizador logado através do token
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // 2. LER O PEDIDO
    const { requestId } = await req.json();

    // 3. LIGAÇÃO À BASE DE DADOS
    const connection = await pool.getConnection();
    
    try {
      // 4. VERIFICAÇÃO DO PEDIDO (Quem enviou e quem recebeu)
      const [rows] = (await connection.execute(
        `SELECT utilizador_id, amigo_id FROM amizade WHERE id = ?`,
        [requestId]
      )) as [AmizadeRow[], any];

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
      }

      const requestSenderId = rows[0].utilizador_id; // Quem enviou o pedido (ex: Rui)
      const requestReceiverId = rows[0].amigo_id;    // Quem recebeu (ex: Yasmin)

      // Verificação de segurança crucial: Só a pessoa que recebeu o pedido o pode aceitar
      if (requestReceiverId !== myId) {
        return NextResponse.json({ error: 'Este pedido não é para ti' }, { status: 403 });
      }

      // 5. ATUALIZAR PEDIDO ORIGINAL (Rui -> Yasmin passa a 'ACEITE')
      await connection.execute(
        `UPDATE amizade SET estado = 'ACEITE' WHERE id = ?`,
        [requestId]
      );

      // 6. GARANTIR A AMIZADE INVERSA (Yasmin -> Rui)
      // Nas redes sociais, se o Rui é teu amigo, tu és amiga do Rui. 
      // Precisamos de garantir que a linha inversa existe para os chats funcionarem de ambos os lados.
      const [checkExists] = (await connection.execute(
        `SELECT id FROM amizade WHERE utilizador_id = ? AND amigo_id = ?`,
        [myId, requestSenderId]
      )) as [CheckExistsRow[], any];

      if (checkExists.length === 0) {
        // Se a relação inversa não existe, criamos uma nova já com o estado 'ACEITE'
        await connection.execute(
          `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) VALUES (?, ?, NOW(), 'ACEITE')`,
          [myId, requestSenderId]
        );
      } else {
        // Se já existia (por exemplo, já tinham sido amigos no passado e desfizeram), reativamos
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