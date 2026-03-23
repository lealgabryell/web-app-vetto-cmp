'use client';

import { ContractResponse } from '../../types/contracts';

interface ContractCardProps {
  contract: ContractResponse;
  onViewDetails: (contract: ContractResponse) => void;
  // Opcional: para esconder o botão "Ver Detalhes" se necessário
  hideAction?: boolean; 
}

export default function ContractCard({ contract, onViewDetails, hideAction = false }: ContractCardProps) {
  
  const statusConfig = {
    DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
    ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-700" },
    SUSPENDED: { label: "Suspenso", color: "bg-yellow-100 text-yellow-700" },
    FINISHED: { label: "Finalizado", color: "bg-blue-100 text-blue-700" },
    CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-700" },
  };

  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(contract.totalValue);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-blue-200 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${statusConfig[contract.status].color}`}>
            {statusConfig[contract.status].label}
          </span>
          <h3 className="font-bold text-slate-800 text-lg">{contract.title}</h3>
        </div>
        
        <p className="text-sm text-slate-500 mb-1">
          <span className="font-medium">Cliente:</span> {contract.clientName} 
          <span className="mx-2 text-slate-300">|</span>
          <span className="text-xs">{contract.clientEmail}</span>
        </p>
        
        <div className="flex gap-4 mt-2">
           <div className="text-[11px] text-slate-400">
             📅 Início: {new Date(contract.startDate).toLocaleDateString()}
           </div>
           <div className="text-[11px] text-slate-400">
             🏁 Término: {new Date(contract.endDate).toLocaleDateString()}
           </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-900">{formattedValue}</p>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">Valor Total</p>
        </div>
      </div>
    </div>
  );
}