"use client";

import { useEffect, useState } from "react";
import {
  cancelContract,
  createStep,
  getContractHistory,
  getContracts,
  getContractSteps,
  updateContract,
  updateStepData,
  updateStepStatus,
} from "../../../services/contracts";
import {
  ContractHistoryResponse,
  ContractResponse,
  ContractStep,
  CreateContractStepRequest,
  EtapaStatus,
  UpdateContractRequest,
} from "../../../types/contracts";
import toast from "react-hot-toast";
import ContractCard from "@/src/components/contracts/ContractCard";
import StepItem from "@/src/components/contracts/StepItem";
import NewStepForm from "@/src/components/contracts/NewStepForm";
import NewContractModal from "@/src/components/contracts/NewContractModal";
import EditStepModal from "@/src/components/contracts/EditStepModal";
import EditContractModal from "@/src/components/contracts/EditContractModal";
import { ContractFileUpload } from "@/src/components/contracts/FileUpload";
import { ContractFilesView } from "@/src/components/contracts/FileView";
import VettoTrigger from "@/src/components/contracts/VettoTrigger";
import { VettoAnalysisModal } from "@/src/components/contracts/VettoModal";

export default function AdminDashboard() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<ContractResponse | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isNewStepModalOpen, setIsNewStepModalOpen] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ContractStep[]>([]);
  const [, setLoadingSteps] = useState(false);
  const [stepSearch, setStepSearch] = useState("");
  const [stepStatusFilter, setStepStatusFilter] = useState<"ALL" | EtapaStatus>(
    "ALL",
  );
  const [contractSearch, setContractSearch] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ContractStep | null>(null);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [, setHistory] = useState<ContractHistoryResponse[]>([]);
  const [, setLoadingHistory] = useState(false);
  const [isVettoModalOpen, setIsVettoModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getContracts();
        setContracts(data);
      } catch (e: unknown) {
        toast.error("Erro ao carregar contratos: " + e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      loadHistory(selectedContract.id);
    } else {
      setHistory([]); // Limpa ao fechar
    }
  }, [selectedContract]);

  const filteredSteps = currentSteps.filter((etapa) => {
    const matchesSearch = etapa.title
      .toLowerCase()
      .includes(stepSearch.toLowerCase());
    const matchesStatus =
      stepStatusFilter === "ALL" || etapa.status === stepStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCancel = async () => {
    if (!selectedContract) return;

    try {
      await cancelContract(selectedContract.id);
      toast.success("Contrato cancelado com sucesso");

      // 1. Atualiza na lista geral para mudar a cor do card
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id ? { ...c, status: "CANCELED" } : c,
        ),
      );

      // 2. Atualiza o contrato selecionado para o modal refletir a mudança na hora
      setSelectedContract((prev) =>
        prev ? { ...prev, status: "CANCELED" } : null,
      );
    } catch (error: unknown) {
      toast.error("Erro ao cancelar contrato: " + error);
    }
  };

  const handleUpdateStep = async (
    contractId: string,
    stepId: string,
    newStatus: EtapaStatus,
  ) => {
    try {
      // 1. Chamada para a API (Service que criamos anteriormente)
      await updateStepStatus(contractId, stepId, newStatus);

      toast.success("Status da etapa atualizado!");

      setCurrentSteps((prev) =>
        prev.map((etapa) =>
          etapa.id === stepId ? { ...etapa, status: newStatus } : etapa,
        ),
      );

      // 2. Atualização Otimista: Atualiza o estado 'contracts' localmente
      setContracts((prevContracts) =>
        prevContracts.map((contract) => {
          if (contract.id === contractId) {
            return {
              ...contract,
              etapas: contract.etapas?.map((etapa) =>
                etapa.id === stepId ? { ...etapa, status: newStatus } : etapa,
              ),
            };
          }
          return contract;
        }),
      );

      // 3. Importante: Se houver um 'selectedContract' aberto no modal, atualize-o também
      setSelectedContract((prevSelected) => {
        if (!prevSelected || prevSelected.id !== contractId)
          return prevSelected;
        return {
          ...prevSelected,
          etapas: prevSelected.etapas?.map((etapa) =>
            etapa.id === stepId ? { ...etapa, status: newStatus } : etapa,
          ),
        };
      });
    } catch (error) {
      console.error(error);
      toast.error("Falha ao atualizar o status da etapa.");
    }
  };

  const handleCreateStep = async (stepData: CreateContractStepRequest) => {
    if (!selectedContract) return;

    try {
      setLoading(true);
      // Chamada para a API: POST /api/contracts/{id}/steps
      const newStep = await createStep(selectedContract.id, stepData);

      toast.success("Etapa adicionada!");

      // Atualiza os estados locais para refletir a nova etapa sem refresh
      const updatedEtapas = [...(currentSteps || []), newStep];

      setCurrentSteps(updatedEtapas);

      const updatedContract = { ...selectedContract, etapas: updatedEtapas };

      setSelectedContract(updatedContract);
      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c)),
      );

      setIsNewStepModalOpen(false); // Fecha o modal de formulário
    } catch (error: unknown) {
      toast.error("Erro ao criar etapa: " + error);
    } finally {
      setLoading(false);
    }
  };

  const handleContractCreated = async () => {
    // Recarregamos os contratos do banco para garantir a sincronia
    try {
      const data = await getContracts();
      setContracts(data);
      setIsNewContractModalOpen(false);
      toast.success("Lista de contratos atualizada!");
    } catch (e: unknown) {
      toast.error("Erro ao atualizar lista: " + e);
    }
  };

  const handleSaveEditedStep = async (updatedStep: ContractStep) => {
    if (!selectedContract) return;

    try {
      // 1. Chama API
      const result = await updateStepData(
        selectedContract.id,
        updatedStep.id,
        updatedStep,
      );

      console.log("Resultado da atualização da etapa:", result);
      toast.success("Etapa atualizada com sucesso!");

      const newStepsList = currentSteps.map((s) =>
        s.id === updatedStep.id ? updatedStep : s,
      );
      setCurrentSteps(newStepsList);

      // 3. Atualiza o objeto de Contrato Global
      const updatedContract = { ...selectedContract, etapas: newStepsList };
      setSelectedContract(updatedContract);

      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c)),
      );
    } catch (error: unknown) {
      toast.error("Erro ao atualizar etapa: " + error);
      throw error; // Relança para o modal saber que deu erro e não fechar se quiser tratar
    }
  };

  const handleEditContract = async (data: UpdateContractRequest) => {
    if (!selectedContract) return;

    try {
      // 1. Chama a API
      const updatedData = await updateContract(selectedContract.id, data);

      toast.success("Contrato atualizado com sucesso!");

      // 2. Atualiza o Contrato Selecionado (mantendo as etapas que já existiam na tela)
      // O endpoint de update retorna o contrato, mas sem as etapas (Lazy), então preservamos as locais
      const newSelectedContract = {
        ...selectedContract,
        ...updatedData,
        etapas: selectedContract.etapas, // Mantém as etapas atuais visíveis
      };

      setSelectedContract(newSelectedContract);

      // 3. Atualiza a Lista Geral de Contratos
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id ? { ...c, ...updatedData } : c,
        ),
      );

      setIsEditContractModalOpen(false);
    } catch (error: unknown) {
      toast.error("Erro ao atualizar contrato: " + error);
      throw error;
    }
  };

  const filteredContracts = contracts.filter((contract) => {
    const searchTerm = contractSearch.toLowerCase();
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm) ||
      contract.clientName.toLowerCase().includes(searchTerm);

    const matchesStatus =
      contractStatusFilter === "ALL" ||
      contract.status === contractStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const loadSteps = async (contractId: string) => {
    setLoadingSteps(true);
    try {
      const data = await getContractSteps(contractId);
      setCurrentSteps(data);
    } catch (error: unknown) {
      toast.error("Erro ao carregar etapas do banco: " + error);
    } finally {
      setLoadingSteps(false);
    }
  };

  const loadHistory = async (contractId: string) => {
    setLoadingHistory(true);
    try {
      const data = await getContractHistory(contractId);
      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const statusConfig = {
    // Status do Contrato
    DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-600" },
    ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-700" },
    SUSPENDED: { label: "Suspenso", color: "bg-yellow-100 text-yellow-700" },
    FINISHED: { label: "Finalizado", color: "bg-blue-100 text-blue-700" },
    CANCELED: { label: "Cancelado", color: "bg-red-100 text-red-700" },

    // Status das Etapas
    PROGRAMADA: {
      label: "Programada",
      color: "border-l-4 border-gray-300 bg-gray-50",
    },
    EM_ANDAMENTO: {
      label: "Em Andamento",
      color: "border-l-4 border-blue-500 bg-blue-50",
    },
    CONCLUIDA: {
      label: "Concluída",
      color: "border-l-4 border-green-500 bg-green-50",
    },
    CANCELADA: {
      label: "Cancelada",
      color: "border-l-4 border-red-500 bg-red-50",
    },
  };

  if (loading)
    return (
      <div className="text-black p-10 text-center">Carregando contratos...</div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Dashboard de Contratos
          </h1>
          <p className="text-sm text-slate-500 text-shadow-black">
            Gestão de projetos e clientes
          </p>
        </div>
        <button
          onClick={() => setIsNewContractModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-normal py-2 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
        >
          <span className="text-xl">+</span> Novo Contrato
        </button>
      </header>
      {/*      FILTROS E BUSCA */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Campo de Busca Principal */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="text-slate-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Buscar por projeto ou cliente..."
              className="w-full text-black pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white shadow-sm text-sm"
              value={contractSearch}
              onChange={(e) => setContractSearch(e.target.value)}
            />
          </div>

          {/* Filtro por Status */}
          <select
            className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm text-sm font-medium text-slate-700 cursor-pointer"
            value={contractStatusFilter}
            onChange={(e) => setContractStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="DRAFT">Rascunhos</option>
            <option value="SUSPENDED">Suspensos</option>
            <option value="FINISHED">Finalizados</option>
            <option value="CANCELED">Cancelados</option>
          </select>
        </div>

        {/* Contador de Resultados */}
        <div className="flex justify-between items-center px-1">
          <p className="text-xs text-slate-500 font-medium">
            Mostrando{" "}
            <span className="text-slate-900 font-bold">
              {filteredContracts.length}
            </span>{" "}
            contrato(s)
          </p>
          {(contractSearch || contractStatusFilter !== "ALL") && (
            <button
              onClick={() => {
                setContractSearch("");
                setContractStatusFilter("ALL");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredContracts.length > 0 ? (
          filteredContracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onViewDetails={(c) => setSelectedContract(c)}
            />
          ))
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 text-center">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-slate-900 font-bold">
              Nenhum contrato encontrado
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Tente ajustar os termos da busca ou mudar o filtro de status.
            </p>
          </div>
        )}
        {selectedContract && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 relative">
              {!showSteps ? (
                /* CONTEÚDO: DETALHES DO CONTRATO */
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl text-blue-600 font-bold mb-4">
                    {selectedContract.title}
                  </h2>

                  <div className="flex items-center gap-4 ml-4">
                    <VettoTrigger
                      contract={selectedContract}
                      onClick={() => setIsVettoModalOpen(true)}
                    />

                    <button
                      onClick={() => setIsEditContractModalOpen(true)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar informações do contrato"
                    >
                      {/* Ícone Lápis Maior */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                        />
                      </svg>
                    </button>
                  </div>
                  <p className="text-slate-600 mb-6">
                    {selectedContract.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[selectedContract.status].color}`}
                      >
                        {statusConfig[selectedContract.status].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email Cliente</p>
                      <p className="font-bold text-blue-700">
                        {selectedContract.clientEmail}
                      </p>
                    </div>
                  </div>
                  <ContractFilesView
                    scannedUrl={selectedContract.scannedContractUrl}
                    finalUrl={selectedContract.finalProjectUrl}
                  />
                  <div className="border-t pt-6">
                    <ContractFileUpload contractId={selectedContract.id} />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setShowSteps(true);
                        loadSteps(selectedContract.id);
                      }}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700"
                    >
                      Gerenciar Etapas
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      Cancelar Contrato
                    </button>
                  </div>
                </div>
              ) : (
                /* CONTEÚDO: GERENCIAR ETAPAS */
                <div>
                  <button
                    onClick={() => setShowSteps(false)}
                    className="text-blue-600 text-sm mb-4"
                  >
                    ← Voltar aos detalhes
                  </button>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-blue-600 font-bold">
                      Gerenciar Etapas
                    </h2>
                    <button
                      onClick={() => setIsNewStepModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                    >
                      + Nova Etapa
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {/* Busca por Texto */}
                    <div className="flex-1 relative text-shadow-black">
                      <input
                        type="text"
                        placeholder="Filtrar por título da etapa..."
                        className="w-full text-black pl-3 pr-3 py-2 text-xs border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={stepSearch}
                        onChange={(e) => setStepSearch(e.target.value)}
                      />
                    </div>

                    {/* Filtro por Status */}
                    <select
                      className="text-xs p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-600"
                      value={stepStatusFilter}
                      onChange={(e) =>
                        setStepStatusFilter(e.target.value as EtapaStatus)
                      }
                    >
                      <option value="ALL">Todos os Status</option>
                      <option value="PROGRAMADA">Programada</option>
                      <option value="EM_ANDAMENTO">Em Andamento</option>
                      <option value="CONCLUIDA">Concluída</option>
                      <option value="CANCELADA">Cancelada</option>
                    </select>
                  </div>

                  {/* Lista de StepItems aqui... */}

                  {/* Modal do Formulário (Renderização Condicional) */}
                  {isNewStepModalOpen && (
                    <NewStepForm
                      onSave={handleCreateStep}
                      onCancel={() => setIsNewStepModalOpen(false)}
                      isLoading={loading}
                    />
                  )}
                  <h2 className="text-xl text-blue-600 font-bold mb-6">
                    Etapas: {selectedContract.title}
                  </h2>

                  {/* Loop das etapas com seletor de status */}
                  {/* Container da Lista de Etapas */}
                  <div className="mt-2 space-y-3 text-black pr-2 max-h-100 overflow-y-auto scrollbar-thin">
                    {filteredSteps.length > 0 ? (
                      filteredSteps.map((etapa) => (
                        <StepItem
                          key={etapa.id}
                          etapa={etapa}
                          isAdmin={true}
                          onStatusChange={(newStatus) =>
                            handleUpdateStep(
                              selectedContract.id,
                              etapa.id,
                              newStatus,
                            )
                          }
                          onEdit={(step) => setEditingStep(step)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-slate-400 text-sm italic">
                          {stepSearch || stepStatusFilter !== "ALL"
                            ? "Nenhuma etapa corresponde aos filtros."
                            : "Este contrato ainda não possui etapas."}
                        </p>
                        {(stepSearch || stepStatusFilter !== "ALL") && (
                          <button
                            onClick={() => {
                              setStepSearch("");
                              setStepStatusFilter("ALL");
                            }}
                            className="text-blue-600 text-xs mt-2 underline"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setSelectedContract(null);
                  setShowSteps(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Modal de Novo Contrato */}
      {isNewContractModalOpen && (
        <NewContractModal
          onClose={() => setIsNewContractModalOpen(false)}
          onSave={handleContractCreated}
        />
      )}
      {/* Modal de Edição de Etapa */}
      {editingStep && (
        <EditStepModal
          isOpen={!!editingStep}
          step={editingStep}
          onClose={() => setEditingStep(null)}
          onSave={handleSaveEditedStep}
        />
      )}
      {/* Modal de Edição de Contrato */}
      {isEditContractModalOpen && selectedContract && (
        <EditContractModal
          isOpen={isEditContractModalOpen}
          contract={selectedContract}
          onClose={() => setIsEditContractModalOpen(false)}
          onSave={handleEditContract}
        />
      )}
      {/* Modal de Análise do Vetto */}
      {isVettoModalOpen && selectedContract && (
        <div className="relative z-100">
          <VettoAnalysisModal
            contract={selectedContract}
            isOpen={isVettoModalOpen}
            onClose={() => setIsVettoModalOpen(false)}
          />
        </div>
      )}
    </div> // Fim da div principal
  );
}
