import React, { useState } from 'react';
import { FileUp, FileCheck, Loader2 } from 'lucide-react';
import { uploadContractPDF } from '../../services/contracts';
import { toast } from 'react-hot-toast'; // Opcional, para feedback
import { ContractResponse } from '@/src/types/contracts';

interface UploadSectionProps {
  contractId: string;
  onUploadSuccess: (response: ContractResponse) => void; 
}

export const ContractFileUpload: React.FC<UploadSectionProps> = ({ contractId, onUploadSuccess }) => {
  const [loading, setLoading] = useState<'SCANNED' | 'FINAL' | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'SCANNED' | 'FINAL') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Apenas arquivos PDF são permitidos');
      return;
    }

    try {
      setLoading(type);
      const response = await uploadContractPDF(contractId, file, type);
      toast.success(`${type === 'SCANNED' ? 'Contrato' : 'Projeto Final'} enviado com sucesso!`);
      if (onUploadSuccess) {
      onUploadSuccess(response); 
    }
    } catch (error) {
      toast.error('Erro ao fazer upload do arquivo: ' + error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col bg-white ">
      <h3 className="text-lg font-semibold text-slate-800">Documentação do Contrato</h3>
      
      <div className="grid grid-cols-1 gap-3">
        {/* Botão 1: Contrato Escaneado */}
        <div className="relative">
          <input
            type="file"
            id="scanned-upload"
            className="hidden"
            accept=".pdf"
            onChange={(e) => handleUpload(e, 'SCANNED')}
            disabled={!!loading}
          />
          <label
            htmlFor="scanned-upload"
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-md border-2 border-dashed cursor-pointer transition-all
              ${loading === 'SCANNED' ? 'bg-slate-50 border-slate-300' : 'border-blue-200 hover:border-blue-500 hover:bg-blue-50'}`}
          >
            {loading === 'SCANNED' ? <Loader2 className="animate-spin" /> : <FileUp size={20} />}
            <span className="font-medium text-slate-700">Upload Contrato Para Análise do Vetto</span>
          </label>
        </div>
      </div>
    </div>
  );
};