import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Importacao, Unidade } from "@/lib/dominio";
import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/formato";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import {
  buscarVendasPeriodo,
  intervaloDoMes,
  limitesDatas,
  resumirVendas,
  type ResumoVendas,
} from "@/lib/vendas";

export const metadata: Metadata = { title: "Painel Executivo" };

export default async function PainelPage() {
  const contexto = await obterContexto();
  const nomeEmpresa = contexto?.empresa?.nome;

  let resumo: ResumoVendas | null = null;
  let mesReferencia: string | null = null;
  let ultimasImportacoes: (Pick<Importacao, "id" | "criado_em" | "periodo_fim"> & {
    unidade: Pick<Unidade, "nome"> | null;
  })[] = [];

  if (isSupabaseConfigurado()) {
    const supabase = await createClient();
    const limites = await limitesDatas(supabase);
    if (limites) {
      // mês de referência = o mais recente com dados
      mesReferencia = limites.ultima.slice(0, 7);
      const { inicio, fim } = intervaloDoMes(mesReferencia);
      const [linhas, { data }] = await Promise.all([
        buscarVendasPeriodo(supabase, inicio, fim),
        supabase
          .from("importacao")
          .select("id, criado_em, periodo_fim, unidade(nome)")
          .eq("status", "concluida")
          .order("criado_em", { ascending: false })
          .limit(5),
      ]);
      resumo = resumirVendas(linhas);
      ultimasImportacoes =
        (data as unknown as typeof ultimasImportacoes) ?? [];
    }
  }

  const kpis = [
    {
      rotulo: "Faturamento",
      valor: resumo ? formatarMoeda(resumo.faturamento, resumo.faturamento >= 100_000) : null,
      nota: resumo && mesReferencia ? formatarMesAno(mesReferencia) : "aguardando dados",
    },
    {
      rotulo: "Ticket médio",
      valor: resumo?.ticketMedio != null ? formatarMoeda(resumo.ticketMedio) : null,
      nota:
        resumo && resumo.ticketMedio == null
          ? "importe o nº do cupom para desbloquear"
          : resumo
            ? `${resumo.atendimentos?.toLocaleString("pt-BR")} atendimentos`
            : "aguardando dados",
    },
    {
      rotulo: "Peças por atendimento",
      valor:
        resumo?.pa != null
          ? resumo.pa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
          : null,
      nota:
        resumo && resumo.pa == null
          ? "importe quantidade e cupom para desbloquear"
          : resumo
            ? "média do mês"
            : "aguardando dados",
    },
    {
      rotulo: "Atingimento da meta",
      valor: null,
      nota: "defina metas na Fase 2",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={nomeEmpresa ? `Painel Executivo · ${nomeEmpresa}` : "Painel Executivo"}
        titulo="Visão geral"
        descricao="O resumo do mês da sua operação — alimentado pelas planilhas importadas na Central de Dados."
      >
        <Button variant="secondary" disabled title="Disponível ainda na Fase 1">
          Exportar PDF
        </Button>
        <Button disabled title="Disponível ainda na Fase 1">
          Modo Reunião <span aria-hidden>↗</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
        {kpis.map((kpi) => (
          <Card key={kpi.rotulo}>
            <CardLabel>{kpi.rotulo}</CardLabel>
            <p
              className={
                kpi.valor
                  ? "font-display text-[32px] font-bold tracking-[-0.03em] tabular-nums"
                  : "font-display text-[32px] font-bold tracking-[-0.03em] text-muted-4 tabular-nums"
              }
            >
              {kpi.valor ?? "—"}
            </p>
            <p className="text-[12px] text-muted-3">{kpi.nota}</p>
          </Card>
        ))}
      </div>

      {resumo ? (
        <div className="mt-4 grid grid-cols-3 gap-4 max-[1000px]:grid-cols-1">
          <Card className="col-span-2 max-[1000px]:col-span-1">
            <CardLabel>Vendas</CardLabel>
            <p className="mb-4 text-sm text-muted-foreground">
              {mesReferencia && formatarMesAno(mesReferencia)} ·{" "}
              {resumo.diasComVenda} {resumo.diasComVenda === 1 ? "dia" : "dias"} com
              venda · média de {formatarMoeda(resumo.mediaPorDia)} por dia.
            </p>
            <Button asChild variant="secondary">
              <Link href="/vendas">Abrir o pente fino</Link>
            </Button>
          </Card>
          <Card>
            <CardLabel>Saúde dos dados</CardLabel>
            {ultimasImportacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma importação ativa.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
                {ultimasImportacoes.map((imp) => (
                  <li key={imp.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{imp.unidade?.nome ?? "—"}</span>
                    <Badge variant={imp.periodo_fim ? "ok" : "neutro"}>
                      até {imp.periodo_fim ? formatarData(imp.periodo_fim) : "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      ) : (
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
      )}
    </>
  );
}
