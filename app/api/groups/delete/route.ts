import { NextResponse } from "next/server";
import pool from "@/db"; 
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// =========================================================================
// DELETE: APAGAR UM GRUPO (Apenas para o Criador)
// =========================================================================
export async function DELETE(req: Request) {
  let connection;
  try {
    const { groupId } = await req.json(); 
    
    // ---------------------------------------------------------
    // 1. AUTENTICAÇÃO (Saber quem está a tentar apagar)
    // ---------------------------------------------------------
    const cookieStore = cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json({ error: "Sessão não encontrada" }, { status: 401 });
    }

    let userId;
    try {
      const decoded: any = jwt.verify(token, "EDUCONNECT_SECRET_2024");
      userId = decoded.id; // ID de quem clicou no botão "Apagar Grupo"
    } catch (e) {
      return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });
    }

    // Validação de segurança básica
    if (!groupId || !userId) {
      return NextResponse.json({ error: "Faltam dados para processar o pedido" }, { status: 400 });
    }

    connection = await pool.getConnection();

    // ---------------------------------------------------------
    // 2. DESCOBRIR QUEM É O CRIADOR DO GRUPO
    // ---------------------------------------------------------
    const [membros]: any = await connection.query(
      "SELECT remetente_id FROM membro WHERE grupo_id = ? ORDER BY id ASC LIMIT 1", 
      [groupId]
    );

    // Se não há membros, o grupo não existe (ou já foi apagado)
    if (membros.length === 0) {
      return NextResponse.json({ error: "Grupo não encontrado." }, { status: 404 });
    }

    const criadorId = membros[0].remetente_id;

    // ---------------------------------------------------------
    // 3. PROTEÇÃO MÁXIMA DE AUTORIZAÇÃO
    // ---------------------------------------------------------
    if (criadorId !== userId) {
      return NextResponse.json({ error: "Apenas o criador original do grupo tem permissão para o apagar!" }, { status: 403 });
    }

    // ---------------------------------------------------------
    // 4. ELIMINAR O GRUPO USANDO A TUA STORED PROCEDURE
    // ---------------------------------------------------------
    await connection.execute("CALL sp_eliminar_grupo_completo(?)", [groupId]);

    return NextResponse.json({ success: true, message: "Grupo apagado com sucesso" });

  } catch (error: any) {
    console.error("-> ERRO AO APAGAR GRUPO:", error.message);
    return NextResponse.json({ error: "Erro interno ao apagar o grupo." }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}