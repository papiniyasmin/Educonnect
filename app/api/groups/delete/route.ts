import { NextResponse } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise"; 
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function DELETE(req: Request) {
  let connection;
  try {
    const { groupId } = await req.json(); 
    
    // 1. LER O TOKEN DE SESSÃO
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
    }

    let userId;
    try {
      const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
      userId = decoded.id; 
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    if (!groupId || !userId) {
      return NextResponse.json({ error: "Faltam dados para processar o pedido" }, { status: 400 });
    }

    connection = await pool.getConnection();

    // 2. DESCOBRIR QUEM É O CRIADOR (O 1º membro a ter entrado neste grupo)
    const [membros] = await connection.query<RowDataPacket[]>(
      "SELECT remetente_id FROM membro WHERE grupo_id = ? ORDER BY id ASC LIMIT 1", 
      [groupId]
    );

    if (membros.length === 0) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }

    const criadorId = membros[0].remetente_id;

    // 3. PROTEÇÃO MÁXIMA: O utilizador é o criador?
    if (criadorId !== userId) {
      return NextResponse.json({ error: "Apenas o criador original do grupo tem permissão para o apagar!" }, { status: 403 });
    }

    // 4. USAR A TUA PRÓPRIA STORED PROCEDURE DA BASE DE DADOS!
    await connection.execute("CALL sp_eliminar_grupo_completo(?)", [groupId]);

    return NextResponse.json({ success: true, message: "Grupo apagado com sucesso" });

  } catch (error: any) {
    console.error("-> ERRO AO APAGAR GRUPO:", error.message);
    return NextResponse.json({ error: "Erro interno ao apagar o grupo." }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}