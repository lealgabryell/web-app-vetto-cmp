import { api } from "./api";
import { User } from "../types/user";
import axios from "axios";
import { UserResponse, UpdateUserRequest } from "../types/user";

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

export const getUserById = async (id: string): Promise<UserResponse> => {
  // O interceptor já cuida do Authorization: Bearer token
  const { data } = await api.get<UserResponse>(`/api/users/${id}`);
  return data;
};

export const updateUser = async (
  id: string,
  userData: UpdateUserRequest,
): Promise<UserResponse> => {
  const { data } = await api.put<UserResponse>(`/api/users/${id}`, userData);
  return data;
};

export const getMyProfile = async (): Promise<UserResponse> => {
  const { data } = await api.get<UserResponse>('/api/users/me');
  return data;
};