import { useState, useEffect } from "react";
import { ContractStepResponse, UpdateContractStepRequest } from "../../types/contracts";
import { getAdmins } from "../../services/users";
import { User } from "../../types/user";

interface EditStepModalProps {
  step: ContractStepResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: UpdateContractStepRequest) => Promise<void>;
}

export default function EditStepModal({ step, isOpen, onClose, onSave }: EditStepModalProps) {
  const [titulo, setTitulo] = useState(step.titulo);
  const [dataInicio, setDataInicio] = useState(step.dataInicio);
  const [previsaoConclusao, setPrevisaoConclusao] = useState(step.previsaoConclusao);
  const [responsavelIds, setResponsavelIds] = useState<string[]>(step.responsaveis.map((u) => u.id));
  const [aprovadorIds, setAprovadorIds] = useState<string[]>(step.aprovadores.map((u) => u.id));
  const [admins, setAdmins] = useState<User[]>([]);
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitulo(step.titulo);
    setDataInicio(step.dataInicio);
    setPrevisaoConclusao(step.previsaoConclusao);
    setResponsavelIds(step.responsaveis.map((u) => u.id));
    setAprovadorIds(step.aprovadores.map((u) => u.id));
  }, [step]);

  useEffect(() => {
    getAdmins().then(setAdmins).catch(() => {});
  }, []);

  const toggleUser = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previsaoConclusao && dataInicio && previsaoConclusao < dataInicio) {
      setDateError("A previsão de conclusão não pode ser anterior à data de início.");
      return;
    }
    setDateError("");
    setLoading(true);
    try {
      const payload: UpdateContractStepRequest = {
        titulo,
        dataInicio,
        previsaoConclusao,
        ...(responsavelIds.length > 0 && { responsavelIds }),
        ...(aprovadorIds.length > 0 && { aprovadorIds }),
        pdfUrls: step.pdfUrls,
      };
      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Editar Etapa</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Título</label>
            <input
              type="text" required
              className="w-full border rounded-lg p-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Início</label>
              <input
                type="date" required
                className="w-full border rounded-lg p-2 text-sm text-slate-900 outline-none"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setDateError(""); }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Previsão Fim</label>
              <input
                type="date" required
                className="w-full border rounded-lg p-2 text-sm text-slate-900 outline-none"
                value={previsaoConclusao}
                onChange={(e) => { setPrevisaoConclusao(e.target.value); setDateError(""); }}
              />
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600">{dateError}</p>}

          {/* Responsáveis */}
          <UserMultiSelect
            label="Responsáveis pela execução"
            users={admins}
            selected={responsavelIds}
            onToggle={(id) => toggleUser(id, responsavelIds, setResponsavelIds)}
          />

          {/* Aprovadores */}
          <UserMultiSelect
            label="Aprovadores"
            users={admins}
            selected={aprovadorIds}
            onToggle={(id) => toggleUser(id, aprovadorIds, setAprovadorIds)}
          />

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── helper sub-component ──────────────────────────────────────────────────────
function UserMultiSelect({
  label,
  users,
  selected,
  onToggle,
}: {
  label: string;
  users: User[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
      {users.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Carregando usuários...</p>
      ) : (
        <div className="border rounded-lg divide-y max-h-36 overflow-y-auto">
          {users.map((u) => {
            const checked = selected.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${checked ? "bg-blue-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(u.id)}
                  className="accent-blue-600"
                />
                <span className="text-xs text-slate-700">{u.name}</span>
                <span className="text-[10px] text-slate-400 ml-auto">{u.email}</span>
              </label>
            );
          })}
        </div>
      )}
      {selected.length > 0 && (
        <p className="text-[10px] text-blue-600 mt-1">{selected.length} selecionado(s)</p>
      )}
    </div>
  );
}
