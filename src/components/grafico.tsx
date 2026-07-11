"use client";

import { useEffect, useRef } from "react";
// echarts/core com módulos registrados: só o que usamos entra no bundle
import * as echarts from "echarts/core";
import { BarChart, HeatmapChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption } from "echarts";

echarts.use([
  BarChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

/** Cores e tipografia dos gráficos — valores dos tokens (DESIGN.md / globals.css). */
export const TEMA_GRAFICO = {
  primaria: "#0a3eff",
  tinta: "#6f9dff",
  ciano: "#0099ff",
  profundo: "#10296e",
  texto: "#5f5f5f",
  textoFraco: "#999999",
  hairline: "#e2e2e2",
  superficie: "#f4f4f4",
  branco: "#ffffff",
  fonte: "Inter, -apple-system, 'Segoe UI', sans-serif",
};

export function Grafico({
  opcao,
  altura = 280,
}: {
  opcao: EChartsOption;
  altura?: number;
}) {
  const container = useRef<HTMLDivElement>(null);
  const instancia = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const grafico = echarts.init(container.current);
    instancia.current = grafico;
    const observador = new ResizeObserver(() => grafico.resize());
    observador.observe(container.current);
    return () => {
      observador.disconnect();
      grafico.dispose();
      instancia.current = null;
    };
  }, []);

  useEffect(() => {
    instancia.current?.setOption(
      { textStyle: { fontFamily: TEMA_GRAFICO.fonte }, ...opcao },
      true,
    );
  }, [opcao]);

  return <div ref={container} style={{ height: altura }} />;
}
