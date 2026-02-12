import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

// GET SETTINGS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // MUDANÇA: 'Aluno' -> 'utilizador' e 'Perfil' -> 'info'
    // MUDANÇA: A FK agora é 'aluno_id' na tabela 'info'
    const [rows] = await pool.query<RowDataPacket[]>(
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

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Lógica de fallback para settings (se for null ou undefined)
    // Nota: Se usares o tipo JSON no MySQL, ele já vem como objeto, não precisa de JSON.parse em alguns drivers.
    // Mas para garantir compatibilidade com TEXT ou JSON string:
    let settingsData = rows[0].settings;

    if (typeof settingsData === "string") {
      try {
        settingsData = JSON.parse(settingsData);
      } catch (e) {
        settingsData = null;
      }
    }

    const settings = settingsData || {
      emailNotifications: true,
      pushNotifications: true,
      groupInvites: true,
      privateProfile: false,
      showEmail: false,
      darkMode: true,
      language: "pt",
    };

    return NextResponse.json({
      settings,
      // Retornamos também os dados básicos para preencher o formulário
      name: rows[0].nome,
      email: rows[0].email,
      year: rows[0].year,
      course: rows[0].curso,
      avatar: rows[0].avatar,
    });
  } catch (err: any) {
    console.error("Erro GET /settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// SAVE SETTINGS
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, email, year, course, password, settings } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId é obrigatório" },
        { status: 400 }
      );
    }

    // 1. Atualizar dados do 'utilizador' (antigo Aluno)
    const fields: string[] = [];
    const values: any[] = [];

    if (name) {
      fields.push("nome = ?");
      values.push(name);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (year) {
      fields.push("ano_escolar = ?");
      values.push(year);
    }
    if (course) {
      fields.push("curso = ?");
      values.push(course);
    }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      // MUDANÇA: 'senha' -> 'palavra_passe'
      fields.push("palavra_passe = ?");
      values.push(hash);
    }

    if (fields.length > 0) {
      await pool.query(
        `UPDATE utilizador SET ${fields.join(", ")} WHERE id = ?`,
        [...values, userId]
      );
    }

    // 2. Atualizar ou Criar dados na tabela 'info' (antigo Perfil)
    // Primeiro verificamos se já existe registo na tabela info
    const [infoRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM info WHERE aluno_id = ?`,
      [userId]
    );

    const settingsString = JSON.stringify(settings);
    const currentDate = new Date(); // Para 'data_atualização'

    if (infoRows.length === 0) {
      // INSERT: A tabela 'info' obriga a ter email e data_atualização
      // Se o email não veio no body, temos de ir buscar ao utilizador ou usar string vazia se permitido
      const userEmail = email || "";

      await pool.query(
        `INSERT INTO info (aluno_id, settings, email, data_atualização, id_aluno) VALUES (?, ?, ?, ?, ?)`,
        [userId, settingsString, userEmail, currentDate, userId]
        // Nota: O teu esquema tem 'id_aluno' E 'aluno_id'. Preenchi ambos para garantir.
      );
    } else {
      // UPDATE
      const updateFields = ["settings = ?", "data_atualização = ?"];
      const updateValues = [settingsString, currentDate];

      // Se o email mudou, convém atualizar na tabela info também (já que ela tem uma coluna email)
      if (email) {
        updateFields.push("email = ?");
        updateValues.push(email);
      }

      await pool.query(
        `UPDATE info SET ${updateFields.join(", ")} WHERE aluno_id = ?`,
        [...updateValues, userId]
      );
    }

    return NextResponse.json({
      message: "Configurações atualizadas com sucesso!",
    });
  } catch (err: any) {
    console.error("Erro POST /settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
