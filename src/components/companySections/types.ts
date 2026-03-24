import { SectionRole } from "@/src/types/companysections";
import { CompanySection } from "@/src/types/companysections";

export interface SectionWithRole {
  section: CompanySection;
  myRole: SectionRole;
}

export interface EditingState {
  sectionId: string;
  name: string;
  categories: string[];
  /** Categories that were in the section when edit was opened — always kept in the suggestion pool */
  originalCategories: string[];
  categoryInput: string;
  memberSearch: string;
  addingMemberRole: SectionRole;
  membersToAdd: { userId: string; role: SectionRole }[];
  saving: boolean;
}

export interface CreatingState {
  name: string;
  categories: string[];
  categoryInput: string;
  members: { userId: string; role: SectionRole }[];
  memberSearch: string;
  saving: boolean;
}

export const defaultCreating: CreatingState = {
  name: "",
  categories: [],
  categoryInput: "",
  members: [],
  memberSearch: "",
  saving: false,
};
