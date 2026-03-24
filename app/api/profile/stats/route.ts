import { NextResponse } from "next/server";
import pool from "@/db"; 
import { getUserId } from "@/lib/auth";

// =========================================================================
// OBRIGA A API A NÃO GUARDAR CACHE
// =========================================================================
// O Next.js adora guardar as páginas em memória (cache) para ser mais rápido.
// O 'force-dynamic' obriga o servidor a ir sempre à base de dados buscar os 
// dados mais recentes, para que as tuas estatísticas atualizem na hora!
export const dynamic = 'force-dynamic';

// =========================================================================
// FUNÇÃO AUXILIAR: Formatar a Data 
// =========================================================================
// Esta função pega numa data da base de dados e transforma-a em texto amigável
// Exemplo: Em vez de "2024-05-20T10:00:00Z", devolve "Há 2 dias" ou "Recentemente".
function formatRelativeTime(dateString: string | Date) {
  const date = new Date(dateString);
  const now = new Date();
  
  // Calcula a diferença em segundos entre o momento atual e a data do post
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Converte os segundos para dias e horas
  const days = Math.floor(diffInSeconds / 86400);
  const hours = Math.floor(diffInSeconds / 3600);

  if (days > 0) return `Há ${days} dia${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
  return "Recentemente";
}

// =========================================================================
// GET: Buscar todos os dados do Perfil do Utilizador
// =========================================================================
export async function GET(request: Request) {
  // ---------------------------------------------------------
  // 1. VERIFICAR AUTENTICAÇÃO
  // ---------------------------------------------------------
  // Usa a tua função auxiliar para ir ler o token guardado nos cookies
  const userId = getUserId();

  // Se não houver ID, o utilizador não tem o login feito.
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    // ---------------------------------------------------------
    // 2. ESTATÍSTICAS (Posts, Grupos e Respostas)
    // ---------------------------------------------------------
    // O COUNT(*) é super rápido na base de dados, devolve apenas o número total de linhas.
    // Usamos : any para o TypeScript não reclamar dos tipos de retorno do MySQL.

    // Conta quantos posts gerais este utilizador fez
    const [postsRows]: any = await pool.query("SELECT COUNT(*) as total FROM mensagem_geral WHERE remetente_id = ?", [userId]);
    
    // Conta a quantos grupos este utilizador pertence
    const [groupsRows]: any = await pool.query("SELECT COUNT(*) as total FROM membro WHERE remetente_id = ?", [userId]);
    
    // Conta quantas mensagens este utilizador enviou dentro de grupos
    const [groupMsgRows]: any = await pool.query(
      `SELECT COUNT(*) as total FROM mensagem_grupo mg JOIN membro m ON mg.remetente_id = m.id WHERE m.remetente_id = ?`, 
      [userId]
    );

    // Guardamos tudo num objeto limpo. O "|| 0" garante que se vier vazio, mostramos zero em vez de dar erro.
    const stats = {
      posts: postsRows[0].total || 0,
      grupos: groupsRows[0].total || 0, 
      respostas: groupMsgRows[0].total || 0,
    };

    // ---------------------------------------------------------
    // 3. ATIVIDADE RECENTE (Últimos 3 posts)
    // ---------------------------------------------------------
    // Vamos buscar os últimos 3 posts que esta pessoa publicou no feed geral
    const [activityRows]: any = await pool.query(
      `SELECT m.id, m.titulo, m.data FROM mensagem m JOIN mensagem_geral mg ON m.id = mg.mensagem_id WHERE mg.remetente_id = ? ORDER BY m.data DESC LIMIT 3`,
      [userId]
    );

    // Usamos o .map() para transformar o formato da base de dados no formato que o React espera
    const recentActivity = activityRows.map((item: any) => ({
      id: item.id,
      type: "post", 
      title: item.titulo || "Sem título",
      date: formatRelativeTime(item.data), // Chamamos a nossa função de data amigável!
    }));

    // ---------------------------------------------------------
    // 4. INFO COMPLETA (Bio e Interesses)
    // ---------------------------------------------------------
    // Vamos buscar os dados extra de perfil à tabela 'info'
    const [infoRows]: any = await pool.query(
        "SELECT bio, interesses FROM info WHERE aluno_id = ?",
        [userId]
    );

    let interests: string[] = [];
    let bio = ""; 

    if (infoRows.length > 0) {
        // Se houver interesses guardados (ex: "Matemática, Física"), cortamos pela vírgula (split) 
        // e limpamos os espaços em branco (trim) para criar um array perfeito para o Frontend.
        if (infoRows[0].interesses) {
            interests = infoRows[0].interesses.split(',').map((i: string) => i.trim());
        }
        if (infoRows[0].bio) {
            bio = infoRows[0].bio;
        }
    } else {
        // Se o utilizador ainda não preencheu o perfil, mostramos uma tag padrão
        interests = ["Geral"];
    }

    // ---------------------------------------------------------
    // 5. ENVIAR RESPOSTA FINAL
    // ---------------------------------------------------------
    // Empacotamos as Estatísticas, Interesses, Atividade e Bio e mandamos para o ecrã do perfil!
    return NextResponse.json({
      stats,
      interests,
      recentActivity,
      bio 
    });

  } catch (error) {
    console.error("Erro na API Profile:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}