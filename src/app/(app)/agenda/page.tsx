import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Agenda & Tarefas" };

export default function AgendaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Agenda & Tarefas"
        titulo="O centro de eventos"
        descricao="Campanhas, trocas de coleção, inventários e tarefas por setor — a linha do tempo única da empresa."
      />
      <EmptyState
        icon={CalendarDays}
        titulo="Tudo que acontece, num calendário só"
        descricao="Eventos da empresa sobrepostos aos gráficos de venda, tarefas com responsável e prazo, comunicados para a equipe — é o que transforma número em narrativa."
        fase="Fase 3"
      />
    </>
  );
}
