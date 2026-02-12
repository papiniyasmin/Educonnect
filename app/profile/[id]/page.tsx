"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, UserPlus, Check, User, Clock } from "lucide-react";

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
  const params = useParams(); // Pega o ID da URL (ex: 5)
  const router = useRouter();
  const targetId = params.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState("LOADING"); // LOADING, NONE, PENDING, ACCEPTED, SELF
  const [isLoading, setIsLoading] = useState(true);

  // 1. Carregar dados do perfil e estado da amizade
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Chama a API que criámos antes (api/users/[id]/details)
        const res = await fetch(`/api/user/${targetId}/details`);
        
        if (!res.ok) {
           throw new Error("Erro ao carregar perfil");
        }

        const data = await res.json();
        setProfile(data.user);
        setFriendshipStatus(data.friendshipStatus);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (targetId) {
      fetchData();
    }
  }, [targetId]);

  // 2. Função para enviar pedido de amizade
  const handleSendRequest = async () => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId }),
      });

      if (res.ok) {
        // Se correu bem, muda o botão para "Pendente"
        setFriendshipStatus("PENDING");
      } else {
        const err = await res.json();
        alert(err.message || "Erro ao enviar pedido");
      }
    } catch (error) {
      console.error("Erro no pedido:", error);
    }
  };

  if (isLoading) return <div className="p-10 text-white">A carregar perfil...</div>;
  if (!profile) return <div className="p-10 text-white">Utilizador não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6 text-slate-300">
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="max-w-3xl mx-auto bg-slate-800 rounded-xl p-8 border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          
          {/* Foto de Perfil */}
          <Avatar className="w-32 h-32 border-4 border-emerald-600">
            <AvatarImage src={profile.foto_url || undefined} />
            <AvatarFallback className="bg-emerald-800 text-3xl">
              {profile.nome[0]}
            </AvatarFallback>
          </Avatar>

          {/* Info do Utilizador */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{profile.nome}</h1>
            <p className="text-slate-400 mb-4">{profile.ano_escolar} - {profile.curso}</p>
            
            {/* Bio e Interesses */}
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

            {/* AQUI ESTÁ A LÓGICA DO BOTÃO */}
            <div className="mt-4">
              {friendshipStatus === "SELF" && (
                 <Button variant="outline" className="border-slate-600">
                   <User className="mr-2 h-4 w-4" /> Este é o teu perfil
                 </Button>
              )}

              {friendshipStatus === "ACCEPTED" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700 cursor-default">
                  <Check className="mr-2 h-4 w-4" /> Amigos
                </Button>
              )}

              {friendshipStatus === "PENDING" && (
                <Button className="bg-yellow-600 hover:bg-yellow-700 cursor-not-allowed opacity-90">
                  <Clock className="mr-2 h-4 w-4" /> Pedido Pendente
                </Button>
              )}

              {friendshipStatus === "NONE" && (
                <Button 
                  onClick={handleSendRequest}
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