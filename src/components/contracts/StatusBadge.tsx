import { ContractStatus } from "../../types/contracts"; // Certifique-se de que ContractStatus é um enum ou type string

interface StatusBadgeProps {
  status: ContractStatus;
}

// 1. Definimos a estrutura do objeto de configuração usando o Record do TypeScript
const config: Record<ContractStatus, { label: string; classes: string }> = {
  DRAFT: { 
    label: "Rascunho", 
    classes: "bg-slate-50 text-slate-500 border-slate-200" 
  },
  ACTIVE: { 
    label: "Em Andamento", 
    classes: "bg-blue-50 text-blue-700 border-blue-200" 
  },
  CANCELED: { 
    label: "Cancelado", 
    classes: "bg-red-50 text-red-700 border-red-200" 
  },
  FINISHED: { 
    label: "Finalizado", 
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200" 
  },
  SUSPENDED: { 
    label: "Suspenso", 
    classes: "bg-red-50 text-red-700 border-red-200" 
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  // 2. Agora o TS sabe que 'status' é uma chave válida de 'config'
  const { label, classes } = config[status] || { 
    label: "Desconhecido", 
    classes: "bg-gray-50 text-gray-400 border-gray-200" 
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold border ${classes} tracking-wider`}>
      {label}
    </span>
  );
};