import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesColumn } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatarMoeda, formatarNumero } from "@/lib/formato";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  buscarVendasPeriodo,
  diaDaSemana,
  intervaloDoMes,
  limitesDatas,
  mesAnterior,
  mesesEntre,
  resumirVendas,
} from "@/lib/vendas";
import { cn } from "@/lib/utils";
import { FiltrosVendas } from "./filtros";
import {
  GraficoDiaSemana,
  GraficoUnidades,
  GraficoVendaPorDia,
  HeatmapDiaHora,
} from "./graficos";

export const metadata: Metadata = { title: "Vendas & Metas" };

function Kpi({
  rotulo,
  valor,
  detalhe,
  deltaPct,
}: {
  rotulo: string;
  valor: string;
  detalhe?: string;
  deltaPct?: number | null;
}) {
  return (
    <Card className="p-5">
      <CardLabel>{rotulo}</CardLabel>
      <p className="font-display text-[27px] font-medium leading-tight tracking-[-0.02em]">
        {valor}
      </p>
      {deltaPct !== undefined && deltaPct !== null && (
        <p
          className={cn(
            "mt-1 text-[12px] font-medium",
            deltaPct >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {deltaPct >= 0 ? "+" : ""}
          {deltaPct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs mês
          anterior
        </p>
      )}
      {detalhe && <p className="mt-1 text-[12px] text-muted-3">{detalhe}</p>}
    </Card>
  );
}

export default async function VendasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; unidade?: string }>;
}) {
  const params = await searchParams;

  const vazio = (
    <EmptyState
      icon={ChartNoAxesColumn}
      titulo="O pente fino das vendas"
      descricao="Quando se vende, onde se vende, quem vende e o que se vende — os painéis aparecem assim que a primeira planilha entrar."
      className="min-h-96"
    >
      <Button asChild>
        <Link href="/dados">Importar a primeira planilha</Link>
      </Button>
    </EmptyState>
  );

  if (!isSupabaseConfigurado()) {
    return (
      <>
        <PageHeader
          eyebrow="Vendas & Metas"
          titulo="Vendas"
          descricao="Modo prévia — configure o Supabase para ver os painéis com dados reais."
        />
        {vazio}
      </>
    );
  }

  const supabase = await createClient();
  const limites = await limitesDatas(supabase);

  if (!limites) {
    return (
      <>
        <PageHeader
          eyebrow="Vendas & Metas"
          titulo="Vendas"
          descricao="Nenhuma venda importada ainda."
        />
        {vazio}
      </>
    );
  }

  const meses = mesesEntre(limites.primeira, limites.ultima);
  const mes = params.mes && meses.includes(params.mes) ? params.mes : meses[0];
  const { inicio, fim } = intervaloDoMes(mes);

  const { data: dataUnidades } = await supabase
    .from("unidade")
    .select("id, nome")
    .order("nome");
  const unidades = dataUnidades ?? [];
  const unidadeAtual =
    params.unidade && unidades.some((u) => u.id === params.unidade)
      ? params.unidade
      : "";

  const anterior = intervaloDoMes(mesAnterior(mes));
  const [linhas, linhasAnterior] = await Promise.all([
    buscarVendasPeriodo(supabase, inicio, fim, unidadeAtual || undefined),
    buscarVendasPeriodo(supabase, anterior.inicio, anterior.fim, unidadeAtual || undefined),
  ]);

  const resumo = resumirVendas(linhas);
  const resumoAnterior = resumirVendas(linhasAnterior);
  const deltaFaturamento =
    resumoAnterior.faturamento > 0
      ? ((resumo.faturamento - resumoAnterior.faturamento) / resumoAnterior.faturamento) * 100
      : null;

  // agregações dos gráficos: por dia do mês, dia da semana, dia × hora, unidade
  const totalDias = Number(fim.slice(8, 10));
  const porDia = new Array<number>(totalDias).fill(0);
  const porDiaSemana = new Array<number>(7).fill(0);
  const porDiaHora = new Map<number, number>();
  let temHora = false;
  const porUnidade = new Map<string, number>();

  for (const linha of linhas) {
    const dia = Number(linha.data.slice(8, 10));
    porDia[dia - 1] += linha.valor;
    const dow = diaDaSemana(linha.data);
    porDiaSemana[dow] += linha.valor;
    if (linha.hora) {
      temHora = true;
      const horaCheia = Number(linha.hora.slice(0, 2));
      const chave = dow * 24 + horaCheia;
      porDiaHora.set(chave, (porDiaHora.get(chave) ?? 0) + linha.valor);
    }
    porUnidade.set(linha.unidade_id, (porUnidade.get(linha.unidade_id) ?? 0) + linha.valor);
  }

  const horasPresentes = [...new Set([...porDiaHora.keys()].map((c) => c % 24))].sort(
    (a, b) => a - b,
  );
  const horas =
    horasPresentes.length > 0
      ? Array.from(
          { length: horasPresentes[horasPresentes.length - 1] - horasPresentes[0] + 1 },
          (_, i) => horasPresentes[0] + i,
        )
      : [];
  const celulas: [number, number, number][] = [];
  let maximoCelula = 0;
  for (const [chave, valor] of porDiaHora) {
    const dow = Math.floor(chave / 24);
    const idxHora = horas.indexOf(chave % 24);
    if (idxHora === -1) continue;
    celulas.push([idxHora, dow, Math.round(valor)]);
    if (valor > maximoCelula) maximoCelula = valor;
  }

  const unidadesComVenda = unidades
    .filter((u) => porUnidade.has(u.id))
    .map((u) => ({ nome: u.nome, valor: porUnidade.get(u.id)! }))
    .sort((a, b) => b.valor - a.valor);

  return (
    <>
      <PageHeader
        eyebrow="Vendas & Metas"
        titulo="Vendas"
        descricao={`${linhas.length.toLocaleString("pt-BR")} registros no período · comparativo contra o mês anterior.`}
      >
        <FiltrosVendas
          meses={meses}
          mesAtual={mes}
          unidades={unidades}
          unidadeAtual={unidadeAtual}
        />
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2">
        <Kpi
          rotulo="Faturamento"
          valor={formatarMoeda(resumo.faturamento, resumo.faturamento >= 100_000)}
          deltaPct={deltaFaturamento}
        />
        <Kpi
          rotulo="Média por dia"
          valor={formatarMoeda(resumo.mediaPorDia)}
          detalhe={`${resumo.diasComVenda} ${resumo.diasComVenda === 1 ? "dia" : "dias"} com venda`}
        />
        {resumo.atendimentos !== null ? (
          <Kpi
            rotulo="Ticket médio"
            valor={formatarMoeda(resumo.ticketMedio ?? 0)}
            detalhe={`${resumo.atendimentos.toLocaleString("pt-BR")} atendimentos`}
          />
        ) : (
          <Kpi
            rotulo="Ticket médio"
            valor="—"
            detalhe="Inclua a coluna nº do cupom para desbloquear"
          />
        )}
        {resumo.pecas !== null ? (
          <Kpi
            rotulo="Peças vendidas"
            valor={formatarNumero(resumo.pecas)}
            detalhe={
              resumo.pa !== null
                ? `PA ${resumo.pa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} · preço médio ${formatarMoeda(resumo.precoMedioPeca ?? 0)}`
                : `preço médio ${formatarMoeda(resumo.precoMedioPeca ?? 0)}`
            }
          />
        ) : (
          <Kpi
            rotulo="Peças vendidas"
            valor="—"
            detalhe="Inclua a coluna quantidade para desbloquear"
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        <Card className="col-span-2 max-[1000px]:col-span-1">
          <CardLabel>Quando se vende</CardLabel>
          <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
            Venda por dia
          </h3>
          <GraficoVendaPorDia
            dias={Array.from({ length: totalDias }, (_, i) => String(i + 1).padStart(2, "0"))}
            valores={porDia.map((v) => Math.round(v * 100) / 100)}
          />
        </Card>

        <Card>
          <CardLabel>Quando se vende</CardLabel>
          <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
            Por dia da semana
          </h3>
          <GraficoDiaSemana valores={porDiaSemana.map((v) => Math.round(v * 100) / 100)} />
        </Card>

        {temHora ? (
          <Card>
            <CardLabel>Quando se vende</CardLabel>
            <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
              Mapa de calor · dia × hora
            </h3>
            <HeatmapDiaHora horas={horas} celulas={celulas} maximo={Math.round(maximoCelula)} />
          </Card>
        ) : (
          <Card className="flex flex-col justify-center">
            <CardLabel>Mapa de calor · dia × hora</CardLabel>
            <p className="text-sm text-muted-foreground">
              Sua planilha ainda não traz a coluna de{" "}
              <strong className="font-medium text-foreground">hora da venda</strong>. Quando
              ela vier, o mapa de calor dia × hora aparece aqui — sem configurar nada.
            </p>
          </Card>
        )}

        {unidadesComVenda.length > 1 && !unidadeAtual && (
          <Card className="col-span-2 max-[1000px]:col-span-1">
            <CardLabel>Onde se vende</CardLabel>
            <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
              Por unidade
            </h3>
            <GraficoUnidades
              nomes={unidadesComVenda.map((u) => u.nome)}
              valores={unidadesComVenda.map((u) => Math.round(u.valor * 100) / 100)}
            />
          </Card>
        )}
      </div>
    </>
  );
}
