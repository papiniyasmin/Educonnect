import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import pool from "@/db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { getUserId } from "@/lib/auth";

// Define a estrutura que esperamos receber ao ler mensagens
interface MessageRow extends RowDataPacket {
  id: number;
  conteudo: string;
  timestamp: Date | string;
  senderName: string;
  senderId: number;
  senderAvatar: string | null;
}

// ==========================================
// 1. GET: LER AS MENSAGENS E MOSTRAR NO CHAT
// ==========================================
export async function GET(req: NextRequest) {
  // 1. Verifica se o utilizador tem o login feito
  const userId = getUserId(); 
  if (!userId) return NextResponse.json({ error: "Usuário não logado" }, { status: 401 });

  // 2. Lê os dados da URL (ex: ?type=group&id=5)
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (!id || !type) return NextResponse.json({ error: "Parâmetros em falta" }, { status: 400 });

  try {
    let query = "";
    let params: any[] = [];

    // 3. Define a pesquisa SQL consoante seja um chat de grupo ou particular
    if (type === "group") {
      query = `
        SELECT m.id, m.conteudo, m.data AS timestamp, u.nome AS senderName, u.id AS senderId, u.foto_url AS senderAvatar
        FROM mensagem_grupo mg 
        JOIN mensagem m ON mg.mensagem_id = m.id 
        JOIN membro mem ON mg.remetente_id = mem.id 
        JOIN utilizador u ON mem.remetente_id = u.id 
        WHERE mem.grupo_id = ? ORDER BY m.data ASC
      `;
      params = [id];
    } else {
      query = `
        SELECT m.id, m.conteudo, m.data AS timestamp, u.nome AS senderName, mp.remetente_id AS senderId, u.foto_url AS senderAvatar
        FROM mensagem_particular mp 
        JOIN mensagem m ON mp.mensagem_id = m.id 
        JOIN utilizador u ON mp.remetente_id = u.id 
        WHERE (mp.remetente_id = ? AND mp.destinatario_id = ?) 
           OR (mp.remetente_id = ? AND mp.destinatario_id = ?) 
        ORDER BY m.data ASC
      `;
      params = [userId, id, id, userId];
    }

    // Isto obriga o TypeScript a aceitar o resultado como um array de mensagens.
    const [rows] = (await pool.query(query, params)) as [MessageRow[], any];
    
    return NextResponse.json({ messages: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// 2. POST: GUARDAR A NOVA MENSAGEM NA BD
// E CRIAR NOTIFICAÇÕES AUTOMÁTICAS
// ==========================================
export async function POST(req: NextRequest) {
  // 1. Valida a segurança
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // 2. Verifica se o Frontend enviou todos os dados necessários
  if (!body.targetId || !body.content || !body.type) {
    return NextResponse.json({ error: "Campos inválidos" }, { status: 400 });
  }

  try {
    // TRUQUE PARA A BD NÃO DAR ERRO: Usar 'experiencia' e um título automático
    const tituloMsg = body.type === 'group' ? 'Mensagem de Grupo' : 'Mensagem Privada';

    // GUARDA A MENSAGEM NA TABELA PRINCIPAL
    const [msgResult] = (await pool.query(
      `INSERT INTO mensagem (conteudo, data, titulo, tipo) VALUES (?, NOW(), ?, ?)`,
      [body.content, tituloMsg, 'experiencia']
    )) as [ResultSetHeader, any];

    const novaMensagemId = msgResult.insertId; // Guarda o ID da mensagem acabada de criar

    if (body.type === 'group') {
      // ==========================================
      // LÓGICA DE GRUPO
      // ==========================================
      
      // Buscar o ID de membro (Na coluna utilizador chama-se remetente_id na tabela membro)
      const [membros] = (await pool.query(
        `SELECT id FROM membro WHERE remetente_id = ? AND grupo_id = ? LIMIT 1`,
        [userId, body.targetId]
      )) as [RowDataPacket[], any];

      // Se o utilizador for realmente membro do grupo, insere a relação
      if (membros.length > 0) {
        await pool.query(
          `INSERT INTO mensagem_grupo (remetente_id, mensagem_id) VALUES (?, ?)`,
          [membros[0].id, novaMensagemId]
        );

        // --- NOTIFICAÇÕES DE GRUPO ---
        try {
          // Ir buscar o nome do grupo
          const [grupoInfo] = (await pool.query(
            `SELECT nome FROM grupo WHERE id = ? LIMIT 1`, 
            [body.targetId]
          )) as [RowDataPacket[], any];
          
          const nomeGrupo = grupoInfo.length > 0 ? grupoInfo[0].nome : "um grupo";
          const textoNotificacao = `enviou uma nova mensagem no grupo ${nomeGrupo}.`;

          // Insere notificações para todos os membros do grupo, EXCETO quem enviou
          await pool.query(
            `INSERT INTO notificacao (utilizador_id, remetente_id, tipo, conteudo, lida)
             SELECT remetente_id, ?, 'mensagem_grupo', ?, 0
             FROM membro
             WHERE grupo_id = ? AND remetente_id != ?`,
            [userId, textoNotificacao, body.targetId, userId]
          );
        } catch (notifErr) {
          console.error("Erro a gerar notificações de grupo:", notifErr);
        }

      } else {
        return NextResponse.json({ error: "Não és membro deste grupo" }, { status: 403 });
      }

    } else {
      // ==========================================
      // LÓGICA DE MENSAGEM PRIVADA
      // ==========================================
      
      // MENSAGEM PARTICULAR: Insere a relação de quem enviou e quem recebe
      await pool.query(
        `INSERT INTO mensagem_particular (remetente_id, destinatario_id, mensagem_id) VALUES (?, ?, ?)`,
        [userId, body.targetId, novaMensagemId]
      );
      
      // --- NOTIFICAÇÃO PRIVADA ---
      try {
        await pool.query(
          `INSERT INTO notificacao (utilizador_id, remetente_id, tipo, conteudo, lida) 
           VALUES (?, ?, 'mensagem_privada', 'enviou-te uma nova mensagem.', 0)`,
          [body.targetId, userId]
        );
      } catch (notifErr) {
        console.error("Erro a gerar notificação privada:", notifErr);
      }
      
    }

    // 3. Retorna sucesso e o novo ID para o Frontend atualizar a interface
    return NextResponse.json({
      id: novaMensagemId,
      success: true
    });

  } catch (err: any) {
    console.error("Erro ao enviar mensagem:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}