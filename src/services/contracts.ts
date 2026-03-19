import { api } from "./api";
import {
  ContractHistoryResponse,
  ContractResponse,
  ContractStep,
  CreateContractRequest,
  CreateContractStepRequest,
  UpdateContractRequest,
  UpdateContractStepRequest,
  UpdatedContractResponse,
} from "../types/contracts";

export const getContracts = async (): Promise<ContractResponse[]> => {
  const { data } = await api.get<ContractResponse[]>("/api/contracts");
  return data;
};

// Cancelar contrato
export const cancelContract = async (id: string) => {
  await api.patch(`/api/contracts/${id}/cancel`);
};

// Alterar status da etapa
export const updateStepStatus = async (
  contractId: string,
  stepId: string,
  status: string,
) => {
  await api.patch(
    `/api/contracts/${contractId}/steps/${stepId}/status?status=${status}`,
  );
};

// Criar nova etapa
export const createStep = async (
  contractId: string,
  stepData: CreateContractStepRequest,
) => {
  const { data } = await api.post(
    `/api/contracts/${contractId}/steps`,
    stepData,
  );
  return data;
};

export const getContractSteps = async (
  contractId: string,
): Promise<ContractStep[]> => {
  const { data } = await api.get<ContractStep[]>(
    `/api/contracts/${contractId}/steps`,
  );
  return data;
};

export const createContract = async (contractData: CreateContractRequest) => {
  const { data } = await api.post("/api/contracts", contractData);
  return data;
};

export const updateStepData = async (
  contractId: string,
  stepId: string,
  step: ContractStep,
): Promise<ContractStep> => {
  const payload: UpdateContractStepRequest = {
    titulo: step.title,
    responsavel: step.responsible,
    dataInicio: step.startDate,
    previsaoConclusao: step.expectedEndDate,
  };

  // README: PATCH /api/contracts/{id}/steps/{stepId}
  const { data } = await api.patch<ContractStep>(
    `/api/contracts/${contractId}/steps/${stepId}`,
    payload,
  );

  return data;
};

export const updateContract = async (
  contractId: string,
  contractData: UpdateContractRequest,
): Promise<UpdatedContractResponse> => {
  // README: PATCH /api/contracts/{id}
  const { data } = await api.patch<UpdatedContractResponse>(
    `/api/contracts/${contractId}`,
    contractData,
  );
  return data;
};

export const uploadContractPDF = async (
  contractId: string,
  file: File,
  type: "SCANNED" | "FINAL",
): Promise<ContractResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  // README: POST /api/contracts/{id}/upload?type=SCANNED|FINAL
  const response = await api.post<ContractResponse>(
    `/api/contracts/${contractId}/upload?type=${type}`,
    formData,
  );
  return response.data;
};


export const getContractHistory = async (contractId: string): Promise<ContractHistoryResponse[]> => {
  const response = await api.get<ContractHistoryResponse[]>(`/api/contracts/${contractId}/history`);
  return response.data;
};

export const uploadStepPDF = async (
  contractId: string,
  stepId: string,
  file: File,
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<string>(
    `/api/contracts/${contractId}/steps/${stepId}/pdf`,
    formData,
  );
  return response.data;
};