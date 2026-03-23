"use client";

import { useEffect, useState } from "react";
import { getContracts } from "../../../services/contracts";
import { ContractResponse } from "../../../types/contracts";
import { StatusBadge } from "../../../components/contracts/StatusBadge";
import { FileText, Download, Calendar, LayoutDashboard } from "lucide-react";

export default function ClientDashboard() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const data = await getContracts();
        // Filtra para não mostrar rascunhos ao cliente final
        const visibleContracts = data.filter((c) => c.status !== "DRAFT");
        setContracts(visibleContracts);
      } catch (error) {
        console.error("Erro ao carregar contratos do cliente:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Portal do Cliente
          </h1>
        </div>
        <div className="hidden md:block">
          <LayoutDashboard className="text-slate-300" size={40} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 gap-6">
        {contracts.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-500">
            Nenhum contrato encontrado vinculado à sua conta.
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-slate-800">
                        {contract.title}
                      </h2>
                      <StatusBadge status={contract.status} />
                    </div>
                    <p className="text-slate-500 text-sm max-w-2xl">
                      {contract.description}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Valor do Projeto
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(contract.totalValue)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Início</p>
                      <p>{new Date(contract.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">
                        Previsão de Término
                      </p>
                      <p>{new Date(contract.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Categoria</p>
                      <p>{contract.category || "Arquitetura"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ÁREA DE DOWNLOADS - Só aparece se pelo menos um dos arquivos existir */}
              {(contract.scannedContractUrl || contract.finalProjectUrl) && (
                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex flex-wrap gap-6">
                  {/* Link do Contrato Assinado */}
                  {contract.scannedContractUrl && (
                    <a
                      href={contract.scannedContractUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors group"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-md group-hover:bg-blue-200 transition-colors">
                        <Download size={14} />
                      </div>
                      Baixar Contrato Assinado
                    </a>
                  )}

                  {/* Link do Projeto Final */}
                  {contract.finalProjectUrl && (
                    <a
                      href={contract.finalProjectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors group"
                    >
                      <div className="p-1.5 bg-emerald-100 rounded-md group-hover:bg-emerald-200 transition-colors">
                        <Download size={14} />
                      </div>
                      Baixar Projeto Final (PDF)
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
}
