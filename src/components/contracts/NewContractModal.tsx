"use client";
import { useEffect, useState } from "react";
import ClientSelector from "../users/ClientSelector";
import { User, FinancialDetails } from "@/src/types/user";
import { createUser, getAdmins, linkFinancialDetails, getFinancialDetailsByAccountNumber } from "@/src/services/users";
import { toast } from "react-hot-toast/headless";
import { createContract } from "@/src/services/contracts";
import {
  ContractAdminRequest,
  CreateContractRequest,
  NewContractModalProps,
} from "@/src/types/contracts";
import Cookie from "js-cookie";
import { decodeJwtPayload } from "@/lib/utils";

// ── Input sanitizers ──────────────────────────────────────────────────────
/** Remove <, >, ", ', ` to prevent HTML/script injection */
const sanitizeText = (v: string) => v.replace(/[<>"'`]/g, "");
/** Keep only digit characters, optionally capped at maxLen */
const onlyDigits = (v: string, maxLen?: number) => {
  const d = v.replace(/\D/g, "");
  return maxLen !== undefined ? d.slice(0, maxLen) : d;
};
/** Letters (including accented), hyphens, apostrophes, and spaces only */
const onlyLetters = (v: string, maxLen?: number) => {
  const l = v.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
  return maxLen !== undefined ? l.slice(0, maxLen) : l;
};
/** Phone: digits, +, -, (, ), space — max 20 */
const formatPhone = (v: string) => v.replace(/[^\d+\-()\s]/g, "").slice(0, 20);
/** CPF / CNPJ: digits, dots, dashes, slashes — max 18 */
const formatDocument = (v: string) => v.replace(/[^\d.\-/]/g, "").slice(0, 18);
/** Agency / bank check digit: single digit or X */
const agencyDigitChar = (v: string) =>
  v.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 1);
/** Generic safe text: no HTML + length cap */
const safeText = (v: string, maxLen: number) =>
  sanitizeText(v).slice(0, maxLen);
// ─────────────────────────────────────────────────────────────────────────────

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
  const [checkingAccount, setCheckingAccount] = useState(false);
  // undefined = ainda não checado; null = checado, não encontrado; objeto = encontrado
  const [checkedDetails, setCheckedDetails] = useState<FinancialDetails | null | undefined>(undefined);
  const [financialForm, setFinancialForm] = useState<Partial<FinancialDetails>>({});

  const handleCheckAccount = async () => {
    if (!accountNumber.trim()) return;
    setCheckingAccount(true);
    try {
      const details = await getFinancialDetailsByAccountNumber(accountNumber.trim());
      setCheckedDetails(details);
      setFinancialForm(details);
    } catch {
      setCheckedDetails(null);
      setFinancialForm({});
      toast.error("Conta não encontrada. Preencha os dados manualmente.");
    } finally {
      setCheckingAccount(false);
    }
  };

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
              maxLength={100}
              className="w-full text-zinc-700 p-2 border rounded-lg"
              onChange={(e) =>
                setFormData({ ...formData, title: safeText(e.target.value, 100) })
              }
            />

            <textarea
              placeholder="Descrição"
              maxLength={500}
              className="w-full p-2 text-zinc-700 border rounded-lg h-24"
              onChange={(e) =>
                setFormData({ ...formData, description: safeText(e.target.value, 500) })
              }
            />

            <input
              type="number"
              placeholder="Valor Total (R$)"
              required
              min={0}
              className="w-full text-zinc-700 p-2 border rounded-lg"
              onChange={(e) => {
                const val = Math.max(0, Number(e.target.value));
                setFormData({ ...formData, totalValue: val });
              }}
            />

            <div className="relative">
              <input
                placeholder="Categoria"
                className="w-full text-zinc-700 p-2 border rounded-lg"
                value={formData.category}
                maxLength={50}
                onChange={(e) => {
                  setFormData({ ...formData, category: safeText(e.target.value, 50).toUpperCase() });
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
                    maxLength={100}
                    onChange={(e) => handleUserChange("name", onlyLetters(e.target.value, 100))}
                  />
                  <input
                    type="email"
                    placeholder="E-mail"
                    className="p-2 text-sm border rounded"
                    value={newUser.email}
                    maxLength={150}
                    onChange={(e) => handleUserChange("email", safeText(e.target.value, 150).toLowerCase())}
                  />
                  <input
                    placeholder="Senha Provisória"
                    type="password"
                    className="p-2 text-sm border rounded"
                    value={newUser.password}
                    maxLength={100}
                    onChange={(e) =>
                      handleUserChange("password", safeText(e.target.value, 100))
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
                    maxLength={20}
                    onChange={(e) => handleUserChange("phone", formatPhone(e.target.value))}
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
                    maxLength={8}
                    onChange={(e) =>
                      handleAddressChange("zipCode", onlyDigits(e.target.value, 8))
                    }
                  />
                  <input
                    placeholder="Rua"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.street}
                    maxLength={100}
                    onChange={(e) =>
                      handleAddressChange("street", safeText(e.target.value, 100))
                    }
                  />
                  <input
                    placeholder="Número"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.number}
                    maxLength={10}
                    onChange={(e) =>
                      handleAddressChange("number", safeText(e.target.value, 10))
                    }
                  />
                  <input
                    placeholder="Complemento"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.complement}
                    maxLength={100}
                    onChange={(e) =>
                      handleAddressChange("complement", safeText(e.target.value, 100))
                    }
                  />
                  <input
                    placeholder="Bairro"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.neighborhood}
                    maxLength={100}
                    onChange={(e) =>
                      handleAddressChange("neighborhood", safeText(e.target.value, 100))
                    }
                  />
                  <input
                    placeholder="Cidade"
                    className="col-span-2 p-2 text-xs border rounded"
                    value={newUser.address.city}
                    maxLength={60}
                    onChange={(e) =>
                      handleAddressChange("city", onlyLetters(e.target.value, 60))
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
            <>
              {/* Input + botão Checar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Número da conta (ex: 000123456)"
                  className="flex-1 p-2 text-sm text-zinc-700 border rounded-lg"
                  value={accountNumber}
                  onChange={(e) => {
                    const val = onlyDigits(e.target.value, 9);
                    setAccountNumber(val);
                    setCheckedDetails(undefined);
                    // auto-derive verification digit from last typed character
                    setFinancialForm({ accountVerificationDigit: val.slice(-1) });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCheckAccount())}
                />
                <button
                  type="button"
                  onClick={handleCheckAccount}
                  disabled={checkingAccount || !accountNumber.trim() || checkedDetails !== undefined}
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {checkingAccount ? "..." : "Checar"}
                </button>
              </div>

              {/* Detalhes financeiros — exibidos após checagem */}
              {checkedDetails !== undefined && (
                <div className="mt-3 p-3 border rounded-lg bg-white space-y-2">
                  {checkedDetails !== null && (
                    <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                      ✅ Conta encontrada — campos preenchidos automaticamente
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Cód. Banco"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.bankCode ?? ""}
                      maxLength={4}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, bankCode: onlyDigits(e.target.value, 4) }))}
                    />
                    <input
                      placeholder="Nome do Banco"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.bankName ?? ""}
                      maxLength={60}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, bankName: safeText(e.target.value, 60) }))}
                    />
                    <input
                      placeholder="Agência"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.agency ?? ""}
                      maxLength={5}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, agency: onlyDigits(e.target.value, 5) }))}
                    />
                    <input
                      placeholder="Dígito da Agência"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.agencyDigit ?? ""}
                      maxLength={1}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, agencyDigit: agencyDigitChar(e.target.value) }))}
                    />
                    {/* Dígito da conta: derivado automaticamente do último dígito do número de conta */}
                    <div className="p-2 text-xs border rounded bg-slate-50 text-zinc-500 flex items-center gap-1">
                      <span className="text-zinc-400">Dígito da Conta:</span>
                      <span className="font-mono font-semibold text-zinc-700">
                        {financialForm.accountVerificationDigit ?? "—"}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-400">(automático)</span>
                    </div>
                    <select
                      className="p-2 text-xs border rounded bg-white text-zinc-700"
                      value={financialForm.accountType ?? ""}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, accountType: e.target.value as FinancialDetails["accountType"] }))}
                    >
                      <option value="">Tipo de conta</option>
                      <option value="CORRENTE">Corrente</option>
                      <option value="POUPANCA">Poupança</option>
                      <option value="SALARIO">Salário</option>
                      <option value="PAGAMENTO">Pagamento</option>
                    </select>
                    <input
                      placeholder="Titular"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.ownerName ?? ""}
                      maxLength={100}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, ownerName: onlyLetters(e.target.value, 100) }))}
                    />
                    <input
                      placeholder="CPF / CNPJ do Titular"
                      className="p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.ownerDocument ?? ""}
                      maxLength={18}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, ownerDocument: formatDocument(e.target.value) }))}
                    />
                    <input
                      placeholder="Chave PIX"
                      className="col-span-2 p-2 text-xs border rounded text-zinc-700"
                      value={financialForm.pixKey ?? ""}
                      maxLength={77}
                      onChange={(e) => setFinancialForm((p) => ({ ...p, pixKey: safeText(e.target.value, 77) }))}
                    />
                  </div>
                </div>
              )}
            </>
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
