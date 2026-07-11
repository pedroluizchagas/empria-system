import type { Metadata } from "next";
import { ChartNoAxesColumn } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Vendas & Metas" };

export default function VendasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Vendas & Metas"
        titulo="O pente fino"
        descricao="Quando, onde, quem e o que se vende — por mês, dia, dia da semana e horário."
      />
      <EmptyState
        icon={ChartNoAxesColumn}
        titulo="Análises de vendas chegam aqui"
        descricao="Heatmap dia × horário, comparativo entre lojas, ranking de vendedores, curva ABC e acompanhamento de metas — liberados assim que as primeiras planilhas de vendas forem importadas."
        fase="Fases 1 e 2"
      />
    </>
  );
}
