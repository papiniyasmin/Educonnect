import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";

// =========================================================================
// CONFIGURAÇÃO DA BASE DE DADOS E JWT
// =========================================================================
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "", // Deixa vazio se for o caso, ou põe "root" se não der
  database: "educonnect1", 
};

const SECRET = "EDUCONNECT_SECRET_2024";

// =========================================================================
// GET: Buscar Perfil Público de um Utilizador (e estado da amizade)
// =========================================================================
// O {ams: {id: string}} apanha o ID do utilizador através do link da página.
// Exemplo: se o link for /perfil/5, o targetId será "5".
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const targetId = params.id;

  console.log(` A tentar buscar perfil ID: ${targetId}`);

  try {
    // ---------------------------------------------------------
    // 1. ABRIR LIGAÇÃO À BASE DE DADOS
    // ---------------------------------------------------------
    const db = await mysql.createConnection(dbConfig);

    // ---------------------------------------------------------
    // 2. BUSCAR DADOS DO UTILIZADOR (JOIN)
    // ---------------------------------------------------------
    // CORREÇÃO APLICADA: Usar "utilizador.id" evita que a BD fique confusa
    // entre o "id" da tabela utilizador e o "id" da tabela info.
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

    // Se a pesquisa não devolver ninguém, avisamos o Frontend (Erro 404)
    if (!user) {
      console.log(" Utilizador não encontrado na BD.");
      await db.end(); // Fecha a ligação antes de sair!
      return NextResponse.json({ message: "Utilizador não encontrado" }, { status: 404 });
    }

    console.log("Utilizador encontrado:", user.nome);

    // ---------------------------------------------------------
    // 3. VERIFICAR O ESTADO DA AMIZADE
    // ---------------------------------------------------------
    const cookieStore = cookies();
    const token = cookieStore.get("token");
    let friendshipStatus = "NONE"; // Por defeito, assumimos que não são amigos

    // Só verificamos a amizade se a pessoa que está a ver o perfil tiver feito login (tiver token)
    if (token) {
      try {
        // Descodifica o token para saber quem é a pessoa que está a olhar para o ecrã
        const decoded = jwt.verify(token.value, SECRET) as { id: number };
        const myId = decoded.id;

        // Se o meu ID for igual ao ID do perfil que estou a ver, é o MEU perfil!
        if (Number(myId) === Number(targetId)) {
          friendshipStatus = "SELF"; 
        } else {
          // Se for outra pessoa, vamos à tabela 'amizade' ver se há alguma relação entre os dois
          const [friendship]: any = await db.execute(
            `SELECT * FROM amizade 
             WHERE (utilizador_id = ? AND amigo_id = ?) 
                OR (utilizador_id = ? AND amigo_id = ?)`,
            [myId, targetId, targetId, myId] // Testa as duas direções (fui eu que enviei ou foi ele?)
          );

          const relation = friendship[0];

          // Se existir um registo na tabela amizade, vemos se está pendente ou aceite
          if (relation) {
            if (relation.estado === 'ACEITE') friendshipStatus = "ACCEPTED";
            else if (relation.estado === 'PENDENTE') friendshipStatus = "PENDING";
          }
        }
      } catch (err) {
        console.log(" Token inválido ou expirado.");
        // Se o token for inválido, ignoramos o erro e mostramos o perfil na mesma (mas com status NONE)
      }
    }

    // ---------------------------------------------------------
    // 4. FECHAR LIGAÇÃO E DEVOLVER OS DADOS
    // ---------------------------------------------------------
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
      friendshipStatus: friendshipStatus // Envia o estado (NONE, PENDING, ACCEPTED, SELF)
    });

  } catch (error: any) {
    // ---------------------------------------------------------
    // 5. TRATAMENTO DE ERROS GRAVES
    // ---------------------------------------------------------
    console.error(" ERRO SQL/SERVIDOR:", error.message);
    return NextResponse.json({ message: "Erro interno: " + error.message }, { status: 500 });
  }
}