"use client"; 

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Check, User, Clock } from "lucide-react";

// =========================================================================
// INTERFACES (Tipagens do TypeScript)
// =========================================================================
interface UserProfile {
  id: number;
  nome: string;
  email: string;
  foto_url: string;
  curso: string;
  ano_escolar: string;
  bio: string;
  interesses: string;
}

export default function UserProfilePage() {
  // =========================================================================
  // HOOKS DE ROTEAMENTO E PARÂMETROS
  // =========================================================================
  const params = useParams(); // Extrai os parâmetros dinâmicos do URL. Se o URL for /profile/5, params.id será "5"
  const router = useRouter(); // Permite navegar programaticamente (ex: voltar atrás na página)
  const targetId = params.id as string; // O ID do utilizador que estamos a visualizar

  // =========================================================================
  // ESTADOS DO COMPONENTE
  // =========================================================================
  const [profile, setProfile] = useState<UserProfile | null>(null); // Guarda os dados do perfil visualizado
  // Controla a relação entre o utilizador logado e o utilizador do perfil:
  // "LOADING" -> A carregar, "NONE" -> Sem relação, "PENDING" -> Pedido enviado, "ACCEPTED" -> Amigos, "SELF" -> É o próprio perfil
  const [friendshipStatus, setFriendshipStatus] = useState("LOADING"); 
  const [isLoading, setIsLoading] = useState(true); // Controla o ecrã de carregamento inicial

  // =========================================================================
  // EFFECTS (Carregamento de Dados Iniciais)
  // =========================================================================
  // 1. Carregar dados do perfil e estado da amizade
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Faz um pedido à API passando o ID do utilizador alvo
        const res = await fetch(`/api/user/${targetId}/details`);
        
        if (!res.ok) {
           throw new Error("Erro ao carregar perfil");
        }

        const data = await res.json();
        
        // Atualiza os estados com a resposta da API
        setProfile(data.user);
        setFriendshipStatus(data.friendshipStatus);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false); // Retira o estado de carregamento, quer tenha sucesso ou erro
      }
    };

    // Só faz o pedido se existir um ID válido no URL
    if (targetId) {
      fetchData();
    }
  }, [targetId]); // O efeito corre sempre que o targetId mudar

  // =========================================================================
  // HANDLERS (Ações do Utilizador)
  // =========================================================================
  // 2. Função para enviar pedido de amizade
  const handleSendRequest = async () => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST", // POST porque estamos a criar um novo registo/pedido
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }), // Envia a quem queremos pedir amizade
      });

      if (res.ok) {
        // Optimistic UI: Se correu bem, atualiza logo o estado local para "Pendente" 
        // sem precisar de recarregar a página ou fazer novo fetch.
        setFriendshipStatus("PENDING");
      } else {
        // Se houver erro (ex: pedido já existe), mostra alerta
        const err = await res.json();
        alert(err.message || "Erro ao enviar pedido");
      }
    } catch (error) {
      console.error("Erro no pedido:", error);
    }
  };

  // =========================================================================
  // RENDERIZAÇÃO CONDICIONAL (Ecrãs de erro e carregamento)
  // =========================================================================
  // Mostra um estado intermédio enquanto a API não responde
  if (isLoading) return <div className="p-10 text-white">A carregar perfil...</div>;
  
  // Se a API não encontrou o utilizador (ex: ID que não existe na BD)
  if (!profile) return <div className="p-10 text-white">Utilizador não encontrado.</div>;

  // =========================================================================
  // RENDERIZAÇÃO DA INTERFACE PRINCIPAL (JSX)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      
      {/* Botão Voltar: Usa o router.back() para regressar à página anterior do histórico do browser */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-slate-300">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      {/* Cartão de Perfil */}
      <div className="max-w-3xl mx-auto bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          {/* Foto de Perfil */}
          <Avatar className="w-32 h-32 border-4 border-emerald-600">
            {/* Tenta usar a foto, senão usa undefined para forçar o Fallback */}
            <AvatarImage src={profile.foto_url || undefined} />
            <AvatarFallback className="bg-emerald-800 text-3xl">
              {profile.nome[0]} {/* Mostra a primeira letra do nome caso não haja foto */}
            </AvatarFallback>
          </Avatar>

          {/* Informações Pessoais do Utilizador */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{profile.nome}</h1>
            <p className="text-slate-400 mb-4">{profile.ano_escolar} - {profile.curso}</p>
            
            {/* Bio e Interesses (Só renderizam se o utilizador tiver preenchido estes campos) */}
            <div className="space-y-4 mb-6">
              {profile.bio && (
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <span className="text-emerald-400 text-sm font-bold block mb-1">Sobre</span>
                  <p className="text-sm text-slate-300">{profile.bio}</p>
                </div>
              )}
              
              {profile.interesses && (
                <div className="bg-slate-900/50 p-3 rounded-lg">
                  <span className="text-emerald-400 text-sm font-bold block mb-1">Interesses</span>
                  <p className="text-sm text-slate-300">{profile.interesses}</p>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* LÓGICA DO BOTÃO DE AMIZADE (Renderização baseada no estado) */}
            {/* ========================================================= */}
            <div className="mt-4">
              
              {/* Se o utilizador logado está a ver o seu próprio perfil */}
              {friendshipStatus === "SELF" && (
                 <Button variant="outline" className="border-slate-600">
                   <User className="mr-2 h-4 w-4" /> Este é o teu perfil
                 </Button>
              )}

              {/* Se já são amigos */}
              {friendshipStatus === "ACCEPTED" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-default">
                  <Check className="mr-2 h-4 w-4" /> Amigos
                </Button>
              )}

              {/* Se o pedido foi enviado mas ainda não foi aceite */}
              {friendshipStatus === "PENDING" && (
                <Button className="bg-yellow-600 hover:bg-yellow-700 cursor-not-allowed opacity-90">
                  <Clock className="mr-2 h-4 w-4" /> Pedido Pendente
                </Button>
              )}

              {/* Se não há nenhuma relação de amizade entre os dois */}
              {friendshipStatus === "NONE" && (
                <Button 
                  onClick={handleSendRequest} // Clica para adicionar
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Adicionar Amigo
                </Button>
              )}
              
            </div>
           

          </div>
        </div>
      </div>
    </div>
  );
}