"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { createUser } from "@/src/services/users";
import { CreateUserRequest, Address, FinancialDetailsRequest, AccountType } from "@/src/types/user";
import toast from "react-hot-toast";

// ── Input sanitizers ──────────────────────────────────────────────────────
const sanitizeText = (v: string) => v.replace(/[<>"'`]/g, "");
const onlyDigits = (v: string, maxLen?: number) => {
  const d = v.replace(/\D/g, "");
  return maxLen !== undefined ? d.slice(0, maxLen) : d;
};
const onlyLetters = (v: string, maxLen?: number) => {
  const l = v.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
  return maxLen !== undefined ? l.slice(0, maxLen) : l;
};
const formatPhone = (v: string) => v.replace(/[^\d+\-()\s]/g, "").slice(0, 20);
const formatCpf = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
const formatZipCode = (v: string) => v.replace(/[^\d\-]/g, "").slice(0, 9);
const safeText = (v: string, maxLen: number) => sanitizeText(v).slice(0, maxLen);

// ── Validators ────────────────────────────────────────────────────────────────
function isValidCpf(raw: string): boolean {
  const cpf = raw.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let first = 11 - (sum % 11);
  if (first >= 10) first = 0;
  if (first !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let second = 11 - (sum % 11);
  if (second >= 10) second = 0;
  return second === Number(cpf[10]);
}

function ageIsAtLeast16(birthDate: string): boolean {
  if (!birthDate) return true; // optional field — skip when empty
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return false;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 16);
  return birth <= cutoff;
}
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "CORRENTE", label: "Conta Corrente" },
  { value: "POUPANCA", label: "Conta Poupança" },
  { value: "SALARIO", label: "Conta Salário" },
  { value: "PAGAMENTO", label: "Conta Pagamento" },
];

const BLANK_ADDRESS: Address = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
};

const BLANK_FINANCIAL: FinancialDetailsRequest = {
  bankCode: "",
  bankName: "",
  agency: "",
  agencyDigit: "",
  accountNumber: "",
  accountVerificationDigit: "",
  accountType: undefined,
  ownerDocument: "",
  ownerName: "",
  pixKey: "",
};

interface Props {
  onClose: () => void;
  onCreated?: () => void;
}

