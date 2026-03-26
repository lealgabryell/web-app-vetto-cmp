'use client';

import { memo } from "react";
import { ContractResponse, ContractStatus } from "../../types/contracts";

interface ContractRowItemProps {
  contract: ContractResponse;
  statusConfig: Record<ContractStatus, { label: string; color: string }>;
  onSelect: (contract: ContractResponse) => void;
  onOpenClientDetails: (clientId: string, contract: ContractResponse) => void;
}

const MONTH_NAMES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_NAMES = ["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"];

function formatPaymentSchedule(c: ContractResponse): string {
  const { tipoRecorrencia: tipo, diaPagamento: dia, segundoDiaPagamento: dia2, mesPagamento: mes, dataPagamentoAnual: dataAnual } = c;
  if (!tipo) return "";
  if (tipo === "MENSAL" && dia) return `Todo dia ${dia}`;
  if (tipo === "QUINZENAL" && dia && dia2) return `Dias ${dia} e ${dia2}`;
  if (tipo === "SEMESTRAL" && dia && mes) return `Dia ${dia} de ${MONTH_NAMES[mes - 1]}`;
  if (tipo === "ANUAL" && dataAnual) return new Date(dataAnual + "T00:00:00").toLocaleDateString("pt-BR");
  if (tipo === "SEMANAL" && dia) return WEEKDAY_NAMES[dia - 1] ?? "";
  return "";
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function ContractRowItem({ contract, statusConfig, onSelect, onOpenClientDetails }: ContractRowItemProps) {
  const daysLeft = Math.ceil(
    (new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  const isRecorrente = !!contract.recorrencia || !!contract.tipoRecorrencia;
  const paymentSchedule = isRecorrente ? formatPaymentSchedule(contract) : "";

  return (
    <div
      onClick={() => onSelect(contract)}
      className="w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 min-w-0">
        {/* Lado esquerdo: título + cliente + datas */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate leading-snug">
              {contract.title}
            </p>
            {daysLeft <= 45 && daysLeft >= 0 && (
              <span className="flex-shrink-0 text-[9px] font-bold bg-red-100 text-red-600 border border-red-300 rounded px-1 py-0.5 leading-none">
                🚩 {daysLeft}d
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenClientDetails(contract.clientId, contract);
            }}
            className="text-[11px] text-blue-500 hover:text-blue-700 hover:underline truncate mt-0.5 block text-left"
          >
            {contract.clientName}
          </button>

          <p className="text-[10px] text-slate-400 mt-1">
            {new Date(contract.startDate).toLocaleDateString("pt-BR")}
            {" → "}
            {new Date(contract.endDate).toLocaleDateString("pt-BR")}
          </p>

          {isRecorrente && paymentSchedule && (
            <p className="text-[10px] text-purple-500 font-medium mt-0.5">💳 {paymentSchedule}</p>
          )}
        </div>

        {/* Lado direito: badge status + valor */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${statusConfig[contract.status].color}`}>
            {statusConfig[contract.status].label}
          </span>

          {isRecorrente ? (
            <>
              {contract.valorRecorrente != null && contract.valorRecorrente > 0 && (
                <span className="text-[10px] font-semibold text-slate-500">
                  {formatCurrency(contract.valorRecorrente)}
                </span>
              )}
              {contract.tipoRecorrencia && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                  {contract.tipoRecorrencia}
                </span>
              )}
            </>
          ) : (
            contract.totalValue != null && contract.totalValue > 0 && (
              <span className="text-[10px] font-semibold text-slate-500">
                {formatCurrency(contract.totalValue)}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(ContractRowItem);
