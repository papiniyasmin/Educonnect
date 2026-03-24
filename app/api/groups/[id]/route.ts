import { NextResponse } from 'next/server';
import pool from "@/db";

// =========================================================================
// GET: BUSCAR TODOS OS POSTS DE UM GRUPO ESPECÍFICO
// =========================================================================
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const groupId = params.id;
    
    // ---------------------------------------------------------
    // 1. BUSCAR IMEDIATAMENTE O UTILIZADOR
    // ---------------------------------------------------------

    const [rows]: any = await pool.query(`
      SELECT m.id, m.conteudo, m.data_envio, m.tipo, u.nome as authorName, u.foto_url as authorAvatar
      FROM mensagem m
      JOIN utilizador u ON m.id_utilizador = u.id
      WHERE m.id_grupo = ?
      ORDER BY m.data_envio DESC -- Garante que os posts mais recentes aparecem no topo
    `, [groupId]);

    // ---------------------------------------------------------
    // 2. PROCESSAR OS POSTS
    // ---------------------------------------------------------
    const posts = rows.map((row: any) => {
      let contentObj;
      
      try {
        // Tenta converter o conteúdo para um objeto JSON
        contentObj = JSON.parse(row.conteudo); 
      } catch (e) {
        // Se falhar, assume-se que o conteúdo é um texto simples
        contentObj = { texto_principal: row.conteudo, comentarios: [] };
      }

      // Constrói o "Post" final que vai viajar pela internet até ao browser do utilizador
      return {
        id: row.id,
        title: "Post do Grupo", 
        content: contentObj.texto_principal, 
        comentarios: contentObj.comentarios || [], 
        
        // Converte a data do formato do MySQL para um formato legível localmente
        timestamp: new Date(row.data_envio).toLocaleString(),
        
        type: row.tipo || 'geral',
        authorName: row.authorName,
        authorAvatar: row.authorAvatar
      };
    });

    return NextResponse.json(posts);
    
  } catch (error) {
    console.error("Erro ao buscar posts:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}