"use client";

import { useQuery } from "@tanstack/react-query";
import { getMeetings } from "../../services/scheduling";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import ScheduleDashboard from "./ScheduleDashboard";
import Cookie from "js-cookie";

export default function CalendarContainer() {
  const role = (Cookie.get("user_role") as "ADMIN" | "CLIENT") || "CLIENT";

  const {
    data: meetings,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["meetings"], // Identificador único do cache
    queryFn: getMeetings, // Sua função do service
  });

  if (isLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Carregando sua agenda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-red-50 rounded-lg border border-red-200">
        <AlertCircle className="text-red-500 mb-2" size={32} />
        <h3 className="text-red-800 font-semibold">
          Erro ao sincronizar dados
        </h3>
        <p className="text-red-600 text-sm mb-4">{(error as Error).message}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={16} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Indicador sutil de que está atualizando em background */}
      {isFetching && !isLoading && (
        <div className="absolute top-2 right-2">
          <Loader2 className="animate-spin text-blue-500" size={16} />
        </div>
      )}

      <ScheduleDashboard meetings={meetings || []} role={role} />
    </div>
  );
}
