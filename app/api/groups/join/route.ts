import { NextResponse } from "next/server";
import pool from "@/db"; 
import { getUserId } from "@/lib/auth"; 

// =========================================================================
// POST: ENTRAR OU SAIR DE UM GRUPO 
// =========================================================================
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------------
    // 1. RECEBER DADOS E AUTENTICAÇÃO
    // ---------------------------------------------------------
    const { groupId, join } = await req.json(); 
    const userId = getUserId(); 
    console.log("-> Tentativa de Participar/Sair:", { groupId, userId, join });

    //  Se faltar alguma coisa, abortar missão.
    if (!groupId || !userId) {
      console.log("-> ERRO: Faltam dados ou utilizador não autenticado!");
      return NextResponse.json({ error: "Falta o ID do grupo ou utilizador não autenticado" }, { status: 400 });
    }

    // ---------------------------------------------------------
    // 2. LÓGICA DE ENTRAR OU SAIR
    // ---------------------------------------------------------
    if (join) {
           
      // Verifica se ele já existe na tabela 'membro' para este grupo específico
      const [exists]: any = await pool.query(
        "SELECT id FROM membro WHERE grupo_id = ? AND remetente_id = ?", 
        [groupId, userId]
      );

      if (exists.length === 0) {
        await pool.query(
          "INSERT INTO membro (grupo_id, remetente_id) VALUES (?, ?)",
          [groupId, userId]
        );
        console.log("-> SUCESSO: Utilizador inserido no grupo!");
      } else {
         console.log("-> AVISO: O utilizador já estava neste grupo.");
      }
      
    } else {
      // Removemos a linha da tabela 'membro' que liga este utilizador a este grupo
      await pool.query(
        "DELETE FROM membro WHERE grupo_id = ? AND remetente_id = ?",
        [groupId, userId]
      );
      console.log("-> SUCESSO: Utilizador removido do grupo!");
    }
    return NextResponse.json({ success: true });

  } catch (error: any) {

    console.error("-> ERRO SQL AO GRAVAR NA BD:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}