export default function NewUserAdminModal({ onClose, onCreated }: Props) {
  const [saving, setSaving] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
    birthDate: string;
    role: "ADMIN" | "CLIENT";
    director: boolean;
  }>({
    name: "",
    email: "",
    password: "",
    cpf: "",
    phone: "",
    birthDate: "",
    role: "ADMIN",
    director: false,
  });

  const [address, setAddress] = useState<Address>(BLANK_ADDRESS);
  const [financial, setFinancial] = useState<FinancialDetailsRequest>(BLANK_FINANCIAL);
  const [includeFinancial, setIncludeFinancial] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<"name" | "cpf" | "birthDate", string>>>({});

  const clearError = (field: "name" | "cpf" | "birthDate") =>
    setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setAddressField = <K extends keyof Address>(key: K, value: Address[K]) =>
    setAddress((prev) => ({ ...prev, [key]: value }));

  const setFinancialField = <K extends keyof FinancialDetailsRequest>(
    key: K,
    value: FinancialDetailsRequest[K],
  ) => setFinancial((prev) => ({ ...prev, [key]: value }));

  const isAddressFilled = Object.values(address).some((v) => v.trim() !== "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: typeof errors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Nome é obrigatório.";
    } else if (form.name.trim().length > 55) {
      nextErrors.name = "Nome deve ter no máximo 55 caracteres.";
    }

    if (!form.cpf.trim()) {
      nextErrors.cpf = "CPF é obrigatório.";
    } else if (!isValidCpf(form.cpf)) {
      nextErrors.cpf = "CPF inválido.";
    }

    if (form.birthDate && !ageIsAtLeast16(form.birthDate)) {
      nextErrors.birthDate = "O usuário deve ter ao menos 16 anos.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});

    if (!form.email.trim()) return toast.error("E-mail é obrigatório.");
    if (!form.password.trim()) return toast.error("Senha é obrigatória.");

    const payload: CreateUserRequest = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      cpf: form.cpf.trim(),
      phone: form.phone.trim() || undefined,
      birthDate: form.birthDate || undefined,
      role: form.role,
      director: form.role === "ADMIN" ? form.director : false,
      address: isAddressFilled ? address : undefined,
      financialDetails: includeFinancial ? financial : undefined,
    };

    setSaving(true);
    try {
      await createUser(payload);
      toast.success("Usuário criado com sucesso!");
      onCreated?.();
      onClose();
    } catch {
      toast.error("Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">Criar novo usuário</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* ── Dados principais ─────────────────────────────────────── */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Dados principais
            </p>

            {/* Nome */}
            <Field label="Nome completo" required error={errors.name}>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                className={inputCls + (errors.name ? " border-red-400 focus:ring-red-400" : "")}
                value={form.name}
                onChange={(e) => {
                  setField("name", onlyLetters(sanitizeText(e.target.value), 55));
                  clearError("name");
                }}
                disabled={saving}
              />
            </Field>

            {/* E-mail */}
            <Field label="E-mail" required>
              <input
                type="email"
                placeholder="Ex: joao@email.com"
                className={inputCls}
                value={form.email}
                onChange={(e) => setField("email", safeText(e.target.value, 150))}
                disabled={saving}
              />
            </Field>

            {/* Senha */}
            <Field label="Senha" required>
              <input
                type="password"
                placeholder="Mín. 8 caracteres"
                className={inputCls}
                value={form.password}
                onChange={(e) => setField("password", e.target.value.slice(0, 64))}
                disabled={saving}
                autoComplete="new-password"
              />
            </Field>

            {/* CPF + Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF" required error={errors.cpf}>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  className={inputCls + (errors.cpf ? " border-red-400 focus:ring-red-400" : "")}
                  value={form.cpf}
                  onChange={(e) => {
                    setField("cpf", formatCpf(e.target.value));
                    clearError("cpf");
                  }}
                  disabled={saving}
                />
              </Field>
              <Field label="Telefone">
                <input
                  type="text"
                  placeholder="(21) 99999-9999"
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setField("phone", formatPhone(e.target.value))}
                  disabled={saving}
                />
              </Field>
            </div>

            {/* Data de nascimento + Perfil */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data de nascimento" error={errors.birthDate}>
                <input
                  type="date"
                  className={inputCls + (errors.birthDate ? " border-red-400 focus:ring-red-400" : "")}
                  value={form.birthDate}
                  onChange={(e) => {
                    setField("birthDate", e.target.value);
                    clearError("birthDate");
                  }}
                  disabled={saving}
                />
              </Field>
              <Field label="Perfil" required>
                <select
                  className={inputCls}
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value as "ADMIN" | "CLIENT")}
                  disabled={saving}
                >
                  <option value="CLIENT">Cliente</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </Field>
            </div>

            {/* Diretor (apenas para ADMIN) */}
            {form.role === "ADMIN" && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={form.director}
                  onChange={(e) => setField("director", e.target.checked)}
                  disabled={saving}
                />
                <span className="text-sm text-slate-700">
                  Marcar como <strong>Diretor</strong>
                </span>
              </label>
            )}
          </section>

          {/* ── Endereço (colapsável) ────────────────────────────────── */}
          <section>
            <button
              type="button"
              onClick={() => setShowAddress((v) => !v)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-600 transition"
            >
              <span>Endereço <span className="font-normal normal-case text-slate-400">(opcional)</span></span>
              {showAddress ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAddress && (
              <div className="space-y-3">
                {/* CEP + Estado */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="CEP">
                    <input
                      type="text"
                      placeholder="00000-000"
                      className={inputCls}
                      value={address.zipCode}
                      onChange={(e) => setAddressField("zipCode", formatZipCode(e.target.value))}
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Estado (UF)">
                    <input
                      type="text"
                      placeholder="RJ"
                      className={inputCls}
                      maxLength={2}
                      value={address.state}
                      onChange={(e) =>
                        setAddressField("state", e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))
                      }
                      disabled={saving}
                    />
                  </Field>
                </div>

                {/* Cidade + Bairro */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cidade">
                    <input
                      type="text"
                      placeholder="Ex: Rio de Janeiro"
                      className={inputCls}
                      value={address.city}
                      onChange={(e) => setAddressField("city", safeText(e.target.value, 80))}
                      disabled={saving}
                    />
                  </Field>
                  <Field label="Bairro">
                    <input
                      type="text"
                      placeholder="Ex: Centro"
                      className={inputCls}
                      value={address.neighborhood}
                      onChange={(e) => setAddressField("neighborhood", safeText(e.target.value, 80))}
                      disabled={saving}
                    />
                  </Field>
                </div>

                {/* Rua + Número */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Field label="Rua">
                      <input
                        type="text"
                        placeholder="Ex: Rua das Flores"
                        className={inputCls}
                        value={address.street}
                        onChange={(e) => setAddressField("street", safeText(e.target.value, 120))}
                        disabled={saving}
                      />
                    </Field>
                  </div>
                  <Field label="Número">
                    <input
                      type="text"
                      placeholder="123"
                      className={inputCls}
                      value={address.number}
                      onChange={(e) => setAddressField("number", safeText(e.target.value, 10))}
                      disabled={saving}
                    />
                  </Field>
                </div>

                {/* Complemento */}
                <Field label="Complemento">
                  <input
                    type="text"
                    placeholder="Ex: Apto 01"
                    className={inputCls}
                    value={address.complement}
                    onChange={(e) => setAddressField("complement", safeText(e.target.value, 60))}
                    disabled={saving}
                  />
                </Field>
              </div>
            )}
          </section>

          {/* ── Dados bancários (colapsável) ────────────────────────── */}
          <section>
            <button
              type="button"
              onClick={() => setShowFinancial((v) => !v)}
              className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-600 transition"
            >
              <span>Dados bancários <span className="font-normal normal-case text-slate-400">(opcional)</span></span>
              {showFinancial ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFinancial && (
              <div className="space-y-3">
                {/* Toggle incluir / não incluir */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={includeFinancial}
                    onChange={(e) => setIncludeFinancial(e.target.checked)}
                    disabled={saving}
                  />
                  <span className="text-sm text-slate-700">Incluir dados bancários</span>
                </label>

                {includeFinancial && (
                  <>
                    {/* Banco */}
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Código do banco">
                        <input
                          type="text"
                          placeholder="001"
                          className={inputCls}
                          value={financial.bankCode ?? ""}
                          onChange={(e) => setFinancialField("bankCode", onlyDigits(e.target.value, 10))}
                          disabled={saving}
                        />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Nome do banco">
                          <input
                            type="text"
                            placeholder="Ex: Banco do Brasil"
                            className={inputCls}
                            value={financial.bankName ?? ""}
                            onChange={(e) => setFinancialField("bankName", safeText(e.target.value, 80))}
                            disabled={saving}
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Agência */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Field label="Agência">
                          <input
                            type="text"
                            placeholder="0001"
                            className={inputCls}
                            value={financial.agency ?? ""}
                            onChange={(e) => setFinancialField("agency", onlyDigits(e.target.value, 10))}
                            disabled={saving}
                          />
                        </Field>
                      </div>
                      <Field label="Dígito">
                        <input
                          type="text"
                          placeholder="0"
                          className={inputCls}
                          value={financial.agencyDigit ?? ""}
                          onChange={(e) =>
                            setFinancialField(
                              "agencyDigit",
                              e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 1),
                            )
                          }
                          disabled={saving}
                        />
                      </Field>
                    </div>

                    {/* Conta */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Field label="Número da conta">
                          <input
                            type="text"
                            placeholder="00000000"
                            className={inputCls}
                            value={financial.accountNumber ?? ""}
                            onChange={(e) => setFinancialField("accountNumber", onlyDigits(e.target.value, 20))}
                            disabled={saving}
                          />
                        </Field>
                      </div>
                      <Field label="Dígito">
                        <input
                          type="text"
                          placeholder="0"
                          className={inputCls}
                          value={financial.accountVerificationDigit ?? ""}
                          onChange={(e) =>
                            setFinancialField(
                              "accountVerificationDigit",
                              e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 1),
                            )
                          }
                          disabled={saving}
                        />
                      </Field>
                    </div>

                    {/* Tipo de conta */}
                    <Field label="Tipo de conta">
                      <select
                        className={inputCls}
                        value={financial.accountType ?? ""}
                        onChange={(e) =>
                          setFinancialField("accountType", (e.target.value as AccountType) || undefined)
                        }
                        disabled={saving}
                      >
                        <option value="">Selecione...</option>
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    {/* Titular */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Nome do titular">
                        <input
                          type="text"
                          placeholder="Ex: João da Silva"
                          className={inputCls}
                          value={financial.ownerName ?? ""}
                          onChange={(e) =>
                            setFinancialField("ownerName", onlyLetters(sanitizeText(e.target.value), 100))
                          }
                          disabled={saving}
                        />
                      </Field>
                      <Field label="CPF/CNPJ do titular">
                        <input
                          type="text"
                          placeholder="000.000.000-00"
                          className={inputCls}
                          value={financial.ownerDocument ?? ""}
                          onChange={(e) =>
                            setFinancialField("ownerDocument", e.target.value.replace(/[^\d.\-/]/g, "").slice(0, 18))
                          }
                          disabled={saving}
                        />
                      </Field>
                    </div>

                    {/* Chave Pix */}
                    <Field label="Chave Pix">
                      <input
                        type="text"
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                        className={inputCls}
                        value={financial.pixKey ?? ""}
                        onChange={(e) => setFinancialField("pixKey", safeText(e.target.value, 100))}
                        disabled={saving}
                      />
                    </Field>
                  </>
                )}
              </div>
            )}
          </section>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="new-user-form"
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white disabled:bg-slate-50 disabled:text-slate-400";

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
