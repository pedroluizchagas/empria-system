import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatarMesAno, formatarMoeda, formatarNumero } from "@/lib/formato";
import { gerarLeitura } from "@/lib/insights";
import { buscarMetas, calcularRitmo, metaDaEmpresa, metaDaUnidade } from "@/lib/metas";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
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
import { datasDoVarejoNoPeriodo } from "@/lib/varejo";
import { Apresentacao } from "./apresentacao";

export const metadata: Metadata = { title: "Modo Reunião" };

export default async function ReuniaoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; unidade?: string }>;
}) {
  const params = await searchParams;

  const semDados = (mensagem: string) => (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <h1 className="font-display text-[32px] font-bold tracking-[-0.03em]">Modo Reunião</h1>
      <p className="max-w-md text-sm text-muted-foreground">{mensagem}</p>
      <Button asChild variant="secondary">
        <Link href="/painel">Voltar ao painel</Link>
      </Button>
    </div>
  );

  if (!isSupabaseConfigurado()) {
    return semDados("Modo prévia — configure o Supabase para apresentar com dados reais.");
  }

  const contexto = await obterContexto();
  const supabase = await createClient();
  const limites = await limitesDatas(supabase);
  if (!limites) {
    return semDados(
      "A apresentação é montada a partir das vendas importadas — suba a primeira planilha na Central de Dados.",
    );
  }

  const meses = mesesEntre(limites.primeira, limites.ultima);
  const mes = params.mes && meses.includes(params.mes) ? params.mes : meses[0];
  const { inicio, fim } = intervaloDoMes(mes);

  const { data: dataUnidades } = await supabase.from("unidade").select("id, nome").order("nome");
  const unidades = dataUnidades ?? [];
  const unidadeAtual =
    params.unidade && unidades.some((u) => u.id === params.unidade) ? params.unidade : "";

  const anterior = intervaloDoMes(mesAnterior(mes));
  const mesAnoPassado = `${Number(mes.slice(0, 4)) - 1}-${mes.slice(5, 7)}`;
  const anoPassado = intervaloDoMes(mesAnoPassado);
  let consultaEventos = supabase
    .from("evento_agenda")
    .select("titulo, inicio, fim")
    .lte("inicio", fim)
    .or(`fim.gte.${inicio},inicio.gte.${inicio}`);
  if (unidadeAtual) {
    consultaEventos = consultaEventos.or(`unidade_id.is.null,unidade_id.eq.${unidadeAtual}`);
  }
  const [linhas, linhasAnterior, linhasAnoPassado, metas, { data: dataEventos }] = await Promise.all([
    buscarVendasPeriodo(supabase, inicio, fim, unidadeAtual || undefined),
    buscarVendasPeriodo(supabase, anterior.inicio, anterior.fim, unidadeAtual || undefined),
    buscarVendasPeriodo(supabase, anoPassado.inicio, anoPassado.fim, unidadeAtual || undefined),
    buscarMetas(supabase, mes),
    consultaEventos,
  ]);

  if (linhas.length === 0) {
    return semDados(`Nenhuma venda registrada em ${formatarMesAno(mes)} para este recorte.`);
  }

  const resumo = resumirVendas(linhas);
  const resumoAnterior = resumirVendas(linhasAnterior);
  const delta =
    resumoAnterior.faturamento > 0
      ? ((resumo.faturamento - resumoAnterior.faturamento) / resumoAnterior.faturamento) * 100
      : null;
  const deltaTexto =
    delta === null
      ? null
      : `${delta >= 0 ? "+" : ""}${delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs ${formatarMesAno(mesAnterior(mes))}`;

  const faturamentoAnoPassado = linhasAnoPassado.reduce((soma, l) => soma + l.valor, 0);
  const deltaAno =
    faturamentoAnoPassado > 0
      ? ((resumo.faturamento - faturamentoAnoPassado) / faturamentoAnoPassado) * 100
      : null;
  const metaAtual = unidadeAtual ? metaDaUnidade(metas, unidadeAtual) : metaDaEmpresa(metas);
  const ritmo = metaAtual ? calcularRitmo(metaAtual.valor, resumo.faturamento, mes) : null;

  const agregados = agregarVendas(linhas, fim);
  const totalDias = Number(fim.slice(8, 10));

  const unidadesComVenda = unidades
    .filter((u) => agregados.porUnidade.has(u.id))
    .map((u) => ({ nome: u.nome, valor: Math.round(agregados.porUnidade.get(u.id)! * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor);

  // ---- KPIs da visão geral (só o que os dados desbloqueiam) ----
  const kpis: { rotulo: string; valor: string; detalhe?: string }[] = [
    {
      rotulo: "Faturamento",
      valor: formatarMoeda(resumo.faturamento, resumo.faturamento >= 100_000),
      detalhe: deltaTexto ?? undefined,
    },
    {
      rotulo: "Média por dia",
      valor: formatarMoeda(resumo.mediaPorDia),
      detalhe: `${resumo.diasComVenda} ${resumo.diasComVenda === 1 ? "dia" : "dias"} com venda`,
    },
  ];
  if (resumo.ticketMedio !== null) {
    kpis.push({
      rotulo: "Ticket médio",
      valor: formatarMoeda(resumo.ticketMedio),
      detalhe: `${resumo.atendimentos!.toLocaleString("pt-BR")} atendimentos`,
    });
  }
  if (resumo.pecas !== null) {
    kpis.push({
      rotulo: "Peças vendidas",
      valor: formatarNumero(resumo.pecas),
      detalhe:
        resumo.pa !== null
          ? `PA ${resumo.pa.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}`
          : undefined,
    });
  }

  if (metaAtual && ritmo) {
    // logo após o faturamento — a meta não pode ser cortada pelo limite de 4
    kpis.splice(1, 0, {
      rotulo: "Atingimento da meta",
      valor: `${ritmo.atingidoPct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`,
      detalhe:
        ritmo.porDia !== null
          ? `meta ${formatarMoeda(metaAtual.valor, true)} · ${formatarMoeda(ritmo.porDia)}/dia até o fim do mês`
          : `meta ${formatarMoeda(metaAtual.valor, true)}`,
    });
  }

  const { destaques, atencao } = gerarLeitura({
    mes,
    resumo,
    delta,
    deltaAno,
    agregados,
    unidades: unidadesComVenda,
    meta: metaAtual && ritmo ? { valor: metaAtual.valor, ritmo } : null,
  });

  const faixas: { nome: string; de: number; ate: number }[] = [];
  const marcos: { nome: string; dia: number }[] = [];
  for (const ev of dataEventos ?? []) {
    const de = ev.inicio < inicio ? 1 : Number(ev.inicio.slice(8, 10));
    const fimEv = ev.fim ?? ev.inicio;
    const ate = fimEv > fim ? totalDias : Number(fimEv.slice(8, 10));
    if (ate < de) continue;
    if (de === ate) marcos.push({ nome: ev.titulo, dia: de });
    else faixas.push({ nome: ev.titulo, de, ate });
  }
  for (const dv of datasDoVarejoNoPeriodo(inicio, fim)) {
    const dia = Number(dv.data.slice(8, 10));
    if (!marcos.some((m) => m.dia === dia)) marcos.push({ nome: dv.nome, dia });
  }

  const geradoEm = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());

  const parametros = new URLSearchParams();
  if (params.mes) parametros.set("mes", mes);
  if (unidadeAtual) parametros.set("unidade", unidadeAtual);
  const consulta = parametros.toString();

  return (
    <Apresentacao
      empresa={contexto?.empresa?.nome ?? "Sua empresa"}
      mesRotulo={formatarMesAno(mes)}
      unidadeRotulo={
        unidadeAtual
          ? unidades.find((u) => u.id === unidadeAtual)?.nome ?? "Unidade"
          : "Todas as unidades"
      }
      geradoEm={geradoEm}
      kpis={kpis.slice(0, 4)}
      dias={Array.from({ length: totalDias }, (_, i) => String(i + 1).padStart(2, "0"))}
      porDia={agregados.porDia.map((v) => Math.round(v * 100) / 100)}
      faixas={faixas}
      marcos={marcos}
      porDiaSemana={agregados.porDiaSemana.map((v) => Math.round(v * 100) / 100)}
      temHora={agregados.temHora}
      horas={agregados.horas}
      celulas={agregados.celulas}
      maximoCelula={agregados.maximoCelula}
      unidades={unidadesComVenda}
      destaques={destaques}
      atencao={atencao}
      urlVoltar={consulta ? `/vendas?${consulta}` : "/vendas"}
    />
  );
}
