import { NextResponse, NextRequest } from 'next/server';
import pool from "@/db"; // A tua ligação segura à Base de Dados
import jwt from 'jsonwebtoken';

// =========================================================================
// POST: Enviar um Pedido de Amizade
// =========================================================================
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024";
    
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO (Saber quem está a fazer o pedido)
    // ---------------------------------------------------------
    // Vai buscar o token aos cookies para garantir que a pessoa está logada
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    let myId;
    try {
      // Descodifica o token para extrair o ID de quem clicou em "Adicionar"
      const decoded: any = jwt.verify(token, secret);
      myId = decoded.id;
    } catch (e) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. RECEBER OS DADOS DO PEDIDO
    // ---------------------------------------------------------
    // Lê o ID da pessoa que vai receber o pedido (targetUserId) enviado pelo Frontend
    const { targetUserId } = await req.json();

    // Validação de segurança: o Frontend tem de enviar um ID válido
    if (!targetUserId) {
        return NextResponse.json({ error: 'ID do amigo em falta' }, { status: 400 });
    }

    // Validação de segurança: ninguém pode adicionar-se a si próprio
    if (myId === targetUserId) {
        return NextResponse.json({ error: 'Não pode adicionar-se a si mesmo' }, { status: 400 });
    }

    // Abre a ligação com a base de dados
    const connection = await pool.getConnection();

    try {
      // ---------------------------------------------------------
      // 3. VERIFICAR SE JÁ EXISTE RELAÇÃO (Crucial!)
      // ---------------------------------------------------------
      // Verificamos nas duas direções para garantir que não há pedidos duplicados.
      // Ou seja: Fui eu que enviei antes? Ou foi ele que já me enviou a mim?
      const [existing]: any = await connection.execute(
        `SELECT id, estado FROM amizade 
         WHERE (utilizador_id = ? AND amigo_id = ?) 
            OR (utilizador_id = ? AND amigo_id = ?)`,
        [myId, targetUserId, targetUserId, myId]
      );

      // Se a query devolveu algum resultado, significa que já há histórico entre os dois
      if (existing.length > 0) {
        const status = existing[0].estado;
        
        if (status === 'ACEITE') {
            return NextResponse.json({ error: 'Já são amigos!' }, { status: 409 });
        } else if (status === 'PENDENTE') {
            return NextResponse.json({ error: 'Já existe um pedido pendente.' }, { status: 409 });
        }
      }

      // ---------------------------------------------------------
      // 4. CRIAR O PEDIDO DE AMIZADE
      // ---------------------------------------------------------
      // Se chegámos aqui, não há relação nenhuma. Vamos criar um novo registo!
      // Inserimos: EU sou o utilizador_id (quem pede), ELE é o amigo_id (quem recebe)
      await connection.execute(
        `INSERT INTO amizade (utilizador_id, amigo_id, data, estado) 
         VALUES (?, ?, NOW(), 'PENDENTE')`,
        [myId, targetUserId]
      );

      // Tudo correu bem, avisamos o Frontend para mudar o botão para "Pendente"
      return NextResponse.json({ message: 'Pedido enviado com sucesso!' });

    } finally {
      // ---------------------------------------------------------
      // 5. LIBERTAR A LIGAÇÃO
      // ---------------------------------------------------------
      // Devolvemos a ligação à pool para não encravar o servidor
      connection.release();
    }
  } catch (error) {
    console.error("Erro ao adicionar amigo:", error);
    return NextResponse.json({ error: 'Erro de servidor' }, { status: 500 });
  }
}