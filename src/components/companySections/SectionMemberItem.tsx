"use client";

import { Loader2, UserX } from "lucide-react";
import { SectionRole } from "@/src/types/companysections";

export interface SectionMemberData {
  userId: string;
  userName: string;
  role: SectionRole;
  active?: boolean;
}

interface Props {
  member: SectionMemberData;
  myRole: SectionRole;
  myUserId: string;
  isDirector: boolean;
  togglingId: string | null;
  onDeactivate: () => void;
  onRemove: () => void;
}

export function SectionMemberItem({
  member,
  myRole,
  myUserId,
  isDirector,
  togglingId,
  onDeactivate,
  onRemove,
}: Props) {
  const isToggling = togglingId === member.userId;
  const isInactive = member.active === false;

  return (
    <li className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold select-none">
          {member.userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className={`text-sm font-medium ${isInactive ? "text-slate-400 line-through" : "text-slate-700"}`}>
            {member.userName}
          </p>
          <p className="text-xs text-slate-400">
            {member.role === "LEADER" ? "Líder" : "Membro"}
          </p>
        </div>
      </div>

      {member.userId !== myUserId && (
        <div className="flex items-center gap-2">
          {/* Remove from section — director removes anyone; leader removes only MEMBERs */}
          {(isDirector || (myRole === "LEADER" && member.role === "MEMBER")) && (
            <button
              onClick={onRemove}
              disabled={isToggling}
              title="Remover do setor"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 disabled:opacity-60"
            >
              {isToggling ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
              Remover
            </button>
          )}
          {/* Deactivate from system — directors only */}
          {isDirector && (
            <button
              onClick={onDeactivate}
              disabled={isToggling || isInactive}
              title={isInactive ? "Usuário já desativado" : "Desativar no sistema"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${
                  isInactive
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                } disabled:opacity-60`}
            >
              {isToggling ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
              {isInactive ? "Desativado" : "Desativar"}
            </button>
          )}
        </div>
      )}
    </li>
  );
}
