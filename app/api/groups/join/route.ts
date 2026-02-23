import { NextResponse } from "next/server";
import pool from "@/db";
import { RowDataPacket } from "mysql2/promise"; 
import { getUserId } from "@/lib/auth"; // <-- A magia está aqui!

export async function POST(req: Request) {
  try {
    const { groupId, join } = await req.json(); // Já não precisamos de pedir o userId ao frontend
    
    // Vamos buscar o ID do utilizador logado diretamente no backend (muito mais seguro!)
    const userId = getUserId(); 

    // 1. ESPIÃO: Ver o que está a chegar
    console.log("-> Tentativa de Participar/Sair:", { groupId, userId, join });

    if (!groupId || !userId) {
      console.log("-> ERRO: Faltam dados ou utilizador não autenticado!");
      return NextResponse.json({ error: "Falta o ID do grupo ou utilizador não autenticado" }, { status: 400 });
    }

    if (join) {
      // ENTRAR: Verifica se já existe na tabela 'membro'
      const [exists] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM membro WHERE grupo_id = ? AND remetente_id = ?", 
        [groupId, userId]
      );

      if (exists.length === 0) {
        // Inserir
        await pool.query(
          "INSERT INTO membro (grupo_id, remetente_id) VALUES (?, ?)",
          [groupId, userId]
        );
        console.log("-> SUCESSO: Utilizador inserido no grupo!");
      } else {
         console.log("-> AVISO: O utilizador já estava neste grupo.");
      }
    } else {
      // SAIR
      await pool.query(
        "DELETE FROM membro WHERE grupo_id = ? AND remetente_id = ?",
        [groupId, userId]
      );
      console.log("-> SUCESSO: Utilizador removido do grupo!");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // 2. ESPIÃO DO ERRO REAL DA BASE DE DADOS
    console.error("-> ERRO SQL AO GRAVAR NA BD:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}