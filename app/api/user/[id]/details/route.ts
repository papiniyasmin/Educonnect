import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Deixa vazio se for o caso, ou põe "root" se não der
  database: "educonnect1", 
};

const SECRET = "EDUCONNECT_SECRET_2024";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const targetId = params.id;

  console.log(`🔍 A tentar buscar perfil ID: ${targetId}`);

  try {
    const db = await mysql.createConnection(dbConfig);

    // CORREÇÃO PRINCIPAL AQUI EM BAIXO:
    // Mudei "SELECT id" para "SELECT utilizador.id" para evitar erro de ambiguidade
    const [users]: any = await db.execute(
      `SELECT 
          utilizador.id, 
          utilizador.nome, 
          utilizador.email, 
          utilizador.foto_url, 
          utilizador.curso, 
          utilizador.ano_escolar, 
          info.bio, 
          info.interesses 
       FROM utilizador 
       LEFT JOIN info ON utilizador.id = info.id_aluno 
       WHERE utilizador.id = ?`,
      [targetId]
    );

    const user = users[0];

    // Se não encontrou o user, fecha e avisa
    if (!user) {
      console.log("❌ Utilizador não encontrado na BD.");
      await db.end();
      return NextResponse.json({ message: "Utilizador não encontrado" }, { status: 404 });
    }

    console.log("✅ Utilizador encontrado:", user.nome);

    // 2. Verificar Token para amizade
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    let friendshipStatus = "NONE"; 

    if (token) {
      try {
        const decoded = jwt.verify(token.value, SECRET) as { id: number };
        const myId = decoded.id;

        if (Number(myId) === Number(targetId)) {
          friendshipStatus = "SELF"; 
        } else {
          // Verificar na tabela amizade
          const [friendship]: any = await db.execute(
            `SELECT * FROM amizade 
             WHERE (utilizador_id = ? AND amigo_id = ?) 
                OR (utilizador_id = ? AND amigo_id = ?)`,
            [myId, targetId, targetId, myId]
          );

          const relation = friendship[0];

          if (relation) {
            if (relation.estado === 'ACEITE') friendshipStatus = "ACCEPTED";
            else if (relation.estado === 'PENDENTE') friendshipStatus = "PENDING";
          }
        }
      } catch (err) {
        console.log("⚠️ Token inválido ou expirado.");
      }
    }

    await db.end();

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        foto_url: user.foto_url,
        curso: user.curso,
        ano_escolar: user.ano_escolar,
        bio: user.bio || "",
        interesses: user.interesses || ""
      },
      friendshipStatus: friendshipStatus 
    });

  } catch (error: any) {
    // ESTE LOG É O MAIS IMPORTANTE:
    console.error("🔥 ERRO SQL/SERVIDOR:", error.message);
    return NextResponse.json({ message: "Erro interno: " + error.message }, { status: 500 });
  }
}