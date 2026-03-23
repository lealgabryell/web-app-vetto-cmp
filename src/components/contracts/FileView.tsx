import React from 'react';
import { FileText, ExternalLink, Download } from 'lucide-react';

// 1. DECLARE O SUBCOMPONENTE FORA DO PAI
interface FileIconProps {
  url?: string;
  label: string;
}

const FileIcon: React.FC<FileIconProps> = ({ url, label }) => {
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-1 p-2 rounded-xl hover:border-blue-500 hover:shadow-md transition-all w-50"
    >
      <div className="relative">
        <FileText size={48} className="text-red-500 group-hover:scale-110 transition-transform" />
        <div className="absolute gap-3 -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={10} />
        </div>
      </div>
      <span className="text-xs font-bold text-slate-700 text-center leading-tight">
        {label}
      </span>
      <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <Download size={10} /> Baixar/Ver
      </span>
    </a>
  );
};

// 2. COMPONENTE PRINCIPAL
interface ContractFilesViewProps {
  scannedUrl?: string;
  finalUrl?: string;
}

export const ContractFilesView: React.FC<ContractFilesViewProps> = ({ scannedUrl, finalUrl }) => {
  if (!scannedUrl && !finalUrl) return null;

  return (
    <div className="mt-4">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
        Documentos Disponíveis
      </h4>
      <div className="flex gap-6">
        <FileIcon url={scannedUrl} label="Contrato Digitalizado" />
        <FileIcon url={finalUrl} label="Projeto Final" />
      </div>
    </div>
  );
};