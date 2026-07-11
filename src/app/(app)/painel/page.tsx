import type { Metadata } from "next";
import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatarMesAno, formatarMoeda } from "@/lib/formato";
import { buscarMetas, calcularRitmo, hojeSaoPaulo, metaDaEmpresa, type Ritmo } from "@/lib/metas";
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
  let ritmo: Ritmo | null = null;
  let metaEmpresaValor: number | null = null;
  // saúde dos dados: última data coberta por unidade e há quantos dias
  let saude: { nome: string; dias: number | null }[] = [];

  if (isSupabaseConfigurado()) {
    const supabase = await createClient();
    const limites = await limitesDatas(supabase);
    if (limites) {
      // mês de referência = o mais recente com dados
      mesReferencia = limites.ultima.slice(0, 7);
      const { inicio, fim } = intervaloDoMes(mesReferencia);
      const [linhas, { data: dataImportacoes }, { data: dataUnidades }, metas] =
        await Promise.all([
          buscarVendasPeriodo(supabase, inicio, fim),
          supabase
            .from("importacao")
            .select("unidade_id, periodo_fim")
            .eq("status", "concluida")
            .eq("tipo_dado", "vendas")
            .order("periodo_fim", { ascending: false })
            .limit(300),
          supabase.from("unidade").select("id, nome").eq("ativa", true).order("nome"),
          buscarMetas(supabase, mesReferencia),
        ]);
      resumo = resumirVendas(linhas);

      const ultimaPorUnidade = new Map<string, string>();
      for (const imp of dataImportacoes ?? []) {
        if (!imp.periodo_fim) continue;
        const atual = ultimaPorUnidade.get(imp.unidade_id);
        if (!atual || imp.periodo_fim > atual) ultimaPorUnidade.set(imp.unidade_id, imp.periodo_fim);
      }
      const hoje = new Date(`${hojeSaoPaulo()}T00:00:00Z`).getTime();
      saude = (dataUnidades ?? [])
        .map((u) => {
          const ultima = ultimaPorUnidade.get(u.id);
          return {
            nome: u.nome,
            dias: ultima
              ? Math.max(0, Math.round((hoje - new Date(`${ultima}T00:00:00Z`).getTime()) / 86_400_000))
              : null,
          };
        })
        .sort((a, b) => (b.dias ?? 9999) - (a.dias ?? 9999));
      const metaEmpresa = metaDaEmpresa(metas);
      if (metaEmpresa) {
        metaEmpresaValor = metaEmpresa.valor;
        ritmo = calcularRitmo(metaEmpresa.valor, resumo.faturamento, mesReferencia);
      }
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
      valor: ritmo
        ? `${ritmo.atingidoPct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`
        : null,
      nota: ritmo
        ? ritmo.porDia !== null
          ? `para bater ${formatarMoeda(metaEmpresaValor!, true)}: ${formatarMoeda(ritmo.porDia)}/dia até o fim do mês`
          : ritmo.falta === 0
            ? "meta batida 🎯"
            : `faltaram ${formatarMoeda(ritmo.falta)}`
        : resumo
          ? "defina metas em Vendas → Metas"
          : "aguardando dados",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={nomeEmpresa ? `Painel Executivo · ${nomeEmpresa}` : "Painel Executivo"}
        titulo="Visão geral"
        descricao="O resumo do mês da sua operação — alimentado pelas planilhas importadas na Central de Dados."
      >
        {resumo ? (
          <Button asChild>
            <Link href="/reuniao">
              Modo Reunião <span aria-hidden>↗</span>
            </Link>
          </Button>
        ) : (
          <Button disabled title="Importe vendas para apresentar">
            Modo Reunião <span aria-hidden>↗</span>
          </Button>
        )}
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
            {saude.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma unidade ativa.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-[13px] text-muted-foreground">
                {saude.map((u) => (
                  <li key={u.nome} className="flex items-center justify-between gap-2">
                    <span className="truncate">{u.nome}</span>
                    {u.dias === null ? (
                      <Badge variant="neutro">sem dados</Badge>
                    ) : u.dias <= 3 ? (
                      <Badge variant="ok">em dia</Badge>
                    ) : u.dias <= 7 ? (
                      <Badge variant="atencao">há {u.dias} dias</Badge>
                    ) : (
                      <Badge variant="erro">há {u.dias} dias</Badge>
                    )}
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
