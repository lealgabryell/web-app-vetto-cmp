"use client";
import { useEffect, useState } from "react";
import ClientSelector from "../users/ClientSelector";
import { User } from "@/src/types/user";
import { createUser, getAdmins, linkFinancialDetails } from "@/src/services/users";
import { toast } from "react-hot-toast/headless";
import { createContract } from "@/src/services/contracts";
import {
  ContractAdminRequest,
  CreateContractRequest,
  NewContractModalProps,
} from "@/src/types/contracts";
import Cookie from "js-cookie";
import { decodeJwtPayload } from "@/lib/utils";

export default function NewContractModal({ onClose, onSave, existingCategories = [] }: NewContractModalProps) {
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [loggedUserId, setLoggedUserId] = useState("");
  const [availableAdmins, setAvailableAdmins] = useState<User[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<ContractAdminRequest[]>(
    [],
  );
  const [adminSearch, setAdminSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    const token = Cookie.get("user_token") ?? "";
    const payload = decodeJwtPayload(token);
    // JWT sub pode ser e-mail ou UUID dependendo do backend
    const jwtIdentifier = (payload.id ?? payload.sub ?? "") as string;

    getAdmins()
      .then((admins) => {
        const unique = admins.filter(
          (u, i, arr) => arr.findIndex((x) => x.id === u.id) === i,
        );
        setAvailableAdmins(unique);

        // Resolve o UUID real do usuário logado (pode vir como e-mail no JWT)
        const loggedUser = unique.find(
          (u) => u.id === jwtIdentifier || u.email === jwtIdentifier,
        );
        const resolvedId = loggedUser?.id ?? jwtIdentifier;
        setLoggedUserId(resolvedId);

        // Monta lista inicial: todos os diretores (director === true) + usuário logado
        const directors = unique.filter((u) => u.director);
        const initial: ContractAdminRequest[] = directors.map((d) => ({
          adminId: d.id,
          canViewDetails: true,
        }));
        if (resolvedId && !initial.some((a) => a.adminId === resolvedId)) {
          initial.push({ adminId: resolvedId, canViewDetails: true });
        }
        setSelectedAdmins(initial);
      })
      .catch(() => {});
  }, []);

  const pinnedAdminIds = [
    ...availableAdmins.filter((u) => u.director).map((u) => u.id),
    loggedUserId,
  ].filter(Boolean);

  const filteredAdmins = availableAdmins.filter(
    (u) =>
      adminSearch.length > 0 &&
      u.name.toLowerCase().includes(adminSearch.toLowerCase()) &&
      !selectedAdmins.some((a) => a.adminId === u.id),
  );

  const selectAdmin = (user: User) => {
    setSelectedAdmins((prev) => [
      ...prev,
      { adminId: user.id, canViewDetails: true },
    ]);
    setAdminSearch("");
    setShowDropdown(false);
  };

  const removeAdmin = (adminId: string) => {
    if (pinnedAdminIds.includes(adminId)) return;
    setSelectedAdmins((prev) => prev.filter((a) => a.adminId !== adminId));
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    totalValue: 0,
    startDate: "",
    endDate: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    birthdate: "",
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

  // Para campos simples (nome, email, etc)
  const handleUserChange = (field: string, value: string) => {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  };

  // Para campos dentro de address
  const handleAddressChange = (field: string, value: string) => {
    setNewUser((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const handleFinalSubmit = async (
    userData: typeof newUser,
    contractRequest: CreateContractRequest,
  ) => {
    setLoading(true);
    try {
      let clientId = selectedClient?.id;

      if (!selectedClient) {
        // Montamos o objeto completo para o backend
        const payloadUser: Omit<User, "id"> = {
          ...userData,
          role: "CLIENT",
          active: true,
          director: false,
        };

        const createdUser = await createUser(payloadUser as unknown as User);
        clientId = createdUser.id;
      }

      // Vincula dados financeiros se informado e o cliente ainda não possui
      const alreadyHasFinancialDetails = !!selectedClient?.financialDetails;
      if (clientId && accountNumber.trim() && !alreadyHasFinancialDetails) {
        try {
          await linkFinancialDetails(clientId, accountNumber.trim());
        } catch {
          toast.error("Conta bancária não encontrada. O contrato será criado sem dados financeiros.");
        }
      }

      // Agora o clientId é garantidamente uma string
      const created = await createContract({ ...contractRequest, clientId: clientId! });

      toast.success("Contrato e Cliente criados!");
      onSave(created);
    } catch (error) {
      toast.error("Erro ao criar contrato ou cliente: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Preparamos o objeto de contrato baseado no formData
    const contractRequest: CreateContractRequest = {
      title: formData.title,
      description: formData.description,
      totalValue: formData.totalValue,
      startDate: formData.startDate,
      endDate: formData.endDate,
      clientId: selectedClient?.id, // Pode ser undefined se for novo cliente
      category: formData.category || undefined,
      admins: selectedAdmins,
    };

    // Chamamos a função que faz a mágica da sequência
    await handleFinalSubmit(newUser as User, contractRequest);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 p-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl text-blue-600 font-bold mb-6">Novo Contrato</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lado Esquerdo: Dados do Contrato */}
          <div className="space-y-4">
            <input
              placeholder="Título do Contrato"
              required
              className="w-full text-zinc-700 p-2 border rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />

            <textarea
              placeholder="Descrição"
              className="w-full p-2 text-zinc-700 border rounded-lg h-24"
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <input
              type="number"
              placeholder="Valor Total (R$)"
              required
              className="w-full text-zinc-700 p-2 border rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, totalValue: Number(e.target.value) })
              }
            />

            <div className="relative">
              <input
                placeholder="Categoria"
                className="w-full text-zinc-700 p-2 border rounded-lg"
                value={formData.category}
                onChange={(e) => {
                  setFormData({ ...formData, category: e.target.value.toUpperCase() });
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 150)}
                autoComplete="off"
              />
              {showCategoryDropdown &&
                existingCategories.filter(
                  (c) =>
                    c.toLowerCase().includes(formData.category.toLowerCase()) &&
                    c !== formData.category,
                ).length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {existingCategories
                      .filter(
                        (c) =>
                          c.toLowerCase().includes(formData.category.toLowerCase()) &&
                          c !== formData.category,
                      )
                      .map((c) => (
                        <li
                          key={c}
                          onMouseDown={() => {
                            setFormData({ ...formData, category: c.toUpperCase() });
                            setShowCategoryDropdown(false);
                          }}
                          className="px-3 py-2 text-sm text-zinc-700 hover:bg-blue-50 cursor-pointer"
                        >
                          {c}
                        </li>
                      ))}
                  </ul>
                )}
            </div>

            <div className="flex gap-2">
              <input
                type="date"
                className="w-full text-zinc-700 p-2 border rounded-lg text-sm"
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full p-2 text-zinc-700 border rounded-lg text-sm"
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Lado Direito: Cliente */}
          <div className="space-y-4 text-zinc-700 bg-slate-50 p-4 rounded-xl">
            <ClientSelector
              onSelect={(user, cpfTyped) => {
                setSelectedClient(user);
                if (!user) {
                  // Se não encontrou, já joga o CPF para o objeto do novo usuário
                  handleUserChange("cpf", cpfTyped);
                }
              }}
            />

            {/* Dentro do Modal, se o CPF não existir */}
            {!selectedClient && (
              <div className="mt-4 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl space-y-3">
                <h4 className="text-sm font-bold text-blue-800">
                  Novo Cliente: Informações Obrigatórias
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Nome"
                    className="p-2 text-zinc-700 text-sm border rounded"
                    value={newUser.name}
                    onChange={(e) => handleUserChange("name", e.target.value)}
                  />
                  <input
                    placeholder="E-mail"
                    className="p-2 text-sm border rounded"
                    value={newUser.email}
                    onChange={(e) => handleUserChange("email", e.target.value)}
                  />
                  <input
                    placeholder="Senha Provisória"
                    type="password"
                    className="p-2 text-sm border rounded"
                    value={newUser.password}
                    onChange={(e) =>
                      handleUserChange("password", e.target.value)
                    }
                  />
                  <input
                    placeholder="Data de Aniversário"
                    type="date"
                    className="p-2 text-sm border rounded"
                    value={newUser.birthdate}
                    onChange={(e) =>
                      handleUserChange("birthdate", e.target.value)
                    }
                  />
                  <input
                    placeholder="Telefone"
                    className="p-2 text-sm border rounded"
                    value={newUser.phone}
                    onChange={(e) => handleUserChange("phone", e.target.value)}
                  />
                </div>

                <h5 className="text-[10px] font-bold text-slate-500 uppercase mt-2">
                  Endereço:
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="CEP"
                    className="p-2 text-xs border rounded text-zinc-700"
                    value={newUser.address.zipCode}
                    onChange={(e) =>
                      handleAddressChange("zipCode", e.target.value)
                    }
                  />
                  <input
                    placeholder="Rua"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.street}
                    onChange={(e) =>
                      handleAddressChange("street", e.target.value)
                    }
                  />
                  <input
                    placeholder="Número"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.number}
                    onChange={(e) =>
                      handleAddressChange("number", e.target.value)
                    }
                  />
                  <input
                    placeholder="Complemento"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.complement}
                    onChange={(e) =>
                      handleAddressChange("complement", e.target.value)
                    }
                  />
                  <input
                    placeholder="Bairro"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.neighborhood}
                    onChange={(e) =>
                      handleAddressChange("neighborhood", e.target.value)
                    }
                  />
                  <input
                    placeholder="Cidade"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.city}
                    onChange={(e) =>
                      handleAddressChange("city", e.target.value)
                    }
                  />
                  <select
                    className="col-span-2 p-2 text-xs border rounded bg-white text-zinc-700"
                    value={newUser.address.state}
                    onChange={(e) =>
                      handleAddressChange("state", e.target.value)
                    }
                  >
                    <option value="">Estado</option>
                    {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(
                      (uf) => <option key={uf} value={uf}>{uf}</option>
                    )}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dados Bancários (Opcional) */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl space-y-2">
          <h4 className="text-sm font-bold text-slate-700">
            Dados Bancários
            <span className="ml-2 text-xs font-normal text-slate-400">(opcional)</span>
          </h4>

          {selectedClient?.financialDetails ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✅ Conta já vinculada:{" "}
              <span className="font-mono font-semibold">
                {selectedClient.financialDetails.accountNumber}
              </span>
            </p>
          ) : (
            <input
              type="text"
              placeholder="Número da conta (ex: 000123456)"
              className="w-full p-2 text-sm text-zinc-700 border rounded-lg"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
          )}
        </div>

        {/* Admins do contrato */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl space-y-3">
          <div>
            <h4 className="text-sm font-bold text-slate-700">
              Administradores do contrato
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">
              👑 Diretores e o usuário logado são fixos. Membros dos setores cuja
              categoria corresponda ao contrato serão vinculados automaticamente
              pelo sistema.
            </p>
          </div>

          {/* Tags dos admins selecionados */}
          <div className="flex flex-wrap gap-2">
            {selectedAdmins.map((a) => {
              const user = availableAdmins.find((u) => u.id === a.adminId);
              const isPinned = pinnedAdminIds.includes(a.adminId);
              const displayName = user
                ? `${user.name}${user.director ? " 👑" : ""}`
                : a.adminId;
              return (
                <div
                  key={a.adminId}
                  className={`flex items-center gap-2 pl-3 pr-2 py-1 rounded-full text-xs font-medium border ${
                    isPinned
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-white border-slate-300 text-zinc-700"
                  }`}
                >
                  <span>{displayName}</span>
                  {!isPinned && (
                    <button
                      type="button"
                      onClick={() => removeAdmin(a.adminId)}
                      className="text-slate-400 hover:text-red-500 font-bold leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input de busca */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar admin por nome..."
              value={adminSearch}
              onChange={(e) => {
                setAdminSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              className="w-full p-2 text-sm text-zinc-700 border rounded-lg bg-white"
            />
            {showDropdown && filteredAdmins.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredAdmins.map((u) => (
                  <li
                    key={u.id}
                    onMouseDown={() => selectAdmin(u)}
                    className="px-3 py-2 text-sm text-zinc-700 hover:bg-blue-50 cursor-pointer"
                  >
                    {u.name}
                    <span className="text-slate-400 ml-1">— {u.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-slate-500 font-bold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70"
          >
            {loading ? "Criando..." : "Criar Contrato"}
          </button>
        </div>
      </form>
    </div>
  );
}
