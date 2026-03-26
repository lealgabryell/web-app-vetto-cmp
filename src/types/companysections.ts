import { ContractStatus } from "./contracts";

// ─── Enums ──────────────────────────────────────────────────────────────────

/** Role of a user within a CompanySection */
export type SectionRole = "LEADER" | "MEMBER";

// ─── Core entities ──────────────────────────────────────────────────────────

export interface CompanySectionMember {
  userId: string;
  userName: string;
  role: SectionRole;
}

export interface CompanySection {
  id: string;
  name: string;
  /**
   * Contract categories this section is responsible for.
   * Members of the section are auto-linked as ContractAdmins on contracts
   * whose `category` matches any entry in this list.
   */
  categoriesPermitted: string[];
  members: CompanySectionMember[];
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface CreateCompanySectionRequest {
  name: string;
  categoriesPermitted: string[];
  members?: AddMemberRequest[];
}

export interface UpdateCompanySectionRequest {
  name?: string;
  categoriesPermitted?: string[];
}

export interface AddMemberRequest {
  userId: string;
  role: SectionRole;
}

// ─── Responses ───────────────────────────────────────────────────────────────

/**
 * Minimal contract view returned by `GET /api/company-sections/my-contracts`.
 * MEMBER role users only see this summary (canViewDetails = false);
 * LEADER role users also get access to full contract detail.
 */
export interface SectionContractSummary {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  totalValue: number;
  status: ContractStatus;
  category: string;
  /** Derived from SectionRole: LEADER → true, MEMBER → false */
  canViewDetails: boolean;
}
