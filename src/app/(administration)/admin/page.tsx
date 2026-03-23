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
  uploadStepPDF,
} from "../../../services/contracts";
import { getAdmins, getUserById, updateUser, patchFinancialDetails } from "../../../services/users";
import { User, FinancialDetailsRequest, AccountType, UpdateUserRequest } from "../../../types/user";
import {
  ContractHistoryResponse,
  ContractResponse,
  ContractStepResponse,
  CreateContractStepRequest,
  EtapaStatus,
  UpdateContractRequest,
  UpdateContractStepRequest,
  UpdatedContractResponse,
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
import Cookie from "js-cookie";
import { decodeJwtPayload } from "@/lib/utils";

export default function AdminDashboard() {
  const [contracts, setContracts] = useState<ContractResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] =
    useState<ContractResponse | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [isNewStepModalOpen, setIsNewStepModalOpen] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<ContractStepResponse[]>([]);
  const [, setLoadingSteps] = useState(false);
  const [stepSearch, setStepSearch] = useState("");
  const [stepStatusFilter, setStepStatusFilter] = useState<"ALL" | EtapaStatus>(
    "ALL",
  );
  const [contractSearch, setContractSearch] = useState("");
  const [contractStatusFilter, setContractStatusFilter] = useState("ALL");
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<ContractStepResponse | null>(null);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [, setHistory] = useState<ContractHistoryResponse[]>([]);
  const [, setLoadingHistory] = useState(false);
  const [isVettoModalOpen, setIsVettoModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [loggedUserId, setLoggedUserId] = useState("");
  const [isLoggedUserDirector, setIsLoggedUserDirector] = useState(false);
  const [clientDetailsUser, setClientDetailsUser] = useState<User | null>(null);
  const [clientDetailsOpen, setClientDetailsOpen] = useState(false);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);
  const [financialEditOpen, setFinancialEditOpen] = useState(false);
  const [financialFormData, setFinancialFormData] = useState<FinancialDetailsRequest>({});
  const [savingFinancial, setSavingFinancial] = useState(false);
  const [canEditFinancial, setCanEditFinancial] = useState(false);

  const canViewContractDetails = (contract: ContractResponse): boolean => {
    if (!loggedUserId) return false;
    const entry = contract.admins?.find((a) => a.adminId === loggedUserId);
    return entry?.canViewDetails ?? false;
  };

  const handleOpenClientDetails = async (clientId: string, contract?: ContractResponse) => {
    setClientDetailsOpen(true);
    setClientDetailsUser(null);
    setLoadingClientDetails(true);
    setFinancialEditOpen(false);
    setFinancialFormData({});
    // Permissão: diretor ou LEADER do contrato de origem
    const isLeader = contract ? canViewContractDetails(contract) : false;
    setCanEditFinancial(isLoggedUserDirector || isLeader);
    try {
      const user = await getUserById(clientId);
      setClientDetailsUser(user);
      setFinancialFormData(user.financialDetails ?? {});
    } catch {
      toast.error("Erro ao carregar dados do cliente.");
      setClientDetailsOpen(false);
    } finally {
      setLoadingClientDetails(false);
    }
  };

  const handleSaveFinancialDetails = async () => {
    if (!clientDetailsUser) return;
    setSavingFinancial(true);
    try {
      let updatedUser: User;
      if (clientDetailsUser.financialDetails?.id) {
        // Edição: PATCH no registro existente — não cria nova instância
        const patchedDetails = await patchFinancialDetails(
          clientDetailsUser.financialDetails.id,
          financialFormData,
        );
        updatedUser = { ...clientDetailsUser, financialDetails: patchedDetails };
      } else {
        // Criação: PUT no usuário passando financialDetails para o backend criar
        const req: UpdateUserRequest = {
          name: clientDetailsUser.name,
          cpf: clientDetailsUser.cpf,
          birthDate: clientDetailsUser.birthdate,
          email: clientDetailsUser.email,
          phone: clientDetailsUser.phone,
          address: clientDetailsUser.address,
          director: clientDetailsUser.director,
          financialDetails: financialFormData,
        };
        updatedUser = await updateUser(clientDetailsUser.id, req);
      }
      setClientDetailsUser(updatedUser);
      setFinancialFormData(updatedUser.financialDetails ?? {});
      setFinancialEditOpen(false);
      toast.success("Dados financeiros atualizados com sucesso!");
    } catch {
      toast.error("Erro ao salvar dados financeiros.");
    } finally {
      setSavingFinancial(false);
    }
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  useEffect(() => {
    const token = Cookie.get("user_token") ?? "";
    const payload = decodeJwtPayload(token);
    const jwtIdentifier = (payload.id ?? payload.sub ?? "") as string;

    async function loadData() {
      try {
        const [data, admins] = await Promise.all([getContracts(), getAdmins()]);
        setContracts(data);
        // Resolve o UUID real cruzando por id ou e-mail no cadastro de admins
        const loggedAdmin = admins.find(
          (u) => u.id === jwtIdentifier || u.email === jwtIdentifier,
        );
        setLoggedUserId(loggedAdmin?.id ?? jwtIdentifier);
        setIsLoggedUserDirector(loggedAdmin?.director ?? false);
      } catch (e: unknown) {
        toast.error("Erro ao carregar contratos: Faça login novamente!");
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

  useEffect(() => {
    const anyOpen =
      !!selectedContract ||
      isNewContractModalOpen ||
      isEditContractModalOpen ||
      isVettoModalOpen ||
      clientDetailsOpen ||
      !!editingStep;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedContract, isNewContractModalOpen, isEditContractModalOpen, isVettoModalOpen, clientDetailsOpen, editingStep]);

  const filteredSteps = currentSteps.filter((etapa) => {
    const matchesSearch = etapa.titulo
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
              etapas: contract.steps?.map((etapa) =>
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
          etapas: prevSelected.steps?.map((etapa) =>
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
      const newStep = await createStep(selectedContract.id, stepData);

      toast.success("Etapa adicionada!");

      const updatedEtapas = [...(currentSteps || []), newStep];
      setCurrentSteps(updatedEtapas);

      const updatedContract = { ...selectedContract, etapas: updatedEtapas };
      setSelectedContract(updatedContract);
      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c)),
      );

      setIsNewStepModalOpen(false);
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

  const handleSaveEditedStep = async (payload: UpdateContractStepRequest) => {
    if (!selectedContract || !editingStep) return;

    try {
      const result = await updateStepData(
        selectedContract.id,
        editingStep.id,
        payload,
      );

      toast.success("Etapa atualizada com sucesso!");

      const newStepsList = currentSteps.map((s) =>
        s.id === editingStep.id ? result : s,
      );
      setCurrentSteps(newStepsList);
      setEditingStep(null);

      const updatedContract = { ...selectedContract, etapas: newStepsList };
      setSelectedContract(updatedContract);
      setContracts((prev) =>
        prev.map((c) => (c.id === selectedContract.id ? updatedContract : c)),
      );
    } catch (error: unknown) {
      toast.error("Erro ao atualizar etapa");
      throw error;
    }
  };

  const handleStepPdfUpload = async (stepId: string, file: File) => {
    if (!selectedContract) return;
    try {
      const url = await uploadStepPDF(selectedContract.id, stepId, file);
      toast.success("PDF anexado à etapa com sucesso!");
      setCurrentSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, pdfUrls: [...(s.pdfUrls ?? []), url] } : s,
        ),
      );
    } catch (error: unknown) {
      toast.error("Erro ao anexar PDF");
    }
  };

  const handleEditContract = async (data: UpdateContractRequest) => {
    if (!selectedContract) return;

    try {
      // 1. Chama a API
      const updatedData: UpdatedContractResponse = await updateContract(selectedContract.id, data);

      toast.success(updatedData.message ?? "Contrato atualizado com sucesso!");

      // 2. Reconstrói o contrato completo: base existente + campos do request + campos da resposta
      const newSelectedContract: ContractResponse = {
        ...selectedContract,
        // Campos vindos do request (o que o usuário editou)
        title: data.title,
        description: data.description,
        totalValue: data.totalValue,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
        category: data.category,
        scannedContractUrl: data.scannedContractUrl,
        finalProjectUrl: data.finalProjectUrl,
        aiRiskScore: data.aiRiskScore,
        aiAnalysisSummary: data.aiAnalysisSummary,
        autoExtracted: data.autoExtracted ?? selectedContract.autoExtracted,
        keyClauses: data.keyClauses,
        // Sobrescreve com o que o servidor confirmou (source of truth)
        id: updatedData.id,
      };

      setSelectedContract(newSelectedContract);

      // 3. Atualiza a Lista Geral de Contratos
      setContracts((prev) =>
        prev.map((c) =>
          c.id === selectedContract.id ? newSelectedContract : c,
        ),
      );

      setIsEditContractModalOpen(false);
    } catch (error: unknown) {
      toast.error("Erro ao atualizar contrato");
      throw error;
    }
  };

  const handleContractUpdate = (updatedContract: ContractResponse) => {
    setSelectedContract(updatedContract);

    setContracts((prevContracts) =>
      prevContracts.map((c) =>
        c.id === updatedContract.id ? updatedContract : c,
      ),
    );
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

  const contractsByCategory = filteredContracts.reduce<
    Record<string, ContractResponse[]>
  >((acc, contract) => {
    const cat = contract.category ?? "Sem categoria";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(contract);
    return acc;
  }, {});

  const categoryEntries = Object.entries(contractsByCategory);

  const loadSteps = async (contractId: string) => {
    setLoadingSteps(true);
    try {
      const data = await getContractSteps(contractId);
      setCurrentSteps(data);
    } catch (error: unknown) {
      toast.error("Erro ao carregar etapas do banco");
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
      toast.error("Erro ao carregar histórico");
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
          className="bg-blue-600 hover:bg-blue-700 text-white font-normal py-1.5 px-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
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
              placeholder="Buscar por contrato ou cliente..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {categoryEntries.length > 0 ? (
          categoryEntries.map(([category, categoryContracts]) => (
            <div
              key={category}
              className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col min-w-0 transition-all ${
                collapsedCategories.has(category)
                  ? "bg-slate-50 border-slate-200"
                  : "bg-white border-slate-200"
              }`}
            >
              {/* Cabeçalho do bloco */}
              <button
                onClick={() => toggleCategory(category)}
                className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-3 h-3 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                      collapsedCategories.has(category) ? "-rotate-90" : "rotate-0"
                    }`}
                  >
                    <path d="m19 9-7 7-7-7" />
                  </svg>
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest truncate">
                    {category}
                  </h2>
                </div>
                <span className="ml-2 flex-shrink-0 text-[10px] font-semibold bg-slate-200 text-slate-500 rounded-full px-2 py-0.5">
                  {categoryContracts.length}
                </span>
              </button>

              {/* Lista compacta */}
              {!collapsedCategories.has(category) && (
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[420px]">
                {categoryContracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    className="w-full text-left px-4 py-3 transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      {/* Lado esquerdo: título + cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate leading-snug">
                            {contract.title}
                          </p>
                          {(() => {
                            const daysLeft = Math.ceil(
                              (new Date(contract.endDate).getTime() - Date.now()) /
                                (1000 * 60 * 60 * 24),
                            );
                            return daysLeft <= 45 && daysLeft >= 0 ? (
                              <span className="flex-shrink-0 text-[9px] font-bold bg-red-100 text-red-600 border border-red-300 rounded px-1 py-0.5 leading-none">
                                🚩 {daysLeft}d
                              </span>
                            ) : null;
                          })()}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenClientDetails(contract.clientId, contract);
                          }}
                          className="text-[11px] text-blue-500 hover:text-blue-700 hover:underline truncate mt-0.5 block text-left"
                        >
                          {contract.clientName}
                        </button>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(contract.startDate).toLocaleDateString("pt-BR")}
                          {" → "}
                          {new Date(contract.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      {/* Lado direito: badge status + valor */}
                      <div className="flex-shrink-0 flex flex-col items-end gap-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${statusConfig[contract.status].color}`}
                        >
                          {statusConfig[contract.status].label}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(contract.totalValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 text-center">
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
                canViewContractDetails(selectedContract) ? (
                  /* CONTEÚDO COMPLETO: LEADER / DIRETOR */
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
                        <p className="text-xs text-slate-400 mb-1">Cliente</p>
                        <button
                          type="button"
                          onClick={() => handleOpenClientDetails(selectedContract.clientId, selectedContract)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm text-left block"
                        >
                          {selectedContract.clientName}
                        </button>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {selectedContract.clientEmail}
                        </p>
                      </div>
                    </div>
                    <ContractFilesView
                      scannedUrl={selectedContract.scannedContractUrl}
                      finalUrl={selectedContract.finalProjectUrl}
                    />
                    <div className="border-t pt-6">
                      <ContractFileUpload
                        contractId={selectedContract.id}
                        onUploadSuccess={handleContractUpdate}
                      />
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
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-6 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
                      >
                        Cancelar Contrato
                      </button>
                    </div>

                    {/* Confirmação de cancelamento */}
                    {showCancelConfirm && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-3">
                        <p className="text-sm font-semibold text-red-700">
                          Tem certeza que deseja cancelar esse contrato?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => { await handleCancel(); setShowCancelConfirm(false); }}
                            className="flex-1 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                          >
                            Sim, cancelar
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 py-2 text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          >
                            Não, voltar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* VISÃO RESUMIDA: MEMBER */
                  <div className="flex flex-col gap-3">
                    <span className="self-start text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Acesso de visualização
                    </span>
                    <h2 className="text-2xl text-blue-600 font-bold">
                      {selectedContract.title}
                    </h2>
                    <p className="text-slate-600">
                      {selectedContract.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Status</p>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[selectedContract.status].color}`}
                        >
                          {statusConfig[selectedContract.status].label}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Cliente</p>
                        <button
                          type="button"
                          onClick={() => handleOpenClientDetails(selectedContract.clientId, selectedContract)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-sm text-left block"
                        >
                          {selectedContract.clientName}
                        </button>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Período</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(selectedContract.startDate).toLocaleDateString("pt-BR")}
                          {" → "}
                          {new Date(selectedContract.endDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Valor Total</p>
                        <p className="text-sm font-bold text-slate-800">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(selectedContract.totalValue)}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic mt-2">
                      Você possui acesso de visualização a este contrato. Para gerenciar etapas e arquivos, solicite acesso de liderança ao responsável pelo setor.
                    </p>
                  </div>
                )
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
                          onUploadPdf={(file) => handleStepPdfUpload(etapa.id, file)}
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
                  setShowCancelConfirm(false);
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
          existingCategories={[
            ...new Set(
              contracts
                .map((c) => c.category)
                .filter((c): c is string => !!c),
            ),
          ]}
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
          existingCategories={[
            ...new Set(
              contracts
                .map((c) => c.category)
                .filter((cat): cat is string => !!cat),
            ),
          ]}
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

      {/* Mini-modal de dados financeiros do cliente */}
      {clientDetailsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Dados Financeiros
                </p>
                <h3 className="font-bold text-slate-800">
                  {clientDetailsUser?.name ?? "Carregando..."}
                </h3>
              </div>
              <button
                onClick={() => {
                  setClientDetailsOpen(false);
                  setClientDetailsUser(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>
            {loadingClientDetails ? (
              <p className="text-sm text-slate-400 text-center py-6">Carregando...</p>
            ) : (
              <>
                {clientDetailsUser?.financialDetails ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Banco</p>
                        <p className="font-medium text-slate-700">
                          {clientDetailsUser.financialDetails.bankName}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Tipo</p>
                        <p className="font-medium text-slate-700">
                          {clientDetailsUser.financialDetails.accountType}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Agência</p>
                        <p className="font-mono font-medium text-slate-700">
                          {clientDetailsUser.financialDetails.agency}
                          {clientDetailsUser.financialDetails.agencyDigit
                            ? `-${clientDetailsUser.financialDetails.agencyDigit}`
                            : ""}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Conta</p>
                        <p className="font-mono font-medium text-slate-700">
                          {clientDetailsUser.financialDetails.accountNumber}-
                          {clientDetailsUser.financialDetails.accountVerificationDigit}
                        </p>
                      </div>
                    </div>
                    {clientDetailsUser.financialDetails.pixKey && (
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">
                          Chave PIX
                        </p>
                        <p className="font-mono text-sm text-slate-700 break-all">
                          {clientDetailsUser.financialDetails.pixKey}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Nenhum dado financeiro cadastrado.</p>
                  </div>
                )}

                {!financialEditOpen && canEditFinancial && (
                  <button
                    type="button"
                    onClick={() => setFinancialEditOpen(true)}
                    className="mt-4 w-full py-2 text-xs font-semibold border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    {clientDetailsUser?.financialDetails ? "✏️ Editar dados financeiros" : "➕ Adicionar dados financeiros"}
                  </button>
                )}

                {financialEditOpen && (
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-3">
                      {clientDetailsUser?.financialDetails ? "Editar dados financeiros" : "Adicionar dados financeiros"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Cód. Banco"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.bankCode ?? ""}
                        maxLength={4}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, bankCode: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      />
                      <input
                        placeholder="Nome do Banco"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.bankName ?? ""}
                        maxLength={60}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, bankName: e.target.value.replace(/[<>"'`]/g, "").slice(0, 60) }))}
                      />
                      <input
                        placeholder="Agência"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.agency ?? ""}
                        maxLength={5}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, agency: e.target.value.replace(/\D/g, "").slice(0, 5) }))}
                      />
                      <input
                        placeholder="Dígito Agência"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.agencyDigit ?? ""}
                        maxLength={1}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, agencyDigit: e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 1) }))}
                      />
                      <input
                        placeholder="Nº da Conta"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.accountNumber ?? ""}
                        maxLength={9}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, accountNumber: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
                      />
                      <input
                        placeholder="Dígito Conta"
                        className="p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.accountVerificationDigit ?? ""}
                        maxLength={1}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, accountVerificationDigit: e.target.value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 1) }))}
                      />
                      <select
                        className="col-span-2 p-2 text-xs border rounded bg-white text-zinc-700"
                        value={financialFormData.accountType ?? ""}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, accountType: e.target.value as AccountType }))}
                      >
                        <option value="">Tipo de conta</option>
                        <option value="CORRENTE">Corrente</option>
                        <option value="POUPANCA">Poupança</option>
                        <option value="SALARIO">Salário</option>
                        <option value="PAGAMENTO">Pagamento</option>
                      </select>
                      <input
                        placeholder="Titular"
                        className="col-span-2 p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.ownerName ?? ""}
                        maxLength={100}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, ownerName: e.target.value.replace(/[<>"'`]/g, "").slice(0, 100) }))}
                      />
                      <input
                        placeholder="CPF / CNPJ do Titular"
                        className="col-span-2 p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.ownerDocument ?? ""}
                        maxLength={14}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, ownerDocument: e.target.value.replace(/\D/g, "").slice(0, 14) }))}
                      />
                      <input
                        placeholder="Chave PIX"
                        className="col-span-2 p-2 text-xs border rounded text-zinc-700"
                        value={financialFormData.pixKey ?? ""}
                        maxLength={77}
                        onChange={(e) => setFinancialFormData((p) => ({ ...p, pixKey: e.target.value.replace(/[<>"'`]/g, "").slice(0, 77) }))}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleSaveFinancialDetails}
                        disabled={savingFinancial}
                        className="flex-1 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition"
                      >
                        {savingFinancial ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinancialEditOpen(false)}
                        className="px-4 py-2 text-xs font-bold border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div> // Fim da div principal
  );
}
