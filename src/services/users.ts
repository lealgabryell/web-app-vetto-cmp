import { api } from "./api";
import { User, FinancialDetails } from "../types/user";
import axios from "axios";

export const createUser = async (userData: Partial<User>): Promise<User> => {
  // Omitimos o 'id' e 'active' pois o back-end gera
  const { data } = await api.post<User>("/api/users", userData);
  return data;
};

export const getUserByCpf = async (cpf: string): Promise<User | null> => {
  try {
    const { data } = await api.get<User>(`/api/users/cpf/${cpf}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null; // Usuário não encontrado
    }
    throw error; // Re-throw outros erros
  }
};

export const getAdmins = async (): Promise<User[]> => {
  const { data } = await api.get<User[]>("/api/users/admins");
  return data;
};

export const getFinancialDetailsByAccountNumber = async (
  accountNumber: string,
): Promise<FinancialDetails> => {
  const { data } = await api.get<FinancialDetails>("/api/financial-details", {
    params: { accountNumber },
  });
  return data;
};

export const updateUserFinancialDetails = async (
  userId: string,
  financialDetailsId: string,
): Promise<User> => {
  const { data } = await api.patch<User>(
    `/api/users/${userId}/financial-details/${financialDetailsId}`,
  );
  return data;
};

export const linkFinancialDetails = async (
  userId: string,
  accountNumber: string,
): Promise<void> => {
  const details = await getFinancialDetailsByAccountNumber(accountNumber);
  await updateUserFinancialDetails(userId, details.id);
};

export const getUserById = async (id: string): Promise<User> => {
  const { data } = await api.get<User>(`/api/users/${id}`);
  return data;
};
