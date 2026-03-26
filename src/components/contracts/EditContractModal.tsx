import { useState, useEffect } from "react";
import { ContractResponse, ContractStatus, UpdateContractRequest, TipoRecorrencia } from "../../types/contracts";

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

const TIPOS_RECORRENCIA = [
  { value: "MENSAL",    label: "Mensal" },
  { value: "SEMANAL",   label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL",     label: "Anual" },
] as const;

interface EditContractModalProps {
  contract: ContractResponse;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpdateContractRequest) => Promise<void>;
  existingCategories?: string[];
}

export default function EditContractModal({ contract, isOpen, onClose, onSave, existingCategories = [] }: EditContractModalProps) {
  const [formData, setFormData] = useState<UpdateContractRequest>({
    title: "",
    description: "",
    totalValue: 0,
    startDate: "",
    endDate: "",
    status: "DRAFT",
    keyClauses: [],
    recorrencia: false,
    tipoRecorrencia: undefined,
    diaPagamento: undefined,
    segundoDiaPagamento: undefined,
    mesPagamento: undefined,
    dataPagamentoAnual: "",
    valorRecorrente: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title,
        description: contract.description || "",
        totalValue: contract.totalValue ?? undefined,
        // Garante formato YYYY-MM-DD para o input date
        startDate: contract.startDate.split("T")[0],
        endDate: contract.endDate.split("T")[0],
        status: contract.status,
        scannedContractUrl: contract.scannedContractUrl,
        finalProjectUrl: contract.finalProjectUrl,
        category: contract.category,
        aiRiskScore: contract.aiRiskScore,
        aiAnalysisSummary: contract.aiAnalysisSummary,
        autoExtracted: contract.autoExtracted,
        keyClauses: contract.keyClauses ?? [],
        recorrencia: contract.recorrencia ?? false,
        tipoRecorrencia: contract.tipoRecorrencia ?? undefined,
        diaPagamento: contract.diaPagamento ?? undefined,
        segundoDiaPagamento: contract.segundoDiaPagamento ?? undefined,
        mesPagamento: contract.mesPagamento ?? undefined,
        dataPagamentoAnual: contract.dataPagamentoAnual ?? "",
        valorRecorrente: contract.valorRecorrente ?? 0,
      });
    }
  }, [contract]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: UpdateContractRequest = formData.recorrencia
        ? {
            ...formData,
            totalValue: undefined,
            // limpa campos de outros tipos de recorrência
            diaPagamento: ["MENSAL", "QUINZENAL", "SEMESTRAL", "SEMANAL"].includes(formData.tipoRecorrencia ?? "") ? formData.diaPagamento : undefined,
            segundoDiaPagamento: formData.tipoRecorrencia === "QUINZENAL" ? formData.segundoDiaPagamento : undefined,
            mesPagamento: formData.tipoRecorrencia === "SEMESTRAL" ? formData.mesPagamento : undefined,
            dataPagamentoAnual: formData.tipoRecorrencia === "ANUAL" ? formData.dataPagamentoAnual : undefined,
          }
        : {
            ...formData,
            tipoRecorrencia: undefined,
            valorRecorrente: undefined,
            diaPagamento: undefined,
            segundoDiaPagamento: undefined,
            mesPagamento: undefined,
            dataPagamentoAnual: undefined,
          };
      await onSave({
        ...payload,
        category: payload.category ? normalizeCategory(payload.category) : undefined,
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 text-zinc-950  bg-black/50 flex items-center justify-center z-80 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Editar Contrato</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* ... Inputs de Título e Descrição ... */}
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Título do Projeto</label>
            <input
              type="text"
              required
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Descrição</label>
            <textarea
              rows={2}
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Toggle de recorrência */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={formData.recorrencia ?? false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  recorrencia: e.target.checked,
                  totalValue: e.target.checked ? undefined : 0,
                  tipoRecorrencia: e.target.checked ? formData.tipoRecorrencia : undefined,
                  valorRecorrente: e.target.checked ? (formData.valorRecorrente ?? 0) : 0,
                  diaPagamento: undefined,
                  segundoDiaPagamento: undefined,
                  mesPagamento: undefined,
                  dataPagamentoAnual: "",
                })
              }
            />
            <span className="text-sm text-zinc-700 font-medium">Contrato com recorrência (pagamento periódico)</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            {/* Valor Total OU Tipo de recorrência */}
            {!formData.recorrencia ? (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.totalValue ?? 0}
                  onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) })}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tipo de recorrência</label>
                <select
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={formData.tipoRecorrencia ?? ""}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoRecorrencia: (e.target.value as TipoRecorrencia) || undefined })
                  }
                >
                  <option value="">Selecione...</option>
                  {TIPOS_RECORRENCIA.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* STATUS */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Status Atual</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                  className={`w-full border rounded-lg p-2.5 text-sm font-bold outline-none cursor-pointer
                    ${formData.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${formData.status === 'FINISHED' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${formData.status === 'DRAFT' ? 'bg-gray-50 text-gray-700 border-gray-200' : ''}
                    ${formData.status === 'SUSPENDED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                  `}
                >
                    <option value="DRAFT">Rascunho</option>
                    <option value="ACTIVE">Ativo</option>
                    <option value="SUSPENDED">Suspenso</option>
                    <option value="FINISHED">Finalizado</option>
                </select>
            </div>
          </div>

          {/* Campos adicionais de recorrência */}
          {formData.recorrencia && (
            <div className="space-y-3">
              {/* Valor por ciclo */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Valor por ciclo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.valorRecorrente ?? 0}
                  onChange={(e) => setFormData({ ...formData, valorRecorrente: parseFloat(e.target.value) })}
                />
              </div>

              {/* MENSAL */}
              {formData.tipoRecorrencia === "MENSAL" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dia do pagamento (1–31)</label>
                  <input type="number" min={1} max={31} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.diaPagamento ?? ""}
                    onChange={(e) => setFormData({ ...formData, diaPagamento: Number(e.target.value) || undefined })} />
                </div>
              )}

              {/* QUINZENAL */}
              {formData.tipoRecorrencia === "QUINZENAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">1º dia do mês</label>
                    <input type="number" min={1} max={31} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.diaPagamento ?? ""}
                      onChange={(e) => setFormData({ ...formData, diaPagamento: Number(e.target.value) || undefined })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">2º dia do mês</label>
                    <input type="number" min={1} max={31} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.segundoDiaPagamento ?? ""}
                      onChange={(e) => setFormData({ ...formData, segundoDiaPagamento: Number(e.target.value) || undefined })} />
                  </div>
                </div>
              )}

              {/* SEMESTRAL */}
              {formData.tipoRecorrencia === "SEMESTRAL" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Dia do pagamento (1–31)</label>
                    <input type="number" min={1} max={31} className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.diaPagamento ?? ""}
                      onChange={(e) => setFormData({ ...formData, diaPagamento: Number(e.target.value) || undefined })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mês do pagamento</label>
                    <select className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={formData.mesPagamento ?? ""}
                      onChange={(e) => setFormData({ ...formData, mesPagamento: Number(e.target.value) || undefined })}>
                      <option value="">Selecione...</option>
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"].map((m, i) => (
                        <option key={i + 1} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ANUAL */}
              {formData.tipoRecorrencia === "ANUAL" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data do próximo pagamento</label>
                  <input type="date" className="w-full border rounded-lg p-2.5 text-sm outline-none"
                    value={formData.dataPagamentoAnual ?? ""}
                    onChange={(e) => setFormData({ ...formData, dataPagamentoAnual: e.target.value })} />
                </div>
              )}

              {/* SEMANAL */}
              {formData.tipoRecorrencia === "SEMANAL" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dia da semana</label>
                  <select className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={formData.diaPagamento ?? ""}
                    onChange={(e) => setFormData({ ...formData, diaPagamento: Number(e.target.value) || undefined })}>
                    <option value="">Selecione...</option>
                    {["Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado","Domingo"].map((d, i) => (
                      <option key={i + 1} value={i + 1}>{d}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Categoria</label>
            <input
              type="text"
              list="category-options"
              placeholder="Digite ou selecione uma categoria..."
              className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.category ?? ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <datalist id="category-options">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <p className="text-[10px] text-slate-400 mt-1">
              Será salvo em maiúsculas e sem acentos automaticamente.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Datas... */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Data Início</label>
              <input
                type="date"
                required
                className="w-full border rounded-lg p-2.5 text-sm outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Data Término</label>
              <input
                type="date"
                required
                className="w-full border rounded-lg p-2.5 text-sm outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-200 disabled:opacity-70"
            >
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}