import { NextResponse } from "next/server";
import pool from "@/db";
import bcrypt from "bcryptjs";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export async function POST(req: Request) {
  try {
    const { name, email, password, year, course } = await req.json();
 
    if (!name || !email || !password || !year || !course) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios" }, { status: 400 });
    }

    if (name.trim().length < 2) {
      return NextResponse.json({ error: "O nome deve ter pelo menos 2 caracteres" }, { status: 400 });
    }


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }


    if (password.length < 8) {
      return NextResponse.json({ error: "A senha deve ter no mínimo 8 caracteres" }, { status: 400 });
    }


    const validYears = ["10º", "11º", "12"];
    if (!validYears.includes(year)) {
      return NextResponse.json({ error: "Ano escolar inválido. Escolha 10º, 11º ou 12." }, { status: 400 });
    }


    const [existingUsers] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM utilizador WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "Este email já está registado" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    
    await pool.query<ResultSetHeader>(
      `INSERT INTO utilizador 
        (nome, email, palavra_passe, ano_escolar, curso, status) 
       VALUES (?, ?, ?, ?, ?, 'ativo')`,
      [name.trim(), email, hashedPassword, year, course]
    );


    return NextResponse.json({ success: true, message: "Conta criada com sucesso" });

  } catch (error: any) {
    console.error("Erro no registo:", error);
    
 
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') {
       return NextResponse.json({ error: "Dados inválidos (possível erro no Ano Escolar ou Enums)." }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    );
  }
}