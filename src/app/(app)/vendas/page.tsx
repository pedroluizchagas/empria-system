import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesColumn } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatarMoeda, formatarNumero } from "@/lib/formato";
import { gerarLeitura } from "@/lib/insights";
import { buscarMetas, calcularRitmo, metaDaEmpresa, metaDaUnidade } from "@/lib/metas";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  agregarVendas,
  buscarVendasPeriodo,
  intervaloDoMes,
  limitesDatas,
  mesAnterior,
  mesesEntre,
  resumirVendas,
} from "@/lib/vendas";
import { cn } from "@/lib/utils";
import { Tabela, Th, Td } from "@/components/ui/table";
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
  const anoPassado = intervaloDoMes(`${Number(mes.slice(0, 4)) - 1}-${mes.slice(5, 7)}`);
  let consultaEventos = supabase
    .from("evento_agenda")
    .select("titulo, tipo, inicio, fim")
    .lte("inicio", fim)
    .or(`fim.gte.${inicio},inicio.gte.${inicio}`);
  if (unidadeAtual) {
    consultaEventos = consultaEventos.or(`unidade_id.is.null,unidade_id.eq.${unidadeAtual}`);
  }
  const [linhas, linhasAnterior, linhasAnoPassado, metas, { data: dataEventos }] =
    await Promise.all([
      buscarVendasPeriodo(supabase, inicio, fim, unidadeAtual || undefined),
      buscarVendasPeriodo(supabase, anterior.inicio, anterior.fim, unidadeAtual || undefined),
      buscarVendasPeriodo(supabase, anoPassado.inicio, anoPassado.fim, unidadeAtual || undefined),
      buscarMetas(supabase, mes),
      consultaEventos,
    ]);
  const eventos = dataEventos ?? [];

  const resumo = resumirVendas(linhas);
  const resumoAnterior = resumirVendas(linhasAnterior);
  const deltaFaturamento =
    resumoAnterior.faturamento > 0
      ? ((resumo.faturamento - resumoAnterior.faturamento) / resumoAnterior.faturamento) * 100
      : null;

  const totalDias = Number(fim.slice(8, 10));
  const { porDia, porDiaSemana, temHora, horas, celulas, maximoCelula, porUnidade } =
    agregarVendas(linhas, fim);

  const unidadesComVenda = unidades
    .filter((u) => porUnidade.has(u.id))
    .map((u) => ({ nome: u.nome, valor: porUnidade.get(u.id)! }))
    .sort((a, b) => b.valor - a.valor);

  const faturamentoAnoPassado = linhasAnoPassado.reduce((soma, l) => soma + l.valor, 0);
  const deltaAno =
    faturamentoAnoPassado > 0
      ? ((resumo.faturamento - faturamentoAnoPassado) / faturamentoAnoPassado) * 100
      : null;

  // ---- meta do recorte (empresa ou unidade filtrada) e ritmo ----
  const metaAtual = unidadeAtual ? metaDaUnidade(metas, unidadeAtual) : metaDaEmpresa(metas);
  const ritmo = metaAtual ? calcularRitmo(metaAtual.valor, resumo.faturamento, mes) : null;

  // ---- quem vende: ranking por vendedor (se a coluna existir) ----
  const porVendedor = new Map<string, { valor: number; cupons: Set<string>; pecas: number; temQtde: boolean }>();
  for (const linha of linhas) {
    if (!linha.vendedor) continue;
    const v = porVendedor.get(linha.vendedor) ?? { valor: 0, cupons: new Set<string>(), pecas: 0, temQtde: false };
    v.valor += linha.valor;
    if (linha.cupom) v.cupons.add(`${linha.data}|${linha.cupom}`);
    if (linha.quantidade !== null) { v.pecas += linha.quantidade; v.temQtde = true; }
    porVendedor.set(linha.vendedor, v);
  }
  const metaPorVendedor = new Map<string, number>();
  for (const m of metas) {
    if (!m.vendedor) continue;
    if (unidadeAtual && m.unidade_id !== unidadeAtual) continue;
    metaPorVendedor.set(m.vendedor, (metaPorVendedor.get(m.vendedor) ?? 0) + m.valor);
  }
  // eventos da agenda recortados para os dias do mês exibido
  const faixasEventos: { nome: string; de: number; ate: number }[] = [];
  const marcosEventos: { nome: string; dia: number }[] = [];
  for (const ev of eventos) {
    const de = ev.inicio < inicio ? 1 : Number(ev.inicio.slice(8, 10));
    const fimEv = ev.fim ?? ev.inicio;
    const ate = fimEv > fim ? totalDias : Number(fimEv.slice(8, 10));
    if (ate < de) continue;
    if (de === ate) marcosEventos.push({ nome: ev.titulo, dia: de });
    else faixasEventos.push({ nome: ev.titulo, de, ate });
  }

  const leitura = gerarLeitura({
    mes,
    resumo,
    delta: deltaFaturamento,
    deltaAno,
    agregados: { porDia, porDiaSemana, temHora, horas, celulas, maximoCelula, porUnidade },
    unidades: unidadesComVenda,
    meta: metaAtual && ritmo ? { valor: metaAtual.valor, ritmo } : null,
  });

  const ranking = [...porVendedor.entries()]
    .map(([nome, v]) => ({ nome, ...v, meta: metaPorVendedor.get(nome) ?? null }))
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
        <Button asChild>
          <Link
            href={`/reuniao?mes=${mes}${unidadeAtual ? `&unidade=${unidadeAtual}` : ""}`}
          >
            Modo Reunião <span aria-hidden>↗</span>
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2">
        <Kpi
          rotulo="Faturamento"
          valor={formatarMoeda(resumo.faturamento, resumo.faturamento >= 100_000)}
          deltaPct={deltaFaturamento}
          detalhe={
            deltaAno !== null
              ? `${deltaAno >= 0 ? "+" : ""}${deltaAno.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs ano passado`
              : undefined
          }
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

      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardLabel className="mb-0">
            Meta {unidadeAtual ? "da unidade" : "da empresa"}
          </CardLabel>
          <Link
            href="/vendas/metas"
            className="text-[12px] text-primary underline-offset-2 hover:underline"
          >
            definir metas
          </Link>
        </div>
        {metaAtual && ritmo ? (
          <div className="mt-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm">
                <strong className="font-display text-xl font-medium tracking-[-0.02em]">
                  {formatarMoeda(resumo.faturamento, true)}
                </strong>{" "}
                <span className="text-muted-foreground">
                  de {formatarMoeda(metaAtual.valor, true)} ·{" "}
                  {ritmo.atingidoPct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                </span>
              </p>
              <p className="text-[13px] text-muted-foreground">
                {ritmo.porDia !== null
                  ? `para bater a meta: ${formatarMoeda(ritmo.porDia)}/dia até o fim do mês`
                  : ritmo.falta === 0
                    ? "meta batida 🎯"
                    : ritmo.diasRestantes === 0
                      ? `faltaram ${formatarMoeda(ritmo.falta)}`
                      : ""}
              </p>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn(
                  "h-full rounded-full",
                  ritmo.atingidoPct >= 100 ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${Math.min(100, ritmo.atingidoPct)}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Sem meta definida para este recorte — defina em Metas para acompanhar o ritmo diário.
          </p>
        )}
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">
        <Card className="col-span-2 max-[1000px]:col-span-1">
          <CardLabel>Quando se vende</CardLabel>
          <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
            Venda por dia
          </h3>
          <GraficoVendaPorDia
            dias={Array.from({ length: totalDias }, (_, i) => String(i + 1).padStart(2, "0"))}
            valores={porDia.map((v) => Math.round(v * 100) / 100)}
            faixas={faixasEventos}
            marcos={marcosEventos}
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
            <HeatmapDiaHora horas={horas} celulas={celulas} maximo={maximoCelula} />
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

      <Card className="mt-4">
        <CardLabel>Insights do período</CardLabel>
        <div className="mt-2 grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
          <ul className="flex flex-col gap-2">
            {leitura.destaques.map((d) => (
              <li key={d} className="flex gap-2.5 text-sm">
                <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-success" />
                {d}
              </li>
            ))}
          </ul>
          <ul className="flex flex-col gap-2">
            {leitura.atencao.length === 0 ? (
              <li className="text-sm text-muted-3">Nenhum ponto de atenção neste período.</li>
            ) : (
              leitura.atencao.map((a) => (
                <li key={a} className="flex gap-2.5 text-sm">
                  <span aria-hidden className="mt-[7px] size-1.5 shrink-0 rounded-full bg-warning" />
                  {a}
                </li>
              ))
            )}
          </ul>
        </div>
      </Card>

      {ranking.length > 0 && (
        <Card className="mt-4">
          <CardLabel>Quem vende</CardLabel>
          <h3 className="mb-3 font-display text-lg font-medium tracking-[-0.02em]">
            Ranking de vendedores
          </h3>
          <Tabela>
            <thead>
              <tr>
                <Th>#</Th>
                <Th>Vendedor(a)</Th>
                <Th className="text-right">Faturamento</Th>
                <Th className="text-right">Particip.</Th>
                <Th className="text-right">Ticket médio</Th>
                <Th className="text-right">PA</Th>
                <Th className="text-right">Meta</Th>
                <Th>Atingimento</Th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((v, i) => {
                const ticket = v.cupons.size > 0 ? v.valor / v.cupons.size : null;
                const pa = v.cupons.size > 0 && v.temQtde ? v.pecas / v.cupons.size : null;
                const atingido = v.meta ? (v.valor / v.meta) * 100 : null;
                return (
                  <tr key={v.nome}>
                    <Td className="text-muted-3">{i + 1}</Td>
                    <Td className="font-medium">{v.nome}</Td>
                    <Td className="text-right tabular-nums">{formatarMoeda(v.valor)}</Td>
                    <Td className="text-right tabular-nums text-muted-foreground">
                      {((v.valor / resumo.faturamento) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                    </Td>
                    <Td className="text-right tabular-nums">
                      {ticket !== null ? formatarMoeda(ticket) : "—"}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {pa !== null ? pa.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "—"}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {v.meta !== null ? formatarMoeda(v.meta, true) : "—"}
                    </Td>
                    <Td className="min-w-36">
                      {atingido !== null ? (
                        <span className="flex items-center gap-2">
                          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-2">
                            <span
                              className={cn(
                                "block h-full rounded-full",
                                atingido >= 100 ? "bg-success" : "bg-primary",
                              )}
                              style={{ width: `${Math.min(100, atingido)}%` }}
                            />
                          </span>
                          <span className="text-[12px] tabular-nums text-muted-foreground">
                            {atingido.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-3">—</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        </Card>
      )}
    </>
  );
}
