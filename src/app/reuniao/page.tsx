import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatarData, formatarMesAno, formatarMoeda, formatarNumero } from "@/lib/formato";
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
import { Apresentacao } from "./apresentacao";

export const metadata: Metadata = { title: "Modo Reunião" };

const DIAS_LONGOS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function pct(parte: number, todo: number): string {
  return `${((parte / todo) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

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
  const [linhas, linhasAnterior] = await Promise.all([
    buscarVendasPeriodo(supabase, inicio, fim, unidadeAtual || undefined),
    buscarVendasPeriodo(supabase, anterior.inicio, anterior.fim, unidadeAtual || undefined),
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

  // ---- Leitura do mês por regras simples (insights completos são da Fase 2) ----
  const destaques: string[] = [];
  const atencao: string[] = [];

  const melhorDiaIdx = agregados.porDia.indexOf(Math.max(...agregados.porDia));
  if (agregados.porDia[melhorDiaIdx] > 0) {
    const dataMelhor = `${mes}-${String(melhorDiaIdx + 1).padStart(2, "0")}`;
    destaques.push(
      `${formatarData(dataMelhor)} foi o melhor dia do mês, com ${formatarMoeda(agregados.porDia[melhorDiaIdx])}.`,
    );
  }

  const somaSemana = agregados.porDiaSemana.reduce((a, b) => a + b, 0);
  const melhorDow = agregados.porDiaSemana.indexOf(Math.max(...agregados.porDiaSemana));
  if (somaSemana > 0) {
    destaques.push(
      `${DIAS_LONGOS[melhorDow].charAt(0).toUpperCase() + DIAS_LONGOS[melhorDow].slice(1)}s concentram ${pct(agregados.porDiaSemana[melhorDow], somaSemana)} da venda.`,
    );
  }

  if (unidadesComVenda.length > 1) {
    destaques.push(
      `${unidadesComVenda[0].nome} lidera com ${pct(unidadesComVenda[0].valor, resumo.faturamento)} do faturamento.`,
    );
    const ultima = unidadesComVenda[unidadesComVenda.length - 1];
    atencao.push(
      `${ultima.nome} responde por ${pct(ultima.valor, resumo.faturamento)} do faturamento do período.`,
    );
  }

  if (delta !== null && delta >= 0) {
    destaques.push(
      `Faturamento ${delta === 0 ? "estável" : `${delta.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% acima`} em relação a ${formatarMesAno(mesAnterior(mes))}.`,
    );
  }
  if (delta !== null && delta < 0) {
    atencao.push(
      `Faturamento ${Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% abaixo de ${formatarMesAno(mesAnterior(mes))}.`,
    );
  }

  // dias sem venda entre o primeiro e o último dia com venda no mês
  const diasComVenda = agregados.porDia
    .map((v, i) => (v > 0 ? i : -1))
    .filter((i) => i !== -1);
  if (diasComVenda.length > 1) {
    const buraco =
      diasComVenda[diasComVenda.length - 1] - diasComVenda[0] + 1 - diasComVenda.length;
    if (buraco > 0) {
      atencao.push(
        `${buraco} ${buraco === 1 ? "dia sem venda registrada" : "dias sem venda registrada"} dentro do período — confira se falta planilha.`,
      );
    }
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
