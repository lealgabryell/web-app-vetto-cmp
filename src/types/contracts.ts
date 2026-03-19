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
  pdfUrls?: string[];
}

export interface ContractStepResponse {
  id: string;
  title: string;
  startDate: string;
  expectedEndDate: string;
  status: EtapaStatus;
  responsible: string;
  pdfUrls: string[];
}

export interface ContractAdminRequest {
  adminId: string;
  canViewDetails: boolean;
}

export interface ContractAdminResponse {
  adminId: string;
  adminName: string;
  /** Controlled by CompanySection rules — LEADER of a covering section always gets true */
  canViewDetails: boolean;
  /** false = auto-linked via CompanySection category match; true = explicitly added by an admin */
  manuallyAdded: boolean;
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
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  category?: string;
  aiRiskScore?: number;
  aiAnalysisSummary?: string;
  autoExtracted: boolean;
  keyClauses: string[];
  admins: ContractAdminResponse[];
  steps: ContractStepResponse[];
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
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: ContractStatus;
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  category?: string;
  aiRiskScore?: number;
  aiAnalysisSummary?: string;
  autoExtracted?: boolean;
  keyClauses: string[];
}

export interface UpdatedContractResponse {
  id: string;
  title: string;
  status: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  message: string;
}

export interface CreateContractRequest {
  title: string;
  description?: string;
  totalValue: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  category?: string;
  admins: ContractAdminRequest[];
}

export interface NewContractModalProps {
  onClose: () => void;
  onSave: (contract: ContractResponse) => void;
  existingCategories?: string[];
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
  status: ContractStatus;
  category?: string;
  aiRiskScore?: number;
  aiAnalysisSummary?: string;
  keyClauses: string[];
  autoExtracted: boolean;
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  /** ISO datetime of when this snapshot was captured */
  modifiedAt: string;
  modifiedBy: string;
}
