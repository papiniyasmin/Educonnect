"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define a estrutura dos dados que vêm da Base de Dados
interface Utilizador {
  id: number;
  nome: string;
  email: string;
  curso: string;
  ano_escolar: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<Utilizador[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Carrega os utilizadores assim que a página abre
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");

      // Se não for o admin (Erro 401 ou 403), expulsa-o para o feed!
      if (res.status === 401 || res.status === 403) {
        router.push("/dashboard"); 
        return;
      }

      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Erro ao carregar utilizadores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    // Alerta duplo para evitar acidentes
    if (!confirm(`⚠️ ATENÇÃO: Tens a certeza absoluta que queres apagar o utilizador "${nome}"?\n\nEsta ação não pode ser desfeita e irá apagar todos os dados deste aluno!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Utilizador apagado com sucesso!");
        // Remove a pessoa da tabela instantaneamente sem precisar de dar F5
        setUsers(users.filter((user) => user.id !== id));
      } else {
        const data = await res.json();
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error("Erro ao apagar:", error);
      alert("Ocorreu um erro de rede ao tentar apagar o utilizador.");
    }
  };

  // Ecrã enquanto verifica se a pessoa tem permissão
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f4f6f8" }}>
        <h2 style={{ color: "#333" }}>A verificar permissões e a carregar o painel... ⏳</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f6f8", padding: "40px 20px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        
        {/* Cabeçalho */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <div>
            <h1 style={{ color: "#2c3e50", margin: "0 0 5px 0" }}>🛡️ Painel de Administração</h1>
            <p style={{ color: "#7f8c8d", margin: 0 }}>Gestão de Utilizadores do EduConnect</p>
          </div>
          <Link 
            href="/dashboard" 
            style={{ padding: "10px 20px", backgroundColor: "#ecf0f1", color: "#2c3e50", textDecoration: "none", borderRadius: "6px", fontWeight: "bold" }}
          >
            Voltar ao Feed
          </Link>
        </header>

        {/* Tabela de Utilizadores */}
        <div style={{ backgroundColor: "#fff", borderRadius: "10px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#34495e", color: "#fff" }}>
                <th style={{ padding: "15px 20px" }}>ID</th>
                <th style={{ padding: "15px 20px" }}>Nome</th>
                <th style={{ padding: "15px 20px" }}>Email</th>
                <th style={{ padding: "15px 20px" }}>Curso (Ano)</th>
                <th style={{ padding: "15px 20px", textAlign: "center" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #ecf0f1", transition: "0.2s" }}>
                  <td style={{ padding: "15px 20px", color: "#7f8c8d" }}>#{user.id}</td>
                  <td style={{ padding: "15px 20px", fontWeight: "bold", color: "#2c3e50" }}>{user.nome}</td>
                  <td style={{ padding: "15px 20px", color: "#7f8c8d" }}>{user.email}</td>
                  <td style={{ padding: "15px 20px", color: "#7f8c8d" }}>
                    {user.curso ? `${user.curso} (${user.ano_escolar})` : "N/A"}
                  </td>
                  <td style={{ padding: "15px 20px", textAlign: "center" }}>
                    {user.nome !== "admin" ? (
                      <button
                        onClick={() => handleDelete(user.id, user.nome)}
                        style={{ backgroundColor: "#e74c3c", color: "white", border: "none", padding: "8px 15px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                      >
                        Apagar
                      </button>
                    ) : (
                      <span style={{ color: "#27ae60", fontWeight: "bold" }}>Administrador</span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "#999" }}>
                    Não existem utilizadores para apresentar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}