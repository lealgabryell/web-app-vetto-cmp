"use client";

import { useRef, useState } from "react";
import { ContractStepResponse, EtapaStatus } from "../../types/contracts";

export interface StepItemProps {
  etapa: ContractStepResponse;
  contractId: string;
  loggedUserId?: string;
  isAdmin?: boolean;
  onStatusChange?: (newStatus: EtapaStatus) => void;
  onEdit?: (etapa: ContractStepResponse) => void;
  onUploadPdf?: (file: File) => Promise<void>;
  onApprove?: (stepId: string) => void;
  onRequestApproval?: (stepId: string) => void;
}

export default function StepItem({
  etapa,
  contractId,
  loggedUserId,
  isAdmin = false,
  onStatusChange,
  onEdit,
  onUploadPdf,
  onApprove,
  onRequestApproval,
}: StepItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [approvalRequested, setApprovalRequested] = useState(false);

  // Detect if the logged user is a pending approver
  const myApproval = loggedUserId
    ? etapa.aprovadores.find((a) => a.id === loggedUserId)
    : undefined;
  const canApprove = !!myApproval && !myApproval.aprovado;

  // Detect if the logged user is a responsavel and there are pending approvers
  const isResponsavel = loggedUserId
    ? etapa.responsaveis.some((r) => r.id === loggedUserId)
    : false;
  const isAprovador = loggedUserId
    ? etapa.aprovadores.some((a) => a.id === loggedUserId)
    : false;
  const hasPendingApprovers = etapa.aprovadores.some((a) => !a.aprovado);
  const canRequestApproval = isResponsavel && !isAprovador && hasPendingApprovers;
  const statusConfig = {
    PROGRAMADA: {
      label: "Programada",
      color: "border-l-4 border-slate-300 bg-slate-50 text-slate-600",
    },
    EM_ANDAMENTO: {
      label: "Em Andamento",
      color: "border-l-4 border-blue-500 bg-blue-50 text-blue-700",
    },
    CONCLUIDA: {
      label: "Concluída",
      color: "border-l-4 border-green-500 bg-green-50 text-green-700",
    },
    CANCELADA: {
      label: "Cancelada",
      color: "border-l-4 border-red-500 bg-red-50 text-red-700",
    },
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPdf) return;
    setUploading(true);
    try {
      await onUploadPdf(file);
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setApproving(true);
    try {
      await onApprove(etapa.id);
    } finally {
      setApproving(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!onRequestApproval) return;
    setRequesting(true);
    try {
      await onRequestApproval(etapa.id);
      setApprovalRequested(true);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div
      className={`flex flex-col p-4 rounded-lg shadow-sm border border-slate-100 transition-all ${statusConfig[etapa.status].color}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold text-slate-800">{etapa.titulo}</p>
          <div className="flex flex-col gap-1 mt-1">
            {/* Responsáveis */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Resp.:</span>
              {etapa.responsaveis.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Não atribuído</span>
              ) : (
                etapa.responsaveis.map((u) => (
                  <span
                    key={u.id}
                    title={u.email}
                    className="text-[10px] font-medium bg-white/70 border border-current/20 rounded-full px-2 py-0.5"
                  >
                    {u.name}
                  </span>
                ))
              )}
            </div>
            {/* Aprovadores */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">Aprov.:</span>
              {etapa.aprovadores.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Não atribuído</span>
              ) : (
                etapa.aprovadores.map((a) => (
                  <span
                    key={a.id}
                    title={a.aprovado ? `Aprovado em ${new Date(a.aprovadoEm!).toLocaleString('pt-BR')}` : 'Aguardando aprovação'}
                    className="text-[10px] font-medium bg-white/70 border border-current/20 rounded-full px-2 py-0.5 flex items-center gap-1"
                  >
                    {a.aprovado ? '\u2705' : '\u2B1C'} {a.name}
                    {a.aprovadoEm && (
                      <span className="text-gray-400 ml-1">
                        {new Date(a.aprovadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </span>
                ))
              )}
            </div>
            <p className="text-[10px] uppercase tracking-wider font-medium opacity-70">
              📅 Prev: {new Date(etapa.previsaoConclusao).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex flex-row items-end gap-2">
          {/* BOTÃO DE UPLOAD PDF */}
          {isAdmin && onUploadPdf && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                title="Anexar PDF à etapa"
              >
                {uploading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 animate-spin">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                )}
              </button>
            </>
          )}

          {/* BOTÃO DE EDITAR (Lápis) */}
          {isAdmin && onEdit && (
            <button 
              onClick={() => onEdit(etapa)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar dados da etapa"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
            </button>
          )}
          {isAdmin ? (
            <select
              defaultValue={etapa.status}
              onChange={(e) => onStatusChange?.(e.target.value as EtapaStatus)}
              className="text-xs p-1.5 border rounded-md bg-white font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm"
            >
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          ) : (
            <span className="text-[10px] font-bold uppercase px-2 py-1 bg-white/50 rounded shadow-sm">
              {statusConfig[etapa.status].label}
            </span>
          )}
        </div>
      </div>

      {/* Instrução */}
      {etapa.instrucao && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <span className="font-semibold">📋 Instrução: </span>
          {etapa.instrucao}
        </div>
      )}

      {/* Botão de aprovação */}
      {canApprove && onApprove && (
        <div className="mt-3">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
          >
            {approving ? 'Registrando...' : '✓ Aprovar esta etapa'}
          </button>
        </div>
      )}

      {/* Botão de pedir aprovação */}
      {canRequestApproval && onRequestApproval && (
        <div className="mt-3">
          <button
            onClick={handleRequestApproval}
            disabled={requesting || approvalRequested}
            className="w-full py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {requesting ? 'Enviando...' : approvalRequested ? '✔ Pedido enviado' : '🔔 Pedir aprovação da etapa'}
          </button>
        </div>
      )}

      {/* Lista de PDFs anexados */}
      {etapa.pdfUrls && etapa.pdfUrls.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current/10 flex flex-wrap gap-2">
          {etapa.pdfUrls.map((url, index) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 hover:text-blue-800 bg-white/70 px-2 py-0.5 rounded border border-blue-200 hover:border-blue-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              PDF {index + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
