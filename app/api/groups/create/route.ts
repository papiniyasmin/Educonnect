import { NextResponse } from "next/server";
import pool from "@/db";
import { ResultSetHeader } from "mysql2";

export async function POST(req: Request) {
  let connection;
  try {
    const body = await req.json();
    // O frontend envia subject/year, mas o banco só aceita 'tipo'.
    // Vamos definir 'tipo' como 'academico' por padrão.
    const { name, description, ownerId } = body; 

    if (!name || !ownerId) {
      return NextResponse.json({ error: "Nome e ID do criador são obrigatórios" }, { status: 400 });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Criar o Grupo (Apenas com colunas existentes no teu SQL)
      // Definimos 'tipo' como 'academico' por padrão para não dar erro
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT INTO grupo (nome, descricao, tipo, data_criacao) 
         VALUES (?, ?, 'academico', NOW())`,
        [name, description || ""]
      );

      const newGroupId = result.insertId;

      // 2. Adicionar o criador à tabela 'membro'
      // No teu schema, 'remetente_id' é quem é o usuário na tabela membro
      await connection.execute(
        `INSERT INTO membro (remetente_id, grupo_id) 
         VALUES (?, ?)`,
        [ownerId, newGroupId]
      );

      await connection.commit();

      return NextResponse.json({ 
        success: true, 
        id: newGroupId, 
        message: "Grupo criado com sucesso!" 
      });

    } catch (err) {
      await connection.rollback();
      throw err;
    }

  } catch (error) {
    console.error("Erro ao criar grupo:", error);
    return NextResponse.json({ error: "Erro interno ao criar grupo" }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}