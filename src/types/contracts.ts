export type ContractStatus =
  | "DRAFT"
  | "ACTIVE"
  | "SUSPENDED"
  | "FINISHED"
  | "CANCELED";

export type TipoRecorrencia =
  | "MENSAL"
  | "SEMANAL"
  | "QUINZENAL"
  | "SEMESTRAL"
  | "ANUAL";

export type EtapaStatus =
  | "PROGRAMADA"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA";

/** Compact user representation returned inside step responses */
export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

/** Approver with individual approval status */
export interface AprovadorStatus extends UserSummary {
  aprovado: boolean;
  aprovadoEm: string | null; // ISO 8601 or null
}

/** Full DTO returned by every step endpoint (GET / POST / PUT) */
export interface ContractStepResponse {
  id: string;
  titulo: string;
  instrucao: string | null;     // optional orientation text
  dataInicio: string;           // "YYYY-MM-DD"
  previsaoConclusao: string;    // "YYYY-MM-DD"
  status: EtapaStatus;
  responsaveis: UserSummary[];  // may be []
  aprovadores: AprovadorStatus[]; // may be []
  pdfUrls: string[];
}

/** @deprecated — use ContractStepResponse */
export type ContractStep = ContractStepResponse;

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
  totalValue: number | null;
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
  recorrencia: boolean | null;
  tipoRecorrencia: TipoRecorrencia | null;
  /** MENSAL/QUINZENAL/SEMESTRAL: dia do mês (1-31) | SEMANAL: dia da semana (1-7) */
  diaPagamento: number | null;
  /** QUINZENAL apenas: 2º dia do mês (1-31) */
  segundoDiaPagamento: number | null;
  /** SEMESTRAL apenas: mês do pagamento (1-12) */
  mesPagamento: number | null;
  /** ANUAL apenas: data completa 'YYYY-MM-DD' */
  dataPagamentoAnual: string | null;
  valorRecorrente: number | null;
  admins: ContractAdminResponse[];
  steps: ContractStepResponse[];
}

/** POST /api/contracts/:contractId/steps */
export interface CreateContractStepRequest {
  titulo: string;              // obrigatório
  instrucao?: string | null;   // opcional
  dataInicio: string;          // "YYYY-MM-DD"
  expectedEndDate: string;     // "YYYY-MM-DD"
  status: EtapaStatus;
  responsavelIds?: string[];   // UUIDs — opcional
  aprovadorIds?: string[];     // UUIDs — opcional
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
  totalValue?: number;
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
  recorrencia?: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  diaPagamento?: number;
  segundoDiaPagamento?: number;
  mesPagamento?: number;
  dataPagamentoAnual?: string;
  valorRecorrente?: number;
}

export interface UpdatedContractResponse {
  id: string;
  title: string;
  status: string;
  totalValue: number | null;
  startDate: string | null;
  endDate: string | null;
  recorrencia: boolean | null;
  tipoRecorrencia: TipoRecorrencia | null;
  diaPagamento: number | null;
  segundoDiaPagamento: number | null;
  mesPagamento: number | null;
  dataPagamentoAnual: string | null;
  valorRecorrente: number | null;
  scannedContractUrl?: string;
  finalProjectUrl?: string;
  message: string;
}

export interface CreateContractRequest {
  title: string;
  description?: string;
  totalValue?: number;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  category?: string;
  admins: ContractAdminRequest[];
  recorrencia?: boolean;
  tipoRecorrencia?: TipoRecorrencia;
  diaPagamento?: number;
  segundoDiaPagamento?: number;
  mesPagamento?: number;
  dataPagamentoAnual?: string;
  valorRecorrente?: number;
}

export interface NewContractModalProps {
  onClose: () => void;
  onSave: (contract: ContractResponse) => void;
  existingCategories?: string[];
}

/** PUT /api/contracts/:contractId/steps/:stepId */
export interface UpdateContractStepRequest {
  titulo: string;                   // obrigatório
  instrucao?: string | null;        // opcional
  dataInicio: string;               // "YYYY-MM-DD"
  previsaoConclusao: string;        // "YYYY-MM-DD"
  responsavelIds?: string[];        // substitui lista inteira
  aprovadorIds?: string[];          // substitui lista inteira
  pdfUrls?: string[];
}

export interface ContractHistoryResponse {
  id: string;
  title: string;
  description: string;
  totalValue: number | null;
  recorrencia: boolean | null;
  tipoRecorrencia: TipoRecorrencia | null;
  diaPagamento: number | null;
  segundoDiaPagamento: number | null;
  mesPagamento: number | null;
  dataPagamentoAnual: string | null;
  valorRecorrente: number | null;
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
