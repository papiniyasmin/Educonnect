import { NextResponse } from "next/server";
import pool from "@/db"; 
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = 'force-dynamic';

function getUserIdFromToken() {
  const cookieStore = cookies();
  const token = cookieStore.get("token");
  if (!token) return null;
  try {
    const secret = process.env.JWT_SECRET || "EDUCONNECT_SECRET_2024"; 
    const decoded: any = jwt.verify(token.value, secret);
    return decoded.id;
  } catch (e) {
    return null;
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  let connection;
  try {
    // 1. Pega no ID de quem está a tentar apagar (quem está logado)
    const loggedUserId = getUserIdFromToken();
    if (!loggedUserId) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 });

    connection = await pool.getConnection();

    // 2. VERIFICAÇÃO INFALÍVEL: Confirma que quem está logado é o 'admin'
    const [adminCheck]: any = await connection.execute("SELECT nome FROM utilizador WHERE id = ?", [loggedUserId]);
    
    if (adminCheck.length === 0 || adminCheck[0].nome !== "admin") {
      return NextResponse.json({ error: "Acesso negado. Apenas o Admin pode apagar." }, { status: 403 });
    }

    // 3. Segurança extra: O admin não pode apagar-se a si mesmo!
    const userIdToDelete = params.id;
    if (loggedUserId == userIdToDelete) {
        return NextResponse.json({ error: "Não te podes apagar a ti próprio!" }, { status: 400 });
    }

    await connection.beginTransaction();

    try {
      await connection.execute("DELETE FROM info WHERE id_aluno = ?", [userIdToDelete]);
      const [result]: any = await connection.execute("DELETE FROM utilizador WHERE id = ?", [userIdToDelete]);

      if (result.affectedRows === 0) {
        await connection.rollback(); 
        return NextResponse.json({ error: "Utilizador não encontrado." }, { status: 404 });
      }

      await connection.commit();
      return NextResponse.json({ message: "Utilizador apagado com sucesso!" }, { status: 200 });

    } catch (err: any) {
      await connection.rollback(); 
      console.error("ERRO SQL AO APAGAR:", err);
      throw err;
    }

  } catch (error: any) {
    console.error("ERRO GERAL NO DELETE ADMIN:", error);
    return NextResponse.json({ error: "Erro ao apagar utilizador", details: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release(); 
  }
}