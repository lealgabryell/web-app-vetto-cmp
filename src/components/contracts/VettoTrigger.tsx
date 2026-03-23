import { ContractResponse } from "@/src/types/contracts";
import { Lightbulb } from "lucide-react";

interface VettoTriggerProps {
  contract: ContractResponse;
  onClick: () => void;
}

const VettoTrigger = ({ contract, onClick }: VettoTriggerProps) => {
  const isAvailable = contract.autoExtracted;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button" // Boa prática para não submeter forms sem querer
        onClick={onClick}
        className={`
          relative p-3 rounded-full transition-all duration-500 outline-none
          ${
            isAvailable
              ? "bg-yellow-400 text-slate-900 animate-vetto-pulse hover:bg-yellow-300"
              : "bg-slate-100 text-slate-400 hover:bg-slate-200"
          }
        `}
      >
        <Lightbulb size={15} fill={isAvailable ? "currentColor" : "none"} />

        {/* Notificação flutuante */}
        {isAvailable && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
          </span>
        )}
      </button>
      <span
        className={`text-[8px] font-bold uppercase tracking-tighter ${isAvailable ? "text-yellow-600" : "text-slate-400"}`}
      >
        {isAvailable ? "Vetto Ativo" : "Vetto Offline"}
      </span>
    </div>
  );
};

export default VettoTrigger;
