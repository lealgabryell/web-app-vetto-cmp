"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../../../../services/users";
import ProfileForm from "../../../../components/users/ProfileForm";
import { Loader2 } from "lucide-react";

export default function PerfilPage() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getMyProfile,
    // O React Query tentará buscar assim que a página carregar
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="animate-spin text-blue-600 mb-2" size={40} />
      <p className="text-slate-500">Carregando seus dados...</p>
    </div>
  );

  if (error) return <div className="p-20 text-center text-red-500">Erro ao carregar perfil.</div>;

  return (
    <main className="max-w-4xl mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500">Gerencie suas informações pessoais e endereço.</p>
      </header>
      
      {user && <ProfileForm user={user} />}
    </main>
  );
}