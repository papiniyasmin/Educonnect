import { NextResponse, NextRequest } from "next/server";
import pool from "@/db.js"; 
import { getUserId } from "@/lib/auth"; 
import { RowDataPacket } from "mysql2"; 

// 1. INTERFACE: Define o "molde" dos dados que esperamos receber da base de dados.
// Isto garante que o TypeScript saiba exatamente quais colunas existem.
interface ChatItemRow extends RowDataPacket {
  id: number;
  nome: string;
  foto_url: string | null;
  type: string;
  sub: string;
}

export async function GET(req: NextRequest) {
  try {
    // 2. SEGURANÇA: Verifica se o utilizador tem sessão iniciada.
    const userId = getUserId(); 
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 3. ROTEAMENTO DINÂMICO: Lê o parâmetro "type" do endereço URL (ex: /api/chat?type=private)
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); 

    // 4. PERFORMANCE: Pede uma conexão "emprestada" ao Pool de conexões
    const connection = await pool.getConnection();

    try {
      let query = "";
      let params: any[] = [];

      // 5. LÓGICA DE DADOS: Escolhe qual pesquisa SQL fazer consoante o tipo pedido
      if (type === "private") {
        query = `
          SELECT 
            u.id, 
            u.nome, 
            u.foto_url,
            'private' as type,
            'Online' as sub
          FROM amizade a
          -- JOIN inteligente: Vai buscar os dados da OUTRA pessoa da amizade, e não os teus
          JOIN utilizador u ON u.id = CASE 
            WHEN a.utilizador_id = ? THEN a.amigo_id 
            WHEN a.amigo_id = ? THEN a.utilizador_id 
          END
          -- Garante que tu fazes parte da amizade e que o estado é 'ACEITE'
          WHERE (a.utilizador_id = ? OR a.amigo_id = ?)
          AND a.estado = 'ACEITE'
        `;
        params = [userId, userId, userId, userId];

      } else {
        // Query para procurar GRUPOS
        query = `
          SELECT 
            g.id, 
            g.nome, 
            '' as foto_url, -- Grupos não têm foto, enviamos vazio
            g.tipo as sub,
            'group' as type
          FROM grupo g
          INNER JOIN membro m ON m.grupo_id = g.id
          WHERE m.remetente_id = ?
        `;
        params = [userId];
      }

      // 6. EXECUÇÃO & TIPAGEM: Corre a query e "força" o TypeScript a entender 
      // que o resultado ('rows') é uma lista de objetos do tipo 'ChatItemRow'
      const [rows] = (await connection.execute(query, params)) as [ChatItemRow[], any];

      // 7. FORMATAÇÃO: Prepara os dados limpos para enviar para o Frontend
      const formattedItems = rows.map((item: ChatItemRow) => ({
        id: item.id,
        nome: item.nome,
        foto_url: item.foto_url || "", // Se for null, envia string vazia para não quebrar o layout
        tipo: item.type,
        sub: item.sub || "" 
      }));

      // 8. RESPOSTA: Envia os dados com sucesso para quem pediu (Frontend)
      return NextResponse.json({ items: formattedItems });

    } finally {
      connection.release();
    }

  } catch (error) {
    // 9. TRATAMENTO DE ERROS: Se algo falhar, evita que o site vá abaixo e avisa a consola
    console.error("Erro ao carregar lista de chat:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}