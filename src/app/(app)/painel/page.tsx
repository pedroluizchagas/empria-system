import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { obterContexto } from "@/lib/supabase/contexto";

export const metadata: Metadata = { title: "Painel Executivo" };

const KPIS = [
  { rotulo: "Faturamento", nota: "aguardando dados" },
  { rotulo: "Ticket médio", nota: "aguardando dados" },
  { rotulo: "Peças por atendimento", nota: "aguardando dados" },
  { rotulo: "Atingimento da meta", nota: "defina metas na Fase 2" },
];

export default async function PainelPage() {
  const contexto = await obterContexto();
  const nomeEmpresa = contexto?.empresa?.nome;

  return (
    <>
      <PageHeader
        eyebrow={nomeEmpresa ? `Painel Executivo · ${nomeEmpresa}` : "Painel Executivo"}
        titulo="Visão geral"
        descricao="O resumo do mês da sua operação — alimentado pelas planilhas importadas na Central de Dados."
      >
        <Button variant="secondary" disabled title="Disponível na Fase 1">
          Exportar PDF
        </Button>
        <Button disabled title="Disponível na Fase 1">
          Modo Reunião <span aria-hidden>↗</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
        {KPIS.map((kpi) => (
          <Card key={kpi.rotulo}>
            <CardLabel>{kpi.rotulo}</CardLabel>
            <p className="font-display text-[32px] font-bold tracking-[-0.03em] text-muted-4 tabular-nums">
              —
            </p>
            <p className="text-[12px] text-muted-3">{kpi.nota}</p>
          </Card>
        ))}
      </div>

      <EmptyState
        className="mt-4"
        icon={FileSpreadsheet}
        titulo="Comece pela primeira planilha"
        descricao="Suba o relatório de vendas de uma loja (.xls ou .xlsx) e o Empria monta este painel para você — sem fórmulas, sem tabela dinâmica."
        fase="Fase 1 · MVP Vendas"
      >
        <Button asChild variant="secondary">
          <Link href="/dados">Ir para a Central de Dados</Link>
        </Button>
      </EmptyState>
    </>
  );
}
