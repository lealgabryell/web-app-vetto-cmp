import CalendarContainer from "../../../../components/scheduling/CalendarView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda | Contract Manager Platform",
  description: "Gerenciamento de reuniões e compromissos.",
};

export default function AgendaPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Minha Agenda
          </h1>
          <p className="text-slate-500 text-sm">
            Visualize seus horários, status de reuniões e disponibilidade.
          </p>
        </div>

        {/* O Container que gerencia o Fetch e o Erro */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <CalendarContainer />
        </section>
      </div>
    </main>
  );
}