import { NextResponse } from "next/server";
import pool from "@/db";
import { ResultSetHeader } from "mysql2";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  let connection;
  try {
    // 1. LER O TOKEN DE SESSÃO
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada. Faça login." }, { status: 401 });
    }

    let ownerId;
    try {
      const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
      ownerId = decoded.id; 
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida. Inicie sessão novamente." }, { status: 401 });
    }

    // 2. LER OS DADOS
    const body = await req.json();
    const { name, description, topicId } = body; 

    if (!name) {
      return NextResponse.json({ error: "O nome do grupo é obrigatório." }, { status: 400 });
    }

    const nomeTrim = name.trim();

    if (nomeTrim.length < 3) {
      return NextResponse.json({ error: "O nome é muito curto. Deve ter no mínimo 3 letras." }, { status: 400 });
    }

    // REGEX ATUALIZADA
    const nameRegex = /^[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*(?:\/[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*)*(?: (?:(?:de|da|do|dos|das|a|e) )?(?:- )?[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*(?:\/[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*)*)*$/;

    if (!nameRegex.test(nomeTrim)) {
      return NextResponse.json({ 
        error: "Nome inválido. As palavras principais têm de começar com Maiúscula. Conectores permitidos: de, da, do, dos, das, a, e." 
      }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 🛡️ PROTEÇÃO 1: Evitar que um duplo-clique crie o grupo duas vezes
    const [existingGroup]: any = await connection.execute(
      `SELECT id FROM grupo WHERE nome = ? LIMIT 1`,
      [nomeTrim]
    );

    if (existingGroup.length > 0) {
      connection.release();
      return NextResponse.json({ 
        error: "Já existe um grupo com este nome. Escolha outro ou aguarde um momento." 
      }, { status: 400 });
    }

    await connection.beginTransaction();

    try {
      // 3. INSERIR O GRUPO NA BASE DE DADOS
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO grupo (nome, descricao, tipo, data_criacao) 
         VALUES (?, ?, 'academico', NOW())`,
        [nomeTrim, description ? description.trim() : null]
      );

      const newGroupId = result.insertId;

      // 4. ADICIONAR O CRIADOR COMO MEMBRO
      await connection.execute(
        `INSERT INTO membro (remetente_id, grupo_id) 
         VALUES (?, ?)`,
        [ownerId, newGroupId]
      );

      // 5. ASSOCIAR O TÓPICO ÚNICO AO GRUPO
      if (topicId && topicId !== 0 && topicId !== "0") {
        await connection.execute(
          `INSERT INTO grupo_topico (grupo_id_grupo, topico_id) VALUES (?, ?)`,
          [newGroupId, topicId]
        );
      }

      await connection.commit();

      return NextResponse.json({ 
        success: true, 
        id: newGroupId, 
        message: "Grupo e tópico criados com sucesso!" 
      });

    } catch (err: any) {
      await connection.rollback();
      
      // 🛡️ PROTEÇÃO 2: Se mesmo assim houver Deadlock, avisa sem deitar o servidor abaixo
      if (err.code === 'ER_LOCK_DEADLOCK') {
        return NextResponse.json({ 
          error: "O servidor está a processar muitos pedidos simultâneos. Tente novamente." 
        }, { status: 409 });
      }

      if (err.sqlState === '45000' || err.code === 'ER_SIGNAL_EXCEPTION') {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

  } catch (error) {
    console.error("Erro interno ao criar grupo:", error);
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}