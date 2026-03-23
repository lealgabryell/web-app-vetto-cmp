"use client";

import React, { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";
import { format, isSameDay, parseISO } from "date-fns";
import "react-day-picker/dist/style.css";

// Supondo que você receba os dados via props ou fetch aqui
import { MeetingResponse } from "../../types/scheduling";
import { Icon } from "lucide-react";

interface Props {
  meetings: MeetingResponse[];
  role: "ADMIN" | "CLIENT";
}

export default function ScheduleDashboard({ meetings, role }: Props) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date());

  // Filtra reuniões do dia selecionado para mostrar na lista lateral
  const selectedDayMeetings = meetings.filter(
    (m) => selectedDay && isSameDay(parseISO(m.startTime), selectedDay),
  );

  // Mapeamento de modificadores para o CSS
  const modifiers = useMemo(
    () => ({
      available: (date: Date) =>
        meetings.filter((m) => isSameDay(parseISO(m.startTime), date))
          .length === 0,
      busy: (date: Date) => {
        const count = meetings.filter((m) =>
          isSameDay(parseISO(m.startTime), date),
        ).length;
        return count >= 1 && count <= 2;
      },
      full: (date: Date) =>
        meetings.filter((m) => isSameDay(parseISO(m.startTime), date)).length >
        2,
    }),
    [meetings],
  ); // Só recalcula se as reuniões mudarem

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Lado Esquerdo: O Calendário Estilizado */}
      <div className="p-8 lg:w-fit border-r border-slate-100 flex flex-col items-center">
        <DayPicker
          mode="single"
          selected={selectedDay}
          onSelect={setSelectedDay}
          locale={ptBR}
          modifiers={modifiers}
          modifiersClassNames={{
            available: "status-indicator available-indicator",
            busy: "status-indicator busy-indicator",
            full: "status-indicator full-indicator",
          }}
          // Usamos classNames para injetar Tailwind e bater com o estilo da imagem
          classNames={{
            caption: "flex justify-between items-center py-2 mb-4 px-2",
            caption_label: "text-base font-semibold text-slate-700 capitalize",
            nav: "flex gap-1",
            nav_button:
              "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity border rounded-md border-slate-200 flex items-center justify-center",
            head_cell: "text-slate-400 font-normal text-[0.8rem] w-11 pb-3",
            cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
            day: "h-11 w-11 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-full transition-all",
            selected:
              "bg-blue-600 text-white hover:bg-blue-600 rounded-full font-bold",
            today: "text-blue-600 font-bold underline underline-offset-4", // Destaque para o dia atual
          }}
        />

        {/* Indicadores de Status (Dots sutis embaixo) */}
        <div className="mt-8 grid grid-cols-3 gap-4 w-full border-t border-slate-50 pt-6">
          <StatusLegend color="bg-green-500" label="Livre" />
          <StatusLegend color="bg-slate-400" label="Ocupado" />
          <StatusLegend color="bg-red-500" label="Cheio" />
        </div>
      </div>

      {/* Coluna de Detalhes do Dia */}
      <div className="md:col-span-2 border-l border-slate-100 pl-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">
          {selectedDay
            ? format(selectedDay, "dd 'de' MMMM", { locale: ptBR })
            : "Selecione um dia"}
        </h2>

        <div className="space-y-4">
          {selectedDayMeetings.length > 0 ? (
            selectedDayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900">{meeting.title}</p>
                    <p className="text-sm text-slate-500">
                      {format(parseISO(meeting.startTime), "HH:mm")} -{" "}
                      {format(parseISO(meeting.endTime), "HH:mm")}
                    </p>
                    <p className="text-xs mt-1 text-blue-600 font-medium">
                      {role === "ADMIN"
                        ? `Cliente: ${meeting.clientName}`
                        : `Admin: ${meeting.adminName}`}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                      meeting.status === "CONFIRMADO"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {meeting.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 italic">
              Nenhuma reunião agendada para este dia.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}
