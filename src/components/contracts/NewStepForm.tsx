'use client';

import { useEffect, useState } from 'react';
import { CreateContractStepRequest, EtapaStatus } from '../../types/contracts';
import { getAdmins } from '../../services/users';
import { User } from '../../types/user';

interface NewStepFormProps {
  onSave: (data: CreateContractStepRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NewStepForm({ onSave, onCancel, isLoading }: NewStepFormProps) {
  const today = new Date().toISOString().split('T')[0];
  const [titulo, setTitulo] = useState('');
  const [instrucao, setInstrucao] = useState('');
  const [dataInicio, setDataInicio] = useState(today);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [status, setStatus] = useState<EtapaStatus>('PROGRAMADA');
  const [responsavelIds, setResponsavelIds] = useState<string[]>([]);
  const [aprovadorIds, setAprovadorIds] = useState<string[]>([]);
  const [admins, setAdmins] = useState<User[]>([]);
  const [dateError, setDateError] = useState('');

  useEffect(() => {
    getAdmins().then(setAdmins).catch(() => {});
  }, []);

  const toggleUser = (id: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expectedEndDate && dataInicio && expectedEndDate < dataInicio) {
      setDateError('A previsão de conclusão não pode ser anterior à data de início.');
      return;
    }
    setDateError('');
    const payload: CreateContractStepRequest = {
      titulo,
      instrucao: instrucao.trim() || null,
      dataInicio,
      expectedEndDate,
      status,
      ...(responsavelIds.length > 0 && { responsavelIds }),
      ...(aprovadorIds.length > 0 && { aprovadorIds }),
    };
    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Nova Etapa do Projeto</h2>

        <div className="space-y-4">
          {/* Título */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Título da Etapa</label>
            <input
              required
              className="w-full text-gray-700 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Estudo Preliminar"
            />
          </div>

          {/* Instrução */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Instrução <span className="normal-case font-normal text-slate-400">(opcional)</span></label>
            <textarea
              rows={3}
              className="w-full text-gray-700 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={instrucao}
              onChange={(e) => setInstrucao(e.target.value)}
              placeholder="Orientações para os responsáveis pela etapa..."
            />
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Data Início</label>
              <input
                type="date" required
                className="w-full text-gray-700 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setDateError(''); }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Previsão Fim</label>
              <input
                type="date" required
                className="w-full text-gray-700 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={expectedEndDate}
                onChange={(e) => { setExpectedEndDate(e.target.value); setDateError(''); }}
              />
            </div>
          </div>
          {dateError && <p className="text-xs text-red-600">{dateError}</p>}

          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
            <select
              className="w-full text-gray-700 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value as EtapaStatus)}
            >
              <option value="PROGRAMADA">Programada</option>
              <option value="EM_ANDAMENTO">Em Andamento</option>
              <option value="CONCLUIDA">Concluída</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

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
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="submit" disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition"
          >
            {isLoading ? 'Criando...' : 'Salvar Etapa'}
          </button>
        </div>
      </form>
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
      <label className="text-xs font-semibold text-slate-500 uppercase">{label}</label>
      {users.length === 0 ? (
        <p className="text-xs text-slate-400 mt-1 italic">Carregando usuários...</p>
      ) : (
        <div className="mt-1 border rounded-lg divide-y max-h-36 overflow-y-auto">
          {users.map((u) => {
            const checked = selected.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${checked ? 'bg-blue-50' : ''}`}
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
