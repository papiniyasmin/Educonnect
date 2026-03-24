import { NextResponse } from "next/server";
import pool from "@/db"; 
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// =========================================================================
// POST: CRIAR UM NOVO GRUPO
// =========================================================================
export async function POST(req: Request) {
  let connection;
  try {
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO
    // ---------------------------------------------------------
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    // Se não há token, barra a entrada logo aqui
    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada. Faça login." }, { status: 401 });
    }

    let ownerId;
    try {
      // Extrai o ID do utilizador que será o "Dono/Criador" do grupo
      const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
      ownerId = decoded.id; 
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida. Inicie sessão novamente." }, { status: 401 });
    }

    // ---------------------------------------------------------
    // 2. RECEBER E VALIDAR OS DADOS DO FORMULÁRIO
    // ---------------------------------------------------------
    const body = await req.json();
    const { name, description, topicId } = body; 

    if (!name) {
      return NextResponse.json({ error: "O nome do grupo é obrigatório." }, { status: 400 });
    }

    // Limpa espaços em branco no início e no fim
    const nomeTrim = name.trim();

    if (nomeTrim.length < 3) {
      return NextResponse.json({ error: "O nome é muito curto. Deve ter no mínimo 3 letras." }, { status: 400 });
    }

    // Validação estrita de formato de nome (Regras gramaticais e de capitalização)
    const nameRegex = /^[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*(?:\/[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*)*(?: (?:(?:de|da|do|dos|das|a|e) )?(?:- )?[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*(?:\/[A-Z0-9ÇÁÀÂÃÉÊÍÓÔÕÚ][a-z0-9çáàâãéêíóôõúº\.]*)*)*$/;

    if (!nameRegex.test(nomeTrim)) {
      return NextResponse.json({ 
        error: "Nome inválido. As palavras principais têm de começar com Maiúscula. Conectores permitidos: de, da, do, dos, das, a, e." 
      }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 3. LIGAÇÃO À BASE DE DADOS E PROTEÇÕES
    // ---------------------------------------------------------
    connection = await pool.getConnection();

    //  Evitar Duplicados (Duplo clique no Frontend)
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
      // ---------------------------------------------------------
      // 4. INSERIR NA BASE DE DADOS (Grupo, Membro, Tópico)
      // ---------------------------------------------------------
      
      //  Criar o Grupo
      const [result]: any = await connection.execute(
        `INSERT INTO grupo (nome, descricao, tipo, data_criacao) 
         VALUES (?, ?, 'academico', NOW())`,
        [nomeTrim, description ? description.trim() : null]
      );

      // Apanha o ID do grupo que acabou de ser criado
      const newGroupId = result.insertId;

      // Colocar quem criou o grupo automaticamente como membro
      await connection.execute(
        `INSERT INTO membro (remetente_id, grupo_id) 
         VALUES (?, ?)`,
        [ownerId, newGroupId]
      );

      //  Se o utilizador escolheu um tópico/categoria, liga o tópico ao grupo
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