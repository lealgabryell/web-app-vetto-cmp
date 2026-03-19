'use client';

import { useState } from 'react';
import { CreateContractStepRequest } from '../../types/contracts';

interface NewStepFormProps {
  onSave: (data: CreateContractStepRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function NewStepForm({ onSave, onCancel, isLoading }: NewStepFormProps) {
  const [formData, setFormData] = useState<CreateContractStepRequest>({
    title: '',
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: '',
    status: 'PROGRAMADA',
    responsible: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-70 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Nova Etapa do Projeto</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Título da Etapa</label>
            <input 
              required
              className="w-full text-gray-500 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Estudo Preliminar"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Data Início</label>
              <input 
                type="date" required
                className="w-full text-gray-500 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Previsão</label>
              <input 
                type="date" required
                className="w-full text-gray-500 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.expectedEndDate}
                onChange={e => setFormData({...formData, expectedEndDate: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase">Responsável</label>
            <input 
              required
              className="w-full text-gray-500 mt-1 p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.responsible}
              onChange={e => setFormData({...formData, responsible: e.target.value})}
              placeholder="Nome do responsável"
            />
          </div>
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