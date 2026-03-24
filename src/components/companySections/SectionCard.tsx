"use client";

import { Dispatch, SetStateAction } from "react";
import { Check, ChevronDown, ChevronUp, Loader2, Pencil, ShieldCheck, X } from "lucide-react";
import { User } from "@/src/types/user";
import { EditingState, SectionWithRole } from "./types";
import { SectionEditForm } from "./SectionEditForm";
import { SectionMemberList } from "./SectionMemberList";

interface Props {
  sectionWithRole: SectionWithRole;
  editing: EditingState | null;
  isDirector: boolean;
  myUserId: string;
  allAdmins: User[];
  togglingId: string | null;
  collapsed: boolean;
  categorySuggestions: string[];
  setEditing: Dispatch<SetStateAction<EditingState | null>>;
  onToggleCollapse: () => void;
  onOpenEdit: () => void;
  onCloseEdit: () => void;
  onSaveEdit: () => void;
  onDeactivate: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (cat: string) => void;
  onAddMember: (userId: string) => void;
}

export function SectionCard({
  sectionWithRole,
  editing,
  isDirector,
  myUserId,
  allAdmins,
  togglingId,
  collapsed,
  categorySuggestions,
  setEditing,
  onToggleCollapse,
  onOpenEdit,
  onCloseEdit,
  onSaveEdit,
  onDeactivate,
  onRemoveMember,
  onAddCategory,
  onRemoveCategory,
  onAddMember,
}: Props) {
  const { section, myRole } = sectionWithRole;
  const isEditingThis = editing?.sectionId === section.id;

  const currentMemberIds = section.members.map((m) => m.userId);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-800">{section.name}</h2>
          {myRole === "LEADER" ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              <ShieldCheck size={12} />
              Líder
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              Membro
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {section.categoriesPermitted.length > 0 && !isEditingThis && (
            <div className="hidden sm:flex flex-wrap gap-1">
              {section.categoriesPermitted.map((cat) => (
                <span key={cat} className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-xs">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {myRole === "LEADER" && !isEditingThis && (
            <button
              onClick={onOpenEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
            >
              <Pencil size={13} />
              Editar
            </button>
          )}

          {isEditingThis && (
            <div className="flex gap-2">
              <button
                onClick={onCloseEdit}
                disabled={editing?.saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition disabled:opacity-50"
              >
                <X size={13} />
                Cancelar
              </button>
              <button
                onClick={onSaveEdit}
                disabled={editing?.saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition disabled:opacity-50"
              >
                {editing?.saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {editing?.saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs transition"
            title={collapsed ? "Expandir membros" : "Recolher membros"}
          >
            {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            <span className="text-xs">{section.members.length}</span>
          </button>
        </div>
      </div>

      {/* Inline edit form (leader only) */}
      {isEditingThis && editing && (
        <SectionEditForm
          editing={editing}
          setEditing={setEditing}
          categorySuggestions={categorySuggestions}
          allAdmins={allAdmins}
          currentMemberIds={currentMemberIds}
          onAddCategory={onAddCategory}
          onRemoveCategory={onRemoveCategory}
          onAddMember={onAddMember}
        />
      )}

      {/* Members list */}
      <SectionMemberList
        section={section}
        myRole={myRole}
        myUserId={myUserId}
        isDirector={isDirector}
        togglingId={togglingId}
        collapsed={collapsed}
        allAdmins={allAdmins}
        onDeactivate={onDeactivate}
        onRemove={onRemoveMember}
      />
    </section>
  );
}
