import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise";
import { getUserId } from "@/lib/auth"; // <--- NOVO IMPORT

// ==========================================
// INTERFACE: Define a estrutura de dados esperada
// ==========================================
interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  year: string;
  course: string;
  avatar: string | null;
}

export async function GET(req: NextRequest) {
  // 2. SEGURANÇA: Obtém o ID do utilizador logado de forma segura
  const userId = getUserId();

  if (!userId) {
    return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });
  }

  try {

    // 3. LÓGICA DE DADOS: Busca os utilizadores (exceto o proprio utilizador logado)
    // Isto diz ao TypeScript: "O primeiro elemento deste array de resposta é uma lista de UserRow"
    const [rows] = (await pool.query(
      `SELECT 
        id, 
        nome AS name, 
        ano_escolar AS year, 
        curso AS course, 
        foto_url AS avatar
       FROM utilizador 
       WHERE id != ?`,
      [userId]
    )) as [UserRow[], any];

    // 4. Retorna a lista de utilizadores (exceto o próprio utilizador logado)
    return NextResponse.json({ users: rows });

  } catch (err: any) {
    // 5. Tratamento de erros
    console.error("Erro ao buscar usuários:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}