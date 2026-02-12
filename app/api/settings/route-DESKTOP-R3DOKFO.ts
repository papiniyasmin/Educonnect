import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";

// GET SETTINGS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    const [rows]: any = await pool.query(
      `SELECT A.nome, A.email, A.ano_escolar AS year, A.curso, A.foto_url AS avatar, P.settings
       FROM Aluno A
       LEFT JOIN Perfil P ON A.id = P.aluno_id
       WHERE A.id = ?`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    const settings = rows[0].settings
      ? JSON.parse(rows[0].settings)
      : {
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
      return NextResponse.json({ error: "userId é obrigatório" }, { status: 400 });
    }

    // Atualizar dados do usuário
    const fields: string[] = [];
    const values: any[] = [];

    if (name) { fields.push("nome = ?"); values.push(name); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (year) { fields.push("ano_escolar = ?"); values.push(year); }
    if (course) { fields.push("curso = ?"); values.push(course); }

    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push("senha = ?");
      values.push(hash);
    }

    if (fields.length > 0) {
      await pool.query(
        `UPDATE Aluno SET ${fields.join(", ")} WHERE id = ?`,
        [...values, userId]
      );
    }

    // Verificar se perfil existe
    const [perfilRows]: any = await pool.query(
      `SELECT id FROM Perfil WHERE aluno_id = ?`,
      [userId]
    );

    if (perfilRows.length === 0) {
      await pool.query(
        `INSERT INTO Perfil (aluno_id, settings) VALUES (?, ?)`,
        [userId, JSON.stringify(settings)]
      );
    } else {
      await pool.query(
        `UPDATE Perfil SET settings = ? WHERE aluno_id = ?`,
        [JSON.stringify(settings), userId]
      );
    }

    return NextResponse.json({ message: "Configurações atualizadas com sucesso!" });
  } catch (err: any) {
    console.error("Erro POST /settings:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
