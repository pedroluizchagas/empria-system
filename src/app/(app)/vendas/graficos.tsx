"use client";

import { Grafico, TEMA_GRAFICO } from "@/components/grafico";
import { DIAS_SEMANA_CURTOS, formatarMoeda } from "@/lib/formato";

/**
 * Os gráficos recebem dados já agregados no servidor e montam as opções
 * do ECharts no cliente (formatters são funções — não atravessam a
 * fronteira servidor→cliente).
 */

const eixoValor = {
  type: "value" as const,
  axisLabel: {
    color: TEMA_GRAFICO.textoFraco,
    fontSize: 11,
    formatter: (v: number) =>
      v >= 1000 ? `${(v / 1000).toLocaleString("pt-BR")} mil` : String(v),
  },
  splitLine: { lineStyle: { color: TEMA_GRAFICO.hairline } },
};

const dicaMoeda = {
  trigger: "axis" as const,
  valueFormatter: (v: unknown) => formatarMoeda(Number(v)),
  textStyle: { fontSize: 12 },
};

export function GraficoVendaPorDia({
  dias,
  valores,
}: {
  dias: string[]; // "01", "02"…
  valores: number[];
}) {
  return (
    <Grafico
      opcao={{
        grid: { left: 48, right: 8, top: 16, bottom: 24 },
        tooltip: dicaMoeda,
        xAxis: {
          type: "category",
          data: dias,
          axisLine: { lineStyle: { color: TEMA_GRAFICO.hairline } },
          axisTick: { show: false },
          axisLabel: { color: TEMA_GRAFICO.textoFraco, fontSize: 11 },
        },
        yAxis: eixoValor,
        series: [
          {
            type: "bar",
            data: valores,
            itemStyle: { color: TEMA_GRAFICO.primaria, borderRadius: [2, 2, 0, 0] },
            barMaxWidth: 18,
            name: "Venda",
          },
        ],
      }}
    />
  );
}

export function GraficoDiaSemana({ valores }: { valores: number[] }) {
  return (
    <Grafico
      opcao={{
        grid: { left: 48, right: 8, top: 16, bottom: 24 },
        tooltip: dicaMoeda,
        xAxis: {
          type: "category",
          data: DIAS_SEMANA_CURTOS,
          axisLine: { lineStyle: { color: TEMA_GRAFICO.hairline } },
          axisTick: { show: false },
          axisLabel: { color: TEMA_GRAFICO.texto, fontSize: 11 },
        },
        yAxis: eixoValor,
        series: [
          {
            type: "bar",
            data: valores,
            itemStyle: { color: TEMA_GRAFICO.profundo, borderRadius: [2, 2, 0, 0] },
            barMaxWidth: 28,
            name: "Venda",
          },
        ],
      }}
    />
  );
}

export function HeatmapDiaHora({
  horas,
  celulas,
  maximo,
}: {
  horas: number[]; // horas presentes nos dados, em ordem
  celulas: [number, number, number][]; // [índice da hora, dia da semana 0-6, valor]
  maximo: number;
}) {
  return (
    <Grafico
      altura={320}
      opcao={{
        grid: { left: 44, right: 8, top: 8, bottom: 56 },
        tooltip: {
          position: "top",
          formatter: (p) => {
            const v = (p as unknown as { value: [number, number, number] }).value;
            return `${DIAS_SEMANA_CURTOS[v[1]]} · ${horas[v[0]]}h — ${formatarMoeda(v[2])}`;
          },
          textStyle: { fontSize: 12 },
        },
        xAxis: {
          type: "category",
          data: horas.map((h) => `${h}h`),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: TEMA_GRAFICO.textoFraco, fontSize: 11 },
          splitArea: { show: true, areaStyle: { color: ["transparent"] } },
        },
        yAxis: {
          type: "category",
          data: DIAS_SEMANA_CURTOS,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: TEMA_GRAFICO.texto, fontSize: 11 },
        },
        visualMap: {
          min: 0,
          max: maximo,
          calculable: false,
          orient: "horizontal",
          left: "center",
          bottom: 0,
          itemHeight: 90,
          textStyle: { color: TEMA_GRAFICO.textoFraco, fontSize: 10 },
          inRange: { color: [TEMA_GRAFICO.superficie, TEMA_GRAFICO.tinta, TEMA_GRAFICO.primaria] },
        },
        series: [
          {
            type: "heatmap",
            data: celulas,
            itemStyle: { borderColor: TEMA_GRAFICO.branco, borderWidth: 2, borderRadius: 2 },
            emphasis: { itemStyle: { borderColor: TEMA_GRAFICO.profundo } },
          },
        ],
      }}
    />
  );
}

export function GraficoUnidades({
  nomes,
  valores,
}: {
  nomes: string[];
  valores: number[];
}) {
  return (
    <Grafico
      altura={Math.max(160, nomes.length * 44 + 48)}
      opcao={{
        grid: { left: 8, right: 16, top: 8, bottom: 24, containLabel: true },
        tooltip: dicaMoeda,
        xAxis: {
          ...eixoValor,
          splitLine: { lineStyle: { color: TEMA_GRAFICO.hairline } },
        },
        yAxis: {
          type: "category",
          data: nomes,
          inverse: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: TEMA_GRAFICO.texto, fontSize: 12 },
        },
        series: [
          {
            type: "bar",
            data: valores,
            itemStyle: { color: TEMA_GRAFICO.ciano, borderRadius: [0, 2, 2, 0] },
            barMaxWidth: 20,
            name: "Venda",
          },
        ],
      }}
    />
  );
}
