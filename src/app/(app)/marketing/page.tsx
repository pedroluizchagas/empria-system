import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Marketing" };

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        titulo="Conteúdo, campanhas e tráfego"
        descricao="Calendário de conteúdo com aprovação, campanhas sobrepostas às vendas e ROAS do tráfego pago."
      />
      <EmptyState
        icon={Megaphone}
        titulo="O marketing inteiro num só lugar"
        descricao="Pauta por canal com fluxo de aprovação, datas do varejo brasileiro pré-carregadas e importação dos relatórios de Meta Ads e Google Ads — investimento × receita lado a lado."
        fase="Fase 3"
      />
    </>
  );
}
