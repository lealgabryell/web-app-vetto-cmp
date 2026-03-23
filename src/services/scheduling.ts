import { api } from "./api";
import {
  MeetingResponse,
  CreateMeetingRequest,
  UpdateNoteRequest,
} from "../types/scheduling";
import Cookie from "js-cookie";
import axios from "axios";

/**
 * Helper para obter o token de forma centralizada
 */
const getAuthHeader = () => {
  const token = Cookie.get("user_token");
  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Solicitar ou criar uma nova reunião
 * POST /api/meetings
 */
export const createMeeting = async (
  meetingData: CreateMeetingRequest,
): Promise<MeetingResponse> => {
  const { data } = await api.post<MeetingResponse>(
    "/api/meetings",
    meetingData,
    { headers: getAuthHeader() },
  );
  return data;
};

/**
 * Obter detalhes de uma reunião específica (inclui a nota privada)
 * GET /api/meetings/{id}
 */
export const getMeetingDetails = async (
  id: string,
): Promise<MeetingResponse> => {
  const { data } = await api.get<MeetingResponse>(`/api/meetings/${id}`, {
    headers: getAuthHeader(),
  });
  return data;
};

/**
 * Confirmar uma reunião (Ação exclusiva do Admin)
 * PATCH /api/meetings/{id}/confirm
 */
export const confirmMeeting = async (id: string): Promise<MeetingResponse> => {
  const { data } = await api.patch<MeetingResponse>(
    `/api/meetings/${id}/confirm`,
    {},
    { headers: getAuthHeader() },
  );
  return data;
};

/**
 * Atualizar ou criar a nota privada do usuário para a reunião
 * PUT /api/meetings/{id}/notes
 */
export const updateMeetingNote = async (
  id: string,
  content: string,
): Promise<void> => {
  const payload: UpdateNoteRequest = { content };

  await api.put(`/api/meetings/${id}/notes`, payload, {
    headers: getAuthHeader(),
  });
};

export const getMeetings = async (): Promise<MeetingResponse[]> => {
try {
    const { data } = await api.get<MeetingResponse[]>("/api/meetings", {
      headers: getAuthHeader(),
    });
    return data;
  } catch (error) {
    // 1. Erro de resposta do servidor (4xx, 5xx)
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || "Erro ao carregar reuniões.";

      if (status === 401) {
        console.error("Não autorizado: Redirecionando para login...");
        // Opcional: window.location.href = '/login';
      }
      
      throw new Error(`[${status}] ${message}`);
    }

    // 2. Erro de rede ou sem resposta
    if (axios.isAxiosError(error) && error.request) {
      throw new Error("Não foi possível conectar ao servidor. Verifique sua internet.");
    }

    // 3. Erros inesperados (Runtime/JS)
    throw new Error("Ocorreu um erro inesperado ao processar os dados.");
  }
};
