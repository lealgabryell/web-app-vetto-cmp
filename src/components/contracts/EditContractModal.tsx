import { useState, useEffect } from "react";
import { ContractResponse, ContractStatus, UpdateContractRequest } from "../../types/contracts";

function normalizeCategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contract) {
      setFormData({
        title: contract.title,
        description: contract.description || "",
        totalValue: contract.totalValue,
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
      });
    }
  }, [contract]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        ...formData,
        category: formData.category ? normalizeCategory(formData.category) : undefined,
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

          <div className="grid grid-cols-2 gap-4">
             {/* Valor Total */}
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Valor Total (R$)</label>
                <input
                type="number"
                step="0.01"
                required
                className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.totalValue}
                onChange={(e) => setFormData({ ...formData, totalValue: parseFloat(e.target.value) })}
                />
            </div>

            {/* STATUS (NOVO) */}
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