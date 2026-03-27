"use client";

import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  total: number;
  filtered: number;
}

export function SectionSearchBar({ value, onChange, total, filtered }: Props) {
  return (
    <div className="mb-6 space-y-2">
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome do setor ou por usuário..."
          data-test-id="input-section-search"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm text-sm text-slate-800"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            data-test-id="btn-clear-section-search-inline"
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition"
          >
            <X size={15} />
          </button>
        )}
      </div>
      <div className="flex justify-between items-center px-1">
        <p className="text-xs text-slate-500">
          Mostrando <span className="font-bold text-slate-800">{filtered}</span> de{" "}
          <span className="font-bold text-slate-800">{total}</span> setor(es)
        </p>
        {value && (
          <button
            onClick={() => onChange("")}
            data-test-id="btn-clear-section-search"
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Limpar busca
          </button>
        )}
      </div>
    </div>
  );
}
