"use client";

import { Dispatch, SetStateAction } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { SectionRole } from "@/src/types/companysections";
import { User } from "@/src/types/user";
import { CreatingState } from "./types";

interface Props {
  creating: CreatingState;
  setCreating: Dispatch<SetStateAction<CreatingState>>;
  allAdmins: User[];
  newCategorySuggestions: string[];
  adminSearchResults: User[];
  pinnedMemberIds: string[];
  sanitizeSectionName: (v: string) => string;
  onClose: () => void;
  onCreate: () => void;
}

export function CreateSectionModal({
  creating,
  setCreating,
  allAdmins,
  newCategorySuggestions,
  adminSearchResults,
  pinnedMemberIds,
  sanitizeSectionName,
  onClose,
  onCreate,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">Criar novo Setor</h2>
          <button
            onClick={onClose}
            disabled={creating.saving}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Nome do setor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex: ENGENHARIA CIVIL"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono tracking-wide text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={creating.name}
              onChange={(e) => setCreating((p) => ({ ...p, name: sanitizeSectionName(e.target.value) }))}
              disabled={creating.saving}
            />
            <p className="mt-0.5 text-xs text-slate-400">
              Somente letras maiúsculas e espaços (sem acentos ou caracteres especiais).
            </p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Categorias</label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[24px]">
              {creating.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                >
                  {cat}
                  <button
                    onClick={() =>
                      setCreating((p) => ({ ...p, categories: p.categories.filter((c) => c !== cat) }))
                    }
                    disabled={creating.saving}
                    className="hover:text-blue-900 transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </span>
              ))}
              {creating.categories.length === 0 && (
                <span className="text-xs text-slate-400 self-center">Nenhuma categoria selecionada</span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Pesquisar categoria existente..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition uppercase placeholder:normal-case"
                value={creating.categoryInput}
                onChange={(e) => setCreating((p) => ({ ...p, categoryInput: e.target.value.toUpperCase() }))}
                disabled={creating.saving}
              />
              {creating.categoryInput.trim() && newCategorySuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-auto text-sm">
                  {newCategorySuggestions.map((cat) => (
                    <li
                      key={cat}
                      className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-slate-700 font-mono"
                      onClick={() =>
                        setCreating((p) => ({ ...p, categories: [...p.categories, cat], categoryInput: "" }))
                      }
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
              {creating.categoryInput.trim() && newCategorySuggestions.length === 0 && (
                <p className="mt-1 text-xs text-slate-400 pl-1">Nenhuma categoria encontrada.</p>
              )}
            </div>
          </div>

          {/* Members */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Membros</label>
            {creating.members.length > 0 && (
              <ul className="mb-2 space-y-1">
                {creating.members.map((m) => {
                  const admin = allAdmins.find((a) => a.id === m.userId);
                  const isPinned = pinnedMemberIds.includes(m.userId);
                  return (
                    <li
                      key={m.userId}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                        isPinned ? "bg-blue-50" : "bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold select-none">
                          {admin?.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-slate-700">{admin?.name}</span>
                        {isPinned && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                            👑 Diretor
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isPinned ? (
                          <span className="text-xs text-blue-600 font-medium">Líder (fixo)</span>
                        ) : (
                          <>
                            <select
                              value={m.role}
                              onChange={(e) =>
                                setCreating((p) => ({
                                  ...p,
                                  members: p.members.map((mem) =>
                                    mem.userId === m.userId
                                      ? { ...mem, role: e.target.value as SectionRole }
                                      : mem
                                  ),
                                }))
                              }
                              disabled={creating.saving}
                              className="text-xs border border-slate-200 rounded px-1.5 py-0.5 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="LEADER">Líder</option>
                              <option value="MEMBER">Membro</option>
                            </select>
                            <button
                              onClick={() =>
                                setCreating((p) => ({
                                  ...p,
                                  members: p.members.filter((mem) => mem.userId !== m.userId),
                                }))
                              }
                              disabled={creating.saving}
                              className="text-slate-400 hover:text-red-500 transition"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar usuário pelo nome..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                value={creating.memberSearch}
                onChange={(e) => setCreating((p) => ({ ...p, memberSearch: e.target.value }))}
                disabled={creating.saving}
              />
              {creating.memberSearch.trim() && adminSearchResults.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-40 overflow-auto text-sm">
                  {adminSearchResults.map((admin) => (
                    <li
                      key={admin.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer"
                      onClick={() =>
                        setCreating((p) => ({
                          ...p,
                          members: [...p.members, { userId: admin.id, role: "MEMBER" }],
                          memberSearch: "",
                        }))
                      }
                    >
                      <span className="text-slate-700">{admin.name}</span>
                      <Plus size={14} className="text-slate-400" />
                    </li>
                  ))}
                </ul>
              )}
              {creating.memberSearch.trim() && adminSearchResults.length === 0 && (
                <p className="mt-1 text-xs text-slate-400 pl-1">Nenhum administrador encontrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            disabled={creating.saving}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onCreate}
            disabled={creating.saving || !creating.name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {creating.saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Setor"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
