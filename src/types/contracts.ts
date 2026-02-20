export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "FINISHED"
  | "CANCELED";

export type EtapaStatus =
  | "PROGRAMADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

export interface ContractStep {
  id: string;
  title: string;
  startDate: string;
  expectedEndDate: string;
  status: EtapaStatus;
  responsible: string;
}

export interface ContractResponse {
  id: string;
  title: string;
  description: string;
  status: ContractStatus;
  totalValue: number;
  startDate: string;
  endDate: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  etapas?: ContractStep[];
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  category?: string;
  aiRiskScore?: number;
  aiAnalysisSummary?: string;
  autoExtracted: boolean;
  keyClauses: string[];   
}

export interface CreateContractStepRequest {
  title: string;
  startDate: string; // ISO date YYYY-MM-DD
  expectedEndDate: string; // ISO date YYYY-MM-DD
  status: EtapaStatus;
  responsible: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface UpdateContractRequest {
  title: string;
  description: string;
  totalValue: number;
  status: ContractStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface CreateContractRequest {
  title: string;
  description: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  clientId?: string;
}

export interface NewContractModalProps {
  onClose: () => void;
  onSave: (contract: ContractResponse) => void; // Ou o tipo específico do seu contrato
}

export interface UpdateContractStepRequest {
  titulo: string;
  responsavel: string;
  dataInicio: string; // YYYY-MM-DD
  previsaoConclusao: string; // YYYY-MM-DD
}

export interface ContractHistoryResponse {
  id: string;
  title: string;
  description: string;
  totalValue: number;
  status: string;
  modifiedAt: string; // ISO String vinda do LocalDateTime
  modifiedBy: string;
}
