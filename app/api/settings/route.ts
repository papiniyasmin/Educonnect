import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";

// =========================================================================
// GET: Buscar as configurações e dados do perfil
// =========================================================================
export async function GET(req: Request) {
  try {
    // 1. Ir buscar o userId ao link (ex: /api/settings?userId=5)
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // 2. Buscar dados juntando a tabela 'utilizador' e 'info'
    // CORREÇÃO TYPESCRIPT: Removido o <RowDataPacket[]> e adicionado o : any
    const [rows]: any = await pool.query(
      `SELECT 
         U.nome, 
         U.email, 
         U.ano_escolar AS year, 
         U.curso, 
         U.foto_url AS avatar, 
         I.settings
       FROM utilizador U
       LEFT JOIN info I ON U.id = I.aluno_id
       WHERE U.id = ?`,
      [userId]
    );

    // Se não encontrar ninguém com este ID, devolve erro 404
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // 3. Processar as configurações (JSON)
    let settingsData = rows[0].settings;
    
    // Se a base de dados devolver as definições como texto, convertemos para Objeto
    if (typeof settingsData === 'string') {
        try {
            settingsData = JSON.parse(settingsData);
        } catch (e) {
            settingsData = null; // Se der erro a converter, assumimos nulo
        }
    }

    // 4. Aplicar Definições Padrão
    // Se o utilizador ainda não tiver definições guardadas, usamos estas por defeito:
    const settings = settingsData || {
        emailNotifications: true,
        pushNotifications: true,
        groupInvites: true,
        privateProfile: false,
        showEmail: false,
        darkMode: true,
        language: "pt",
      };

    // 5. Devolver tudo ao Frontend
    return NextResponse.json({
      settings,
      name: rows[0].nome,
      email: rows[0].email,
      year: rows[0].year,
      course: rows[0].curso,
      avatar: rows[0].avatar
    });

  } catch (err: any) {
    console.error("Erro GET /settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =========================================================================
// POST: Guardar as novas configurações e atualizar o perfil
// =========================================================================
export async function POST(req: Request) {
  try {
    // 1. Receber os dados enviados pelo formulário do Frontend
    const body = await req.json();
    const { userId, name, email, year, course, password, settings } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. ATUALIZAR A TABELA 'utilizador' (Dinamicamente)
    // ---------------------------------------------------------
    const fields: string[] = [];
    const values: any[] = [];

    // Só adicionamos à query os campos que realmente foram enviados!
    if (name) { fields.push("nome = ?"); values.push(name); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (year) { fields.push("ano_escolar = ?"); values.push(year); }
    if (course) { fields.push("curso = ?"); values.push(course); }

    // Se o utilizador escreveu uma password nova, temos de a encriptar antes de guardar
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push("palavra_passe = ?");
      values.push(hash);
    }

    // Se houver campos para atualizar no utilizador, executa a query
    if (fields.length > 0) {
      await pool.query(
        `UPDATE utilizador SET ${fields.join(", ")} WHERE id = ?`,
        [...values, userId] // O userId entra no lugar do último "?"
      );
    }

    // ---------------------------------------------------------
    // 3. ATUALIZAR A TABELA 'info' (Configurações Extra)
    // ---------------------------------------------------------
    // Verifica se já existe um registo na tabela 'info' para este utilizador
    // CORREÇÃO TYPESCRIPT: Removido o <RowDataPacket[]> e adicionado o : any
    const [infoRows]: any = await pool.query(
      `SELECT id FROM info WHERE aluno_id = ?`,
      [userId]
    );

    // Converte o objeto de configurações num texto JSON para guardar na BD
    const settingsString = JSON.stringify(settings);
    const currentDate = new Date(); // Para preencher a 'data_atualização'

    if (infoRows.length === 0) {
      // SITUAÇÃO A: O utilizador ainda não tem registo na tabela 'info' (INSERT)
      const userEmail = email || ""; 

      await pool.query(
        `INSERT INTO info (aluno_id, settings, email, data_atualização, id_aluno) VALUES (?, ?, ?, ?, ?)`,
        [userId, settingsString, userEmail, currentDate, userId] 
      );
    } else {
      // SITUAÇÃO B: O utilizador já tem registo na tabela 'info' (UPDATE)
      const updateFields = ["settings = ?", "data_atualização = ?"];
      const updateValues = [settingsString, currentDate];

      // Atualiza também o email na tabela info (se ele tiver sido alterado)
      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }

      await pool.query(
        `UPDATE info SET ${updateFields.join(", ")} WHERE aluno_id = ?`,
        [...updateValues, userId]
      );
    }

    return NextResponse.json({ message: "Configurações atualizadas com sucesso!" });
  } catch (err: any) {
    console.error("Erro POST /settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}