"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, deactivateUser, getAdmins } from "@/src/services/users";
import { getCompanySections, updateCompanySection, createCompanySection, removeSectionMember, addSectionMember } from "@/src/services/companysections";
import { getDistinctCategories } from "@/src/services/contracts";
import { CompanySection, SectionRole } from "@/src/types/companysections";
import { User } from "@/src/types/user";
import { Building2, Loader2, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import { SectionWithRole, EditingState, CreatingState, defaultCreating } from "@/src/components/companySections/types";
import { SectionSearchBar } from "@/src/components/companySections/SectionSearchBar";
import { SectionCard } from "@/src/components/companySections/SectionCard";
import { CreateSectionModal } from "@/src/components/companySections/CreateSectionModal";

export default function CompanySectionsPage() {
  const [loading, setLoading] = useState(true);
  const [mySections, setMySections] = useState<SectionWithRole[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [myUserId, setMyUserId] = useState<string>("");
  const [contractCategories, setContractCategories] = useState<string[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isDirector, setIsDirector] = useState(false);
  const [allAdmins, setAllAdmins] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState<CreatingState>(defaultCreating);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [sectionSearch, setSectionSearch] = useState("");

  const toggleCollapse = (id: string) =>
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  useEffect(() => {
    async function load() {
      try {
        const [me, allSections, distinctCategories, admins] = await Promise.all([
          getCurrentUser(),
          getCompanySections(),
          getDistinctCategories(),
          getAdmins(),
        ]);

        setMyUserId(me.id);
        setIsDirector(me.director);
        setAllAdmins(admins);

        const filtered = allSections
          .filter((s) => s.members.some((m) => m.userId === me.id))
          .map((s) => ({
            section: s,
            myRole: s.members.find((m) => m.userId === me.id)!.role,
          }));
        setMySections(filtered);
        setCollapsedSections(new Set(filtered.map((sw) => sw.section.id)));

        // Merge backend distinct categories with every section's categoriesPermitted
        // so previously permitted categories remain available even without contracts.
        const fromSections = allSections.flatMap((s) => s.categoriesPermitted);
        const cats = Array.from(new Set([...distinctCategories, ...fromSections])).sort();
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

  const handleRemoveMember = async (userId: string, sectionId: string) => {
    setTogglingId(userId);
    try {
      await removeSectionMember(sectionId, userId);
      setMySections((prev) =>
        prev.map((sw) => {
          if (sw.section.id !== sectionId) return sw;
          return {
            ...sw,
            section: {
              ...sw.section,
              members: sw.section.members.filter((m) => m.userId !== userId),
            },
          };
        }),
      );
      toast.success("Usuário removido do setor.");
    } catch {
      toast.error("Erro ao remover o usuário do setor. Tente novamente.");
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
      memberSearch: "",
      addingMemberRole: "MEMBER",
      membersToAdd: [],
      saving: false,
    });
  };

  const closeEdit = () => setEditing(null);

  const sanitizeSectionName = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z ]/g, "");

  const closeCreate = () => {
    setShowCreateModal(false);
    setCreating(defaultCreating);
  };

  const handleCreate = async () => {
    const name = creating.name.trim();
    if (!name) {
      toast.error("Informe o nome do setor.");
      return;
    }
    setCreating((p) => ({ ...p, saving: true }));
    try {
      await createCompanySection({
        name,
        categoriesPermitted: creating.categories,
        members: creating.members,
      });
      closeCreate();
      const updated = await getCompanySections();
      const filtered = updated
        .filter((s) => s.members.some((m) => m.userId === myUserId))
        .map((s) => ({
          section: s,
          myRole: s.members.find((m) => m.userId === myUserId)!.role,
        }));
      setMySections(filtered);
      toast.success("Setor criado com sucesso!");
    } catch {
      toast.error("Erro ao criar o setor. Tente novamente.");
      setCreating((p) => ({ ...p, saving: false }));
    }
  };

  const handleAddMember = (userId: string) => {
    if (!editing) return;
    setEditing((prev) =>
      prev && {
        ...prev,
        membersToAdd: [...(prev.membersToAdd ?? []), { userId, role: prev.addingMemberRole }],
        memberSearch: "",
      }
    );
  };

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
      // Fire all staged member additions in parallel
      if ((editing.membersToAdd ?? []).length > 0) {
        await Promise.all(
          (editing.membersToAdd ?? []).map((m) =>
            addSectionMember(editing.sectionId, { userId: m.userId, role: m.role })
          )
        );
      }
      const updated = await updateCompanySection(editing.sectionId, {
        name: editing.name || undefined,
        categoriesPermitted: editing.categories,
      });
      // Refresh full section to get up-to-date member list after additions
      const allSections = await getCompanySections();
      setMySections((prev) =>
        prev.map((sw) => {
          if (sw.section.id !== editing.sectionId) return sw;
          const fresh = allSections.find((s) => s.id === editing.sectionId);
          return {
            ...sw,
            section: fresh ?? { ...sw.section, name: updated.name, categoriesPermitted: updated.categoriesPermitted },
          };
        })
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

  const newCategorySuggestions = creating.categoryInput.trim()
    ? contractCategories.filter(
        (c) => !creating.categories.includes(c) && c.includes(creating.categoryInput.trim().toUpperCase())
      )
    : [];

  const pinnedMemberIds = allAdmins.filter((a) => a.director).map((a) => a.id);

  const adminSearchResults = creating.memberSearch.length > 0
    ? allAdmins.filter(
        (a) =>
          a.name.toLowerCase().includes(creating.memberSearch.toLowerCase()) &&
          !creating.members.some((m) => m.userId === a.id)
      )
    : [];

  const filteredSections = sectionSearch.trim()
    ? mySections.filter(
        ({ section }) => {
          const term = sectionSearch.trim().toLowerCase();
          const matchesName = section.name.toLowerCase().includes(term);
          const matchesMember = section.members.some((m) =>
            m.userName.toLowerCase().includes(term)
          );
          return matchesName || matchesMember;
        }
      )
    : mySections;

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-full">
            <Building2 size={28} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Meus Setores</h1>
            <p className="text-sm text-slate-500">Setores aos quais você pertence</p>
          </div>
        </div>
        {isDirector && (
          <button
            onClick={() => {
              const directorMembers = allAdmins
                .filter((a) => a.director)
                .map((a) => ({ userId: a.id, role: "LEADER" as SectionRole }));
              setCreating({ ...defaultCreating, members: directorMembers });
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
          >
            <Plus size={16} />
            Criar novo Setor
          </button>
        )}
      </div>

      {mySections.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <Building2 size={36} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Você não está vinculado a nenhum setor.</p>
        </div>
      ) : (
        <>
          <SectionSearchBar
            value={sectionSearch}
            onChange={setSectionSearch}
            total={mySections.length}
            filtered={filteredSections.length}
          />

          {filteredSections.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
              <Search size={32} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                Nenhum setor ou usuário encontrado para &ldquo;{sectionSearch}&rdquo;.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {filteredSections.map((sectionWithRole) => (
              <SectionCard
                key={sectionWithRole.section.id}
                sectionWithRole={sectionWithRole}
                editing={editing}
                isDirector={isDirector}
                myUserId={myUserId}
                allAdmins={allAdmins}
                togglingId={togglingId}
                collapsed={collapsedSections.has(sectionWithRole.section.id)}
                categorySuggestions={categorySuggestions}
                setEditing={setEditing}
                onToggleCollapse={() => toggleCollapse(sectionWithRole.section.id)}
                onOpenEdit={() => openEdit(sectionWithRole.section)}
                onCloseEdit={closeEdit}
                onSaveEdit={handleSaveEdit}
                onDeactivate={(userId) => handleDeactivate(userId, sectionWithRole.section.id)}
                onRemoveMember={(userId) => handleRemoveMember(userId, sectionWithRole.section.id)}
                onAddCategory={addCategory}
                onRemoveCategory={removeCategory}
                onAddMember={handleAddMember}
              />
            ))}
          </div>
        </>
      )}

      {showCreateModal && (
        <CreateSectionModal
          creating={creating}
          setCreating={setCreating}
          allAdmins={allAdmins}
          newCategorySuggestions={newCategorySuggestions}
          adminSearchResults={adminSearchResults}
          pinnedMemberIds={pinnedMemberIds}
          sanitizeSectionName={sanitizeSectionName}
          onClose={closeCreate}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
