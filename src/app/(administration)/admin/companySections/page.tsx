"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/src/services/users";
import { deactivateUser } from "@/src/services/users";
import { getCompanySections, updateCompanySection } from "@/src/services/companysections";
import { getContracts } from "@/src/services/contracts";
import { CompanySection, SectionRole } from "@/src/types/companysections";
import { Building2, Loader2, UserX, ShieldCheck, Pencil, X, Check, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface SectionWithRole {
  section: CompanySection;
  myRole: SectionRole;
}

interface EditingState {
  sectionId: string;
  name: string;
  categories: string[];
  /** Categories that were in the section when edit was opened — always kept in the suggestion pool */
  originalCategories: string[];
  categoryInput: string;
  saving: boolean;
}

export default function CompanySectionsPage() {
  const [loading, setLoading] = useState(true);
  const [mySections, setMySections] = useState<SectionWithRole[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string>("");
  const [contractCategories, setContractCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [me, allSections, contracts] = await Promise.all([
          getCurrentUser(),
          getCompanySections(),
          getContracts(),
        ]);

        setMyUserId(me.id);

        const filtered = allSections
          .filter((s) => s.members.some((m) => m.userId === me.id))
          .map((s) => ({
            section: s,
            myRole: s.members.find((m) => m.userId === me.id)!.role,
          }));
        setMySections(filtered);

        // Collect unique categories from contracts the user can see + every section's categoriesPermitted.
        // Using all sections as the source of truth ensures categories remain available
        // even after losing contract visibility due to section membership changes.
        const fromContracts = contracts.map((c) => c.category).filter((c): c is string => !!c);
        const fromSections = allSections.flatMap((s) => s.categoriesPermitted);
        const cats = Array.from(new Set([...fromContracts, ...fromSections])).sort();
        setContractCategories(cats);
      } catch {
        toast.error("Erro ao carregar os setores. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleDeactivate = async (userId: string, sectionId: string) => {
    setTogglingId(userId);
    try {
      await deactivateUser(userId);
      setMySections((prev) =>
        prev.map((sw) => {
          if (sw.section.id !== sectionId) return sw;
          return {
            ...sw,
            section: {
              ...sw.section,
              members: sw.section.members.map((m) =>
                m.userId === userId ? { ...m, active: false } : m,
              ),
            },
          };
        }),
      );
      toast.success("Usuário desativado com sucesso.");
    } catch {
      toast.error("Erro ao desativar o usuário. Tente novamente.");
    } finally {
      setTogglingId(null);
    }
  };

  const openEdit = (section: CompanySection) => {
    setEditing({
      sectionId: section.id,
      name: section.name,
      categories: [...section.categoriesPermitted],
      originalCategories: [...section.categoriesPermitted],
      categoryInput: "",
      saving: false,
    });
  };

  const closeEdit = () => setEditing(null);

  const addCategory = () => {
    if (!editing) return;
    const cat = editing.categoryInput.trim().toUpperCase();
    if (!cat) return;
    if (editing.categories.includes(cat)) {
      toast.error(`A categoria "${cat}" já está vinculada a este setor.`);
      return;
    }
    setEditing((prev) => prev && { ...prev, categories: [...prev.categories, cat], categoryInput: "" });
  };

  const removeCategory = (cat: string) => {
    setEditing((prev) => prev && { ...prev, categories: prev.categories.filter((c) => c !== cat) });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setEditing((prev) => prev && { ...prev, saving: true });
    try {
      const updated = await updateCompanySection(editing.sectionId, {
        name: editing.name || undefined,
        categoriesPermitted: editing.categories,
      });
      setMySections((prev) =>
        prev.map((sw) =>
          sw.section.id === editing.sectionId
            ? { ...sw, section: { ...sw.section, name: updated.name, categoriesPermitted: updated.categoriesPermitted } }
            : sw,
        ),
      );
      toast.success("Setor atualizado com sucesso!");
      setEditing(null);
    } catch {
      toast.error("Erro ao salvar o setor. Tente novamente.");
      setEditing((prev) => prev && { ...prev, saving: false });
    }
  };

  // Suggestions: exist in contracts OR were originally in this section, not yet in the current editing category list
  const categorySuggestions =
    editing
      ? Array.from(new Set([...contractCategories, ...editing.originalCategories]))
          .sort()
          .filter(
            (c) =>
              !editing.categories.includes(c) &&
              c.includes(editing.categoryInput.trim().toUpperCase()),
          )
      : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-full">
          <Building2 size={28} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meus Setores</h1>
          <p className="text-sm text-slate-500">Setores aos quais você pertence</p>
        </div>
      </div>

      {mySections.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <Building2 size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Você não está vinculado a nenhum setor.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {mySections.map(({ section, myRole }) => {
            const isEditingThis = editing?.sectionId === section.id;

            return (
              <section
                key={section.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
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
                        onClick={() => openEdit(section)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition"
                      >
                        <Pencil size={13} />
                        Editar
                      </button>
                    )}
                    {isEditingThis && (
                      <div className="flex gap-2">
                        <button
                          onClick={closeEdit}
                          disabled={editing?.saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium transition disabled:opacity-50"
                        >
                          <X size={13} />
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={editing?.saving}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition disabled:opacity-50"
                        >
                          {editing?.saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          {editing?.saving ? "Salvando..." : "Salvar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline edit form (leader only) */}
                {isEditingThis && editing && (
                  <div className="px-6 py-5 border-b border-slate-100 space-y-4 bg-blue-50/40">
                    {/* Name */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nome do setor</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={editing.name}
                        onChange={(e) => setEditing((prev) => prev && { ...prev, name: e.target.value })}
                        disabled={editing.saving}
                      />
                    </div>

                    {/* Categories */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">
                        Categorias vinculadas
                      </label>

                      {/* Current categories */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {editing.categories.map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
                          >
                            {cat}
                            <button
                              onClick={() => removeCategory(cat)}
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

                      {/* Add category input */}
                      <div className="relative">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Digite uma categoria existente..."
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition uppercase placeholder:normal-case"
                            value={editing.categoryInput}
                            onChange={(e) =>
                              setEditing((prev) =>
                                prev && { ...prev, categoryInput: e.target.value.toUpperCase() }
                              )
                            }
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                            disabled={editing.saving}
                          />
                          <button
                            onClick={addCategory}
                            disabled={editing.saving || !editing.categoryInput.trim()}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium transition disabled:opacity-40"
                          >
                            <Plus size={14} />
                            Adicionar
                          </button>
                        </div>

                        {/* Autocomplete suggestions */}
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
                  </div>
                )}

                {/* Members list */}
                <ul className="divide-y divide-slate-100">
                  {section.members.map((member) => {
                    const isToggling = togglingId === member.userId;
                    const isInactive = (member as typeof member & { active?: boolean }).active === false;

                    return (
                      <li key={member.userId} className="flex items-center justify-between px-6 py-4">
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

                        {/* Deactivate toggle — only visible to LEADERs, never for own account */}
                        {myRole === "LEADER" && member.userId !== myUserId && (
                          <button
                            onClick={() => handleDeactivate(member.userId, section.id)}
                            disabled={isToggling || isInactive}
                            title={isInactive ? "Usuário já desativado" : "Desativar usuário"}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition
                              ${isInactive
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                              }
                              disabled:opacity-60`}
                          >
                            {isToggling ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                            {isInactive ? "Desativado" : isToggling ? "Desativando..." : "Desativar"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

