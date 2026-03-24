import { NextResponse } from "next/server";
import pool from "@/db"; // Importa a ligação à BD (agora com a regra de segurança SSL)

// =========================================================================
// OBRIGA A API A NÃO GUARDAR CACHE
// =========================================================================
// Como os administradores do EduConnect podem vir a adicionar ou remover 
// tópicos no futuro, queremos que esta lista esteja sempre atualizada em tempo real.
export const dynamic = 'force-dynamic';

// =========================================================================
// GET: Buscar a lista de Tópicos (Categorias)
// =========================================================================
export async function GET() {
  let connection;
  
  try {
    // ---------------------------------------------------------
    // 1. ABRIR LIGAÇÃO À BASE DE DADOS
    // ---------------------------------------------------------
    // Pedimos uma ligação específica ao pool protegido para podermos 
    // controlá-la e fechá-la corretamente no final.
    connection = await pool.getConnection();
    
    // ---------------------------------------------------------
    // 2. EXECUTAR A QUERY
    // ---------------------------------------------------------
    // Vai buscar o ID e o Nome de todos os tópicos e organiza-os por ordem alfabética (ASC).
    // Adicionei o ': any' para prevenir o erro "Untyped function calls" do TypeScript!
    const [rows]: any = await connection.execute(
        "SELECT id, nome FROM topico ORDER BY nome ASC"
    );
    
    // ---------------------------------------------------------
    // 3. ENVIAR RESPOSTA
    // ---------------------------------------------------------
    // Envia a lista diretamente para o Frontend (React) usar nos formulários.
    return NextResponse.json(rows);

  } catch (error) {
    // ---------------------------------------------------------
    // 4. TRATAMENTO DE ERRO
    // ---------------------------------------------------------
    console.error("Erro ao buscar tópicos:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });

  } finally {
    // ---------------------------------------------------------
    // 5. LIBERTAR A LIGAÇÃO (CRÍTICO)
    // ---------------------------------------------------------
    // O bloco 'finally' executa SEMPRE, quer a operação tenha corrido bem ou dado erro.
    // O 'release()' devolve a ligação ao pool para o próximo utilizador poder usar, 
    // evitando que o servidor encrave por limite de conexões!
    if (connection) connection.release(); 
  }
}