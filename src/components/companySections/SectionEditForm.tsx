"use client";

import { Dispatch, SetStateAction } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { SectionRole } from "@/src/types/companysections";
import { User } from "@/src/types/user";
import { EditingState } from "./types";

interface Props {
  editing: EditingState;
  setEditing: Dispatch<SetStateAction<EditingState | null>>;
  categorySuggestions: string[];
  allAdmins: User[];
  currentMemberIds: string[];
  onAddCategory: () => void;
  onRemoveCategory: (cat: string) => void;
  onAddMember: (userId: string) => void;
}

export function SectionEditForm({
  editing,
  setEditing,
  categorySuggestions,
  allAdmins,
  currentMemberIds,
  onAddCategory,
  onRemoveCategory,
  onAddMember,
}: Props) {
  const stagedIds = (editing.membersToAdd ?? []).map((m) => m.userId);

  const memberSearchResults =
    editing.memberSearch.length > 0
      ? allAdmins.filter(
          (a) =>
            a.name.toLowerCase().includes(editing.memberSearch.toLowerCase()) &&
            !currentMemberIds.includes(a.id) &&
            !stagedIds.includes(a.id)
        )
      : [];

  return (
    <div className="px-6 py-5 border-b border-slate-100 space-y-4 bg-blue-50/40">
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Nome do setor</label>
        <input
          type="text"
          data-test-id="input-edit-section-name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          value={editing.name}
          onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
          disabled={editing.saving}
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Categorias vinculadas</label>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {editing.categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
            >
              {cat}
              <button
                onClick={() => onRemoveCategory(cat)}
                data-test-id={`btn-remove-category-${cat}`}
                disabled={editing.saving}
                className="hover:text-blue-900 transition"
              >
                <Trash2 size={11} />
              </button>
            </span>
          ))}
          {editing.categories.length === 0 && (
            <span className="text-xs text-slate-400">Nenhuma categoria vinculada</span>
          )}
        </div>

        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite uma categoria existente..."
              data-test-id="input-edit-category"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition uppercase placeholder:normal-case"
              value={editing.categoryInput}
              onChange={(e) =>
                setEditing((prev) => prev && { ...prev, categoryInput: e.target.value.toUpperCase() })
              }
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAddCategory())}
              disabled={editing.saving}
            />
            <button
              onClick={onAddCategory}
              disabled={editing.saving || !editing.categoryInput.trim()}
              data-test-id="btn-add-category"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium transition disabled:opacity-40"
            >
              <Plus size={14} />
              Adicionar
            </button>
          </div>

          {editing.categoryInput.trim() && categorySuggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-auto text-sm">
              {categorySuggestions.map((cat) => (
                <li
                  key={cat}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 font-mono"
                  onClick={() => {
                    if (!editing.categories.includes(cat)) {
                      setEditing((prev) =>
                        prev && { ...prev, categories: [...prev.categories, cat], categoryInput: "" }
                      );
                    }
                  }}
                >
                  {cat}
                </li>
              ))}
            </ul>
          )}
          {editing.categoryInput.trim() && categorySuggestions.length === 0 && (
            <p className="mt-1 text-xs text-slate-400 pl-1">
              Nenhuma sugestão encontrada — pressione Adicionar para incluir mesmo assim.
            </p>
          )}
        </div>
      </div>

      {/* Add member */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Adicionar membros ao setor</label>

        {/* Staged members */}
        {(editing.membersToAdd ?? []).length > 0 && (
          <ul className="mb-2 space-y-1">
            {(editing.membersToAdd ?? []).map((m) => {
              const admin = allAdmins.find((a) => a.id === m.userId);
              return (
                <li
                  key={m.userId}
                  className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-xs font-bold select-none">
                      {admin?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-700">{admin?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      data-test-id={`select-staged-member-role-${m.userId}`}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev && {
                            ...prev,
                            membersToAdd: (prev.membersToAdd ?? []).map((mem) =>
                              mem.userId === m.userId
                                ? { ...mem, role: e.target.value as SectionRole }
                                : mem
                            ),
                          }
                        )
                      }
                      disabled={editing.saving}
                      className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="MEMBER">Membro</option>
                      <option value="LEADER">Líder</option>
                    </select>
                    <button
                      onClick={() =>
                        setEditing((prev) =>
                          prev && {
                            ...prev,
                            membersToAdd: (prev.membersToAdd ?? []).filter((mem) => mem.userId !== m.userId),
                          }
                        )
                      }
                      disabled={editing.saving}
                      data-test-id={`btn-remove-staged-member-${m.userId}`}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar usuário pelo nome..."
              data-test-id="input-edit-member-search"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={editing.memberSearch}
              onChange={(e) => setEditing((prev) => prev && { ...prev, memberSearch: e.target.value })}
              disabled={editing.saving}
            />
            <select
              value={editing.addingMemberRole}
              data-test-id="select-adding-member-role"
              onChange={(e) =>
                setEditing((prev) => prev && { ...prev, addingMemberRole: e.target.value as SectionRole })
              }
              disabled={editing.saving}
              className="px-2 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="MEMBER">Membro</option>
              <option value="LEADER">Líder</option>
            </select>
          </div>

          {memberSearchResults.length > 0 && (
            <ul className="absolute z-10 bottom-full mb-1 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-auto text-sm">
              {memberSearchResults.map((admin) => (
                <li
                  key={admin.id}
                  data-test-id={`btn-add-member-${admin.id}`}
                  className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
                  onClick={() => onAddMember(admin.id)}
                >
                  <span className="text-slate-700">{admin.name}</span>
                  <Plus size={14} className="text-slate-400" />
                </li>
              ))}
            </ul>
          )}
          {memberSearchResults.length === 0 && editing.memberSearch.trim() && (
            <p className="mt-1 text-xs text-slate-400 pl-1">Nenhum administrador encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}
