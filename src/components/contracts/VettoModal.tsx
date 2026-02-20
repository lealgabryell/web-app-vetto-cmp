"use-client";

import { ContractResponse } from "@/src/types/contracts";
import VettoTrigger from "./VettoTrigger";
import { useEffect, useState } from "react";

interface VettoAnalysisModalProps {
  contract: ContractResponse;
  isOpen: boolean;
  onClose: () => void;
}

export const VettoAnalysisModal = ({
  contract,
  isOpen,
  onClose,
}: VettoAnalysisModalProps) => {
  const [isVettoOpen, setIsVettoOpen] = useState(false);

  const [displayedText, setDisplayedText] = useState("");
  const fullText = contract.aiAnalysisSummary ?? "Resumo não disponível.";

  useEffect(() => {
    // Só inicia se a modal estiver aberta
    if (isOpen) {
      setDisplayedText(""); // Limpa o texto anterior

      let currentCharacterIndex = 0;

      // Pequeno delay para começar a digitar após a modal abrir visualmente
      const startDelay = setTimeout(() => {
        const interval = setInterval(() => {
          setDisplayedText((prev) =>
            fullText.slice(0, currentCharacterIndex + 1),
          );
          currentCharacterIndex++;

          if (currentCharacterIndex >= fullText.length) {
            clearInterval(interval);
          }
        }, 15);

        return () => clearInterval(interval);
      }, 300); // Espera 300ms para começar

      return () => {
        clearTimeout(startDelay);
        setDisplayedText("");
      };
    }
  }, [isOpen, fullText]); // Re-executa se a modal abrir ou o texto mudar

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
        <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col gap-3 max-h-[90vh]">
          {/* Header da Modal de Detalhes */}
          <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-3xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {contract.title}
              </h2>
              <p className="text-sm text-slate-500">ID: {contract.id}</p>
            </div>

            <div className="flex items-center gap-6">
              {/* O GATILHO DO VETTO */}
              <VettoTrigger
                contract={contract}
                onClick={() => setIsVettoOpen(true)}
              />

              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 1. SEÇÃO DE RESUMO E INDICADORES (Topo da Modal) */}
          <div className="flex flex-col px-4 pt-2 space-y-6">
            {/* Cards de Indicadores (Score e Categoria) */}
            <div className="flex flex-wrap gap-4">
              {/* Flag de Risco */}
              <div
                className={`flex flex-col p-3 rounded-xl border min-w-35 ${
                  (contract.aiRiskScore ?? 0) <= 30
                    ? "bg-green-50 border-green-200"
                    : (contract.aiRiskScore ?? 0) <= 70
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Score de Risco
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      (contract.aiRiskScore ?? 0) <= 30
                        ? "text-green-600"
                        : (contract.aiRiskScore ?? 0) <= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {contract.aiRiskScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/100</span>
                </div>
              </div>

              {/* Flag de Categoria */}
              <div className="flex flex-col p-3 bg-slate-50 border border-slate-200 rounded-xl min-w-35">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Categoria
                </span>
                <span className="text-sm font-bold text-slate-700 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  {contract.category || "Não definida"}
                </span>
              </div>
            </div>

            {/* Bloco de Resumo da IA */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 relative overflow-hidden">
              {/* Detalhe estético lateral */}
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>

              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span>📝</span> Resumo Executivo
              </h3>
              <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
                <p className="text-slate-300 font-mono text-sm leading-relaxed">
                  <span className="text-blue-400 mr-2">{">"}</span>
                  {displayedText}
                  <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle"></span>
                </p>
              </div>
            </div>
          </div>

          {/* Clausulas*/}
          {/* Adicionei 'pb-10' para garantir o respiro no final e 'px-4' para afastar das laterais */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            <div className="flex flex-col mt-8 px-4 pb-10 space-y-4">
              <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">
                    Cláusulas Chave Identificadas
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-tight">
                    Processado por Vetto
                  </p>
                </div>
              </div>
              {contract.keyClauses && contract.keyClauses.length > 0 ? (
                <div className="grid gap-3">
                  {contract.keyClauses.map((clausula, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 flex gap-4 
                     hover:border-blue-300 hover:shadow-md hover:shadow-blue-50 transition-all duration-200"
                    >
                      <div
                        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 
                          text-blue-500 font-bold text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors"
                      >
                        {index + 1}
                      </div>

                      <div className="flex-1 leading-relaxed pt-1">
                        {clausula}
                      </div>
                    </div>
                  ))}

                  {/* ESPAÇADOR EXTRA: Uma alternativa segura para garantir que o scroll nunca termine colado */}
                  <div className="h-4" aria-hidden="true" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <span className="text-2xl mb-2 opacity-40">📑</span>
                  <p className="text-sm text-slate-500 italic font-medium">
                    Nenhuma cláusula extraída.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* A MODAL DO VETTO QUE CRIAMOS ANTERIORMENTE */}
      <VettoAnalysisModal
        contract={contract}
        isOpen={isVettoOpen}
        onClose={() => setIsVettoOpen(false)}
      />
    </>
  );
};
