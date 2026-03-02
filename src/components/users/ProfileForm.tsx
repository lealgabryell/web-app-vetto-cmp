"use client";

import { useForm } from "react-hook-form";
import { UserResponse, UpdateUserRequest } from "../../types/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../services/users";
import { toast } from "react-hot-toast"; // Opcional para feedback
import { formatCPF, formatPhone, parseRawNumber } from "@/src/utils/formatters";

interface Props {
  user: UserResponse;
}

export default function ProfileForm({ user }: Props) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateUserRequest>({
    defaultValues: {
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone,
      birthDate: user.birthDate,
      address: user.address || undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(user.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar perfil."),
  });

  const onSubmit = (data: UpdateUserRequest) => {
    // Criamos uma cópia limpa dos dados para o backend
    const payload: UpdateUserRequest = {
      ...data,
      cpf: data.cpf ? parseRawNumber(data.cpf) : undefined,
      phone: data.phone ? parseRawNumber(data.phone) : undefined,
      address: data.address
        ? {
            ...data.address,
            zipCode: parseRawNumber(data.address.zipCode),
          }
        : undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <form
      onSubmit={handleSubmit((data) => mutation.mutate(data))}
      className="space-y-6"
    >
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">
          Dados Pessoais
        </h3>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            CPF
          </label>
          <input
            {...register("cpf")}
            onChange={(e) => {
              e.target.value = formatCPF(e.target.value);
            }}
            placeholder="000.000.000-00"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {errors.cpf && (
            <span className="text-red-500 text-xs">{errors.cpf.message}</span>
          )}
        </div>

        {/* Input de Telefone */}
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Telefone
          </label>
          <input
            {...register("phone")}
            onChange={(e) => {
              e.target.value = formatPhone(e.target.value);
            }}
            placeholder="(00) 00000-0000"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nome Completo
            </label>
            <input
              {...register("name")}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Rua
            </label>
            <input
              {...register("address.street")}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Número
            </label>
            <input
              {...register("address.number")}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              CEP
            </label>
            <input
              {...register("address.zipCode")}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cidade
            </label>
            <input
              {...register("address.city")}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Estado (UF)
            </label>
            <input
              {...register("address.state")}
              maxLength={2}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </form>
  );
}
