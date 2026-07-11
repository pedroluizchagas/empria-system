"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Printer, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  GraficoDiaSemana,
  GraficoUnidades,
  GraficoVendaPorDia,
  HeatmapDiaHora,
} from "@/app/(app)/vendas/graficos";
import { cn } from "@/lib/utils";

/**
 * Modo Reunião (ESCOPO §8): páginas navegáveis, tipografia grande, sem menus.
 * Na tela, um slide por vez (setas/espaço navegam); na impressão, todos os
 * slides saem em sequência — "Exportar PDF" é imprimir para PDF.
 */

export interface DadosApresentacao {
  empresa: string;
  mesRotulo: string;
  unidadeRotulo: string;
  geradoEm: string;
  kpis: { rotulo: string; valor: string; detalhe?: string }[];
  dias: string[];
  porDia: number[];
  porDiaSemana: number[];
  temHora: boolean;
  horas: number[];
  celulas: [number, number, number][];
  maximoCelula: number;
  unidades: { nome: string; valor: number }[];
  destaques: string[];
  atencao: string[];
  urlVoltar: string;
}

function TituloSlide({ eyebrow, titulo }: { eyebrow: string; titulo: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-2">
        {eyebrow}
      </p>
      <h2 className="font-display text-[44px] font-bold leading-[1.1] tracking-[-0.03em] max-[700px]:text-[32px]">
        {titulo}
      </h2>
    </div>
  );
}

export function Apresentacao(dados: DadosApresentacao) {
  const slides: { chave: string; conteudo: React.ReactNode }[] = [];

  slides.push({
    chave: "capa",
    conteudo: (
      <div className="flex h-full flex-col items-start justify-center">
        <Logo />
        <h1 className="mt-10 font-display text-[64px] font-bold leading-[1.05] tracking-[-0.03em] max-[700px]:text-[40px]">
          Resultados
          <br />
          <span className="text-primary">{dados.mesRotulo}</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          {dados.empresa} · {dados.unidadeRotulo}
        </p>
        <p className="mt-1 text-sm text-muted-3">Gerado em {dados.geradoEm} pelo Empria</p>
      </div>
    ),
  });

  slides.push({
    chave: "visao-geral",
    conteudo: (
      <div className="flex h-full flex-col justify-center">
        <TituloSlide eyebrow={dados.mesRotulo} titulo="Visão geral" />
        <div className="grid grid-cols-2 gap-5 max-[700px]:grid-cols-1">
          {dados.kpis.map((kpi) => (
            <div key={kpi.rotulo} className="rounded-card border border-border bg-surface p-7">
              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-2">
                {kpi.rotulo}
              </p>
              <p className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] max-[700px]:text-[30px]">
                {kpi.valor}
              </p>
              {kpi.detalhe && <p className="mt-2 text-sm text-muted-foreground">{kpi.detalhe}</p>}
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push({
    chave: "por-dia",
    conteudo: (
      <div className="flex h-full flex-col justify-center">
        <TituloSlide eyebrow={dados.mesRotulo} titulo="Venda por dia" />
        <div className="rounded-card border border-border bg-surface p-6">
          <GraficoVendaPorDia dias={dados.dias} valores={dados.porDia} />
        </div>
      </div>
    ),
  });

  slides.push({
    chave: "quando",
    conteudo: (
      <div className="flex h-full flex-col justify-center">
        <TituloSlide eyebrow={dados.mesRotulo} titulo="Quando se vende" />
        <div
          className={cn(
            "grid gap-5",
            dados.temHora ? "grid-cols-2 max-[900px]:grid-cols-1" : "grid-cols-1",
          )}
        >
          <div className="rounded-card border border-border bg-surface p-6">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-2">
              Por dia da semana
            </p>
            <GraficoDiaSemana valores={dados.porDiaSemana} />
          </div>
          {dados.temHora && (
            <div className="rounded-card border border-border bg-surface p-6">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-2">
                Mapa de calor · dia × hora
              </p>
              <HeatmapDiaHora
                horas={dados.horas}
                celulas={dados.celulas}
                maximo={dados.maximoCelula}
              />
            </div>
          )}
        </div>
      </div>
    ),
  });

  if (dados.unidades.length > 1) {
    slides.push({
      chave: "unidades",
      conteudo: (
        <div className="flex h-full flex-col justify-center">
          <TituloSlide eyebrow={dados.mesRotulo} titulo="Onde se vende" />
          <div className="rounded-card border border-border bg-surface p-6">
            <GraficoUnidades
              nomes={dados.unidades.map((u) => u.nome)}
              valores={dados.unidades.map((u) => u.valor)}
            />
          </div>
        </div>
      ),
    });
  }

  slides.push({
    chave: "leitura",
    conteudo: (
      <div className="flex h-full flex-col justify-center">
        <TituloSlide eyebrow={dados.mesRotulo} titulo="Leitura do mês" />
        <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
          <div className="rounded-card border border-border bg-surface p-7">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-success">
              Destaques
            </p>
            <ul className="flex flex-col gap-3">
              {dados.destaques.map((d) => (
                <li key={d} className="flex gap-3 text-[17px] leading-snug">
                  <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-success" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-card border border-border bg-surface p-7">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.08em] text-warning">
              Pontos de atenção
            </p>
            {dados.atencao.length === 0 ? (
              <p className="text-[17px] text-muted-foreground">
                Nenhum alerta neste período.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dados.atencao.map((a) => (
                  <li key={a} className="flex gap-3 text-[17px] leading-snug">
                    <span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-warning" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    ),
  });

  const [atual, setAtual] = useState(0);
  const total = slides.length;

  const navegar = useCallback(
    (delta: number) => {
      setAtual((n) => Math.min(total - 1, Math.max(0, n + delta)));
    },
    [total],
  );

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") navegar(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") navegar(-1);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [navegar]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Na tela: pilha absoluta (todos com tamanho real, gráficos sempre medidos);
          na impressão: fluxo normal, um slide por página. */}
      <div className="relative h-screen overflow-hidden print:static print:h-auto print:overflow-visible">
        {slides.map((slide, i) => (
          <section
            key={slide.chave}
            aria-hidden={i !== atual}
            className={cn(
              "absolute inset-0 px-[8vw] py-14 transition-opacity duration-300",
              i === atual ? "opacity-100" : "pointer-events-none opacity-0",
              "print:static print:h-[190mm] print:break-after-page print:px-10 print:py-8 print:opacity-100",
            )}
          >
            {slide.conteudo}
          </section>
        ))}
      </div>

      <footer className="fixed inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-border bg-surface/90 px-5 py-3 backdrop-blur print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link href={dados.urlVoltar}>
            <X className="size-4" strokeWidth={1.5} /> Sair
          </Link>
        </Button>
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navegar(-1)}
            disabled={atual === 0}
            aria-label="Slide anterior"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} />
          </Button>
          <span className="min-w-14 text-center text-[13px] tabular-nums text-muted-foreground">
            {atual + 1} / {total}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navegar(1)}
            disabled={atual === total - 1}
            aria-label="Próximo slide"
          >
            <ArrowRight className="size-4" strokeWidth={1.5} />
          </Button>
        </div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" strokeWidth={1.5} /> Exportar PDF
        </Button>
      </footer>
    </div>
  );
}
