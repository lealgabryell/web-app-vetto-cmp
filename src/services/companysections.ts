import { api } from "./api";
import {
  AddMemberRequest,
  CompanySection,
  CreateCompanySectionRequest,
  SectionContractSummary,
  UpdateCompanySectionRequest,
} from "../types/companysections";

// ─── Sections CRUD ───────────────────────────────────────────────────────────

export const createCompanySection = async (
  data: CreateCompanySectionRequest,
): Promise<CompanySection> => {
  const { data: response } = await api.post<CompanySection>(
    "/api/company-sections",
    data,
  );
  return response;
};

export const getCompanySections = async (): Promise<CompanySection[]> => {
  const { data } = await api.get<CompanySection[]>("/api/company-sections");
  return data;
};

export const getCompanySectionById = async (
  id: string,
): Promise<CompanySection> => {
  const { data } = await api.get<CompanySection>(`/api/company-sections/${id}`);
  return data;
};

export const updateCompanySection = async (
  id: string,
  payload: UpdateCompanySectionRequest,
): Promise<CompanySection> => {
  const { data } = await api.patch<CompanySection>(
    `/api/company-sections/${id}`,
    payload,
  );
  return data;
};

export const deleteCompanySection = async (id: string): Promise<void> => {
  await api.delete(`/api/company-sections/${id}`);
};

// ─── Members ─────────────────────────────────────────────────────────────────

export const addSectionMember = async (
  sectionId: string,
  payload: AddMemberRequest,
): Promise<CompanySection> => {
  const { data } = await api.post<CompanySection>(
    `/api/company-sections/${sectionId}/members`,
    payload,
  );
  return data;
};

export const removeSectionMember = async (
  sectionId: string,
  userId: string,
): Promise<void> => {
  await api.delete(`/api/company-sections/${sectionId}/members/${userId}`);
};

// ─── My contracts (visible to the current admin based on section membership) ─

export const getMySectionContracts = async (): Promise<
  SectionContractSummary[]
> => {
  const { data } = await api.get<SectionContractSummary[]>(
    "/api/company-sections/my-contracts",
  );
  return data;
};
