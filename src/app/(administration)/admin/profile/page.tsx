"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, updateUser } from "@/src/services/users";
import { getCompanySections } from "@/src/services/companysections";
import { User, UpdateUserRequest, Address } from "@/src/types/user";
import { CompanySection, SectionRole } from "@/src/types/companysections";
import toast from "react-hot-toast";
import { UserCircle, Pencil, X, Save, Loader2, Building2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [mySections, setMySections] = useState<{ section: CompanySection; role: SectionRole }[]>([]);
  const [form, setForm] = useState<UpdateUserRequest>({
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    address: {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const [data, allSections] = await Promise.all([getCurrentUser(), getCompanySections()]);
        setUser(data);
        setUserId(data.id);

        const membership = allSections
          .filter((s) => s.members.some((m) => m.userId === data.id))
          .map((s) => ({
            section: s,
            role: s.members.find((m) => m.userId === data.id)!.role,
          }));
        setMySections(membership);
        setForm({
          name: data.name ?? "",
          cpf: data.cpf ?? "",
          birthDate: data.birthdate ?? "",
          phone: data.phone ?? "",
          address: {
            street: data.address?.street ?? "",
            number: data.address?.number ?? "",
            complement: data.address?.complement ?? "",
            neighborhood: data.address?.neighborhood ?? "",
            city: data.address?.city ?? "",
            state: data.address?.state ?? "",
            zipCode: data.address?.zipCode ?? "",
          },
        });
      } catch {
        toast.error("Erro ao carregar seus dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleChange = (field: keyof Omit<UpdateUserRequest, "address">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address!, [field]: value },
    }));
  };

  const handleCancel = () => {
    if (!user) return;
    setForm({
      name: user.name ?? "",
      cpf: user.cpf ?? "",
      birthDate: user.birthdate ?? "",
      phone: user.phone ?? "",
      address: {
        street: user.address?.street ?? "",
        number: user.address?.number ?? "",
        complement: user.address?.complement ?? "",
        neighborhood: user.address?.neighborhood ?? "",
        city: user.address?.city ?? "",
        state: user.address?.state ?? "",
        zipCode: user.address?.zipCode ?? "",
      },
    });
    setEditing(false);
  };

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // Omit empty strings so the backend never receives blank required fields
      const stripEmpty = <T extends Record<string, unknown>>(obj: T): Partial<T> =>
        Object.fromEntries(
          Object.entries(obj).filter(([, v]) => v !== "" && v !== null && v !== undefined),
        ) as Partial<T>;

      const { address: _addr, ...topLevel } = form as Record<string, unknown>;
      const payload: UpdateUserRequest = { ...stripEmpty(topLevel) };

      const addressPayload = stripEmpty((form.address ?? {}) as Record<string, unknown>);
      if (Object.keys(addressPayload).length > 0) {
        payload.address = addressPayload as unknown as Address;
      }

      const updated = await updateUser(userId, payload);
      setUser(updated);
      setEditing(false);
      toast.success("Perfil atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500">Não foi possível carregar as informações do perfil.</p>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed transition";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-full">
          <UserCircle size={32} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Meu Perfil</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Dados Pessoais + Endereço (retrátil) */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Cabeçalho da seção retrátil */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-700">Dados Pessoais &amp; Endereço</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Pencil size={15} />
                Editar Perfil
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  <X size={15} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              </div>
            )}
          </div>

          {/* Formulário retrátil */}
          {editing && (
            <div className="p-6 space-y-6">
              {/* Dados Pessoais */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Dados Pessoais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome completo</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.name ?? ""}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
                    <input
                      type="email"
                      className={inputClass}
                      disabled
                      value={user.email}
                      title="O e-mail não pode ser alterado"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.cpf ?? ""}
                      onChange={(e) => handleChange("cpf", e.target.value)}
                      placeholder="00000000000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data de nascimento</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={form.birthDate ?? ""}
                      onChange={(e) => handleChange("birthDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
                    <input
                      type="tel"
                      className={inputClass}
                      value={form.phone ?? ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="21999999999"
                    />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Endereço */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Endereço</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rua</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.street ?? ""}
                      onChange={(e) => handleAddressChange("street", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Número</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.number ?? ""}
                      onChange={(e) => handleAddressChange("number", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Complemento</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.complement ?? ""}
                      onChange={(e) => handleAddressChange("complement", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bairro</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.neighborhood ?? ""}
                      onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CEP</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.zipCode ?? ""}
                      onChange={(e) => handleAddressChange("zipCode", e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cidade</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.city ?? ""}
                      onChange={(e) => handleAddressChange("city", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      className={inputClass}
                      value={form.address?.state ?? ""}
                      onChange={(e) => handleAddressChange("state", e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="RJ"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualização somente-leitura (quando não está editando) */}
          {!editing && (
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Nome</p>
                <p className="text-slate-700 font-medium">{user.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">E-mail</p>
                <p className="text-slate-700 font-medium">{user.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">CPF</p>
                <p className="text-slate-700 font-medium">{user.cpf || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Data de nascimento</p>
                <p className="text-slate-700 font-medium">{user.birthdate || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Telefone</p>
                <p className="text-slate-700 font-medium">{user.phone || "—"}</p>
              </div>
              {user.address && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400 mb-0.5">Endereço</p>
                  <p className="text-slate-700 font-medium">
                    {[
                      user.address.street,
                      user.address.number,
                      user.address.complement,
                      user.address.neighborhood,
                      user.address.city,
                      user.address.state,
                      user.address.zipCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Setores */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={18} className="text-slate-500" />
            <h2 className="text-base font-semibold text-slate-700">Setores</h2>
          </div>
          {mySections.length === 0 ? (
            <p className="text-sm text-slate-400">Você não pertence a nenhum setor.</p>
          ) : (
            <ul className="space-y-2">
              {mySections.map(({ section, role }) => (
                <li
                  key={section.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg border border-slate-100 bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-700">{section.name}</span>
                  {role === "LEADER" ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      Líder
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      Membro
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
