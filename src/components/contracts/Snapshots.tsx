import React from 'react';
import { History, UserPen, DollarSign, CheckCircle2 } from 'lucide-react';
import { ContractHistoryResponse } from '../../types/contracts';

interface ContractSnapshotsProps {
  currentTitle: string;
  currentValue: number;
  snapshots: ContractHistoryResponse[];
}

export const ContractSnapshots: React.FC<ContractSnapshotsProps> = ({ 
  currentTitle, 
  currentValue, 
  snapshots 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="mt-10 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-8 border-b pb-4">
        <History className="text-blue-600" size={24} />
        <div>
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
            Linha do Tempo e Versões
          </h3>
          <p className="text-xs text-slate-500">Histórico de alterações e estados anteriores</p>
        </div>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
          {/* VERSÃO ATUAL (Destaque no topo) */}
          <li>
            <div className="relative pb-8">
              <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-green-200" aria-hidden="true" />
              <div className="relative flex items-start space-x-4">
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 border-2 border-green-500 ring-4 ring-white">
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                </div>
                <div className="min-w-0 flex-1 bg-green-50/50 p-4 rounded-lg border border-green-100">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Versão Atual</span>
                      <span className="text-xs font-medium text-green-600">Ativo</span>
                   </div>
                   <p className="text-sm font-bold text-slate-900 mt-1">{currentTitle}</p>
                   <p className="text-sm text-green-700 font-semibold">{formatCurrency(currentValue)}</p>
                </div>
              </div>
            </div>
          </li>

          {/* SNAPSHOTS (Passado) */}
          {snapshots.map((item, idx) => (
            <li key={item.id}>
              <div className="relative pb-8">
                {idx !== snapshots.length - 1 && (
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                )}
                
                <div className="relative flex items-start space-x-4">
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-slate-300 ring-4 ring-white">
                      <UserPen size={16} className="text-slate-400" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 bg-white p-4 rounded-lg border border-slate-200 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Snapshot da Versão Anterior</p>
                      <time className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.modifiedAt).toLocaleString('pt-BR')}
                      </time>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-700">{item.title}</p>
                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">{item.description}</p>
                    
                    <div className="mt-3 flex justify-between items-center border-t pt-2 border-slate-50">
                      <div className="flex items-center gap-1 text-slate-600">
                        <DollarSign size={12} />
                        <span className="text-xs font-medium">{formatCurrency(item.totalValue)}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Modificado por: <span className="font-medium text-slate-600">{item.modifiedBy}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};