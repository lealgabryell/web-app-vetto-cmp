"use client";

import { CompanySection, SectionRole } from "@/src/types/companysections";
import { User } from "@/src/types/user";
import { SectionMemberItem } from "./SectionMemberItem";

interface Props {
  section: CompanySection;
  myRole: SectionRole;
  myUserId: string;
  isDirector: boolean;
  togglingId: string | null;
  collapsed: boolean;
  allAdmins: User[];
  onDeactivate: (userId: string) => void;
  onRemove: (userId: string) => void;
}

export function SectionMemberList({
  section,
  myRole,
  myUserId,
  isDirector,
  togglingId,
  collapsed,
  allAdmins,
  onDeactivate,
  onRemove,
}: Props) {
  if (collapsed) return null;

  const directorIds = new Set(allAdmins.filter((u) => u.director).map((u) => u.id));

  const sorted = [...section.members].sort((a, b) => {
    const rank = (m: typeof a) => {
      if (m.role === "LEADER" && directorIds.has(m.userId)) return 0;
      if (m.role === "LEADER") return 1;
      return 2;
    };
    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;
    return a.userName.localeCompare(b.userName, "pt-BR");
  });

  return (
    <ul className="divide-y divide-slate-100">
      {sorted.map((member) => (
        <SectionMemberItem
          key={member.userId}
          member={member}
          myRole={myRole}
          myUserId={myUserId}
          isDirector={isDirector}
          togglingId={togglingId}
          onDeactivate={() => onDeactivate(member.userId)}
          onRemove={() => onRemove(member.userId)}
        />
      ))}
    </ul>
  );
}
