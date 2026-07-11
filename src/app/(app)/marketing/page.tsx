import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabela, Th, Td } from "@/components/ui/table";
import { ROTULO_STATUS_CONTEUDO, STATUS_CONTEUDO } from "@/lib/dominio";
import { formatarMesAno, formatarMoeda, formatarNumero } from "@/lib/formato";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { CardPauta, NovaPauta, type Pauta } from "./conteudo";
import { intervaloDoMes, mesesEntre } from "@/lib/vendas";
import { FiltrosVendas } from "../vendas/filtros";

export const metadata: Metadata = { title: "Marketing" };

interface LinhaTrafego {
  data: string;
  campanha: string;
  investimento: number;
  cliques: number | null;
  impressoes: number | null;
  conversoes: number | null;
  receita: number | null;
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;

  const vazio = (
    <EmptyState
      icon={Megaphone}
      titulo="Investimento × retorno, sem análise manual"
      descricao="Exporte o relatório do Gerenciador de Anúncios (Meta) ou do Google Ads e solte na Central de Dados como tráfego pago — CPC, CPM, conversões e ROAS aparecem aqui."
      className="min-h-96"
    >
      <Button asChild>
        <Link href="/dados">Importar tráfego pago</Link>
      </Button>
    </EmptyState>
  );

  if (!isSupabaseConfigurado()) {
    return (
      <>
        <PageHeader eyebrow="Marketing" titulo="Tráfego pago" descricao="Modo prévia." />
        {vazio}
      </>
    );
  }

  const supabase = await createClient();
  const contexto = await obterContexto();
  const papel = contexto?.pessoa?.papel;
  const editor = !!papel && ["proprietario", "gerente", "lider"].includes(papel);

  const [{ data: primeira }, { data: ultima }, { data: dataConteudos }, { data: dataPessoas }] =
    await Promise.all([
      supabase.from("fato_trafego").select("data").order("data").limit(1).maybeSingle(),
      supabase
        .from("fato_trafego")
        .select("data")
        .order("data", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("conteudo")
        .select("id, titulo, canal, status, data_publicacao, responsavel:pessoa!conteudo_responsavel_id_fkey(nome)")
        .order("data_publicacao", { ascending: true, nullsFirst: false })
        .limit(200),
      supabase.from("pessoa").select("id, nome").order("nome"),
    ]);
  const pautas = (dataConteudos as unknown as Pauta[]) ?? [];
  const pessoas = dataPessoas ?? [];

  const quadroConteudo = (
    <section className="mt-8">
      <h2 className="mb-3 font-display text-xl font-medium tracking-[-0.02em]">
        Calendário de conteúdo
      </h2>
      {editor && (
        <Card className="mb-4">
          <CardLabel>Nova pauta</CardLabel>
          <NovaPauta pessoas={pessoas} />
        </Card>
      )}
      <div className="grid grid-cols-4 gap-4 max-[1000px]:grid-cols-2 max-[560px]:grid-cols-1">
        {STATUS_CONTEUDO.map((status) => {
          const coluna = pautas.filter((pt) => pt.status === status);
          return (
            <div key={status} className="rounded-card border border-border bg-surface-2/60 p-3">
              <p className="mb-2 flex items-center justify-between text-[10px] font-medium uppercase tracking-[0.02em] text-muted-2">
                {ROTULO_STATUS_CONTEUDO[status]}
                <span>{coluna.length}</span>
              </p>
              <div className="flex flex-col gap-2">
                {coluna.length === 0 ? (
                  <p className="py-3 text-center text-[12px] text-muted-3">—</p>
                ) : (
                  coluna.map((pt) => <CardPauta key={pt.id} pauta={pt} editor={editor} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  if (!primeira || !ultima) {
    return (
      <>
        <PageHeader
          eyebrow="Marketing"
          titulo="Marketing"
          descricao="Nenhum relatório de anúncios importado ainda — a pauta de conteúdo já funciona abaixo."
        />
        {vazio}
        {quadroConteudo}
      </>
    );
  }

  const meses = mesesEntre(primeira.data, ultima.data);
  const mes = params.mes && meses.includes(params.mes) ? params.mes : meses[0];
  const { inicio, fim } = intervaloDoMes(mes);

  const [{ data: dataTrafego }, { data: dataVendas }] = await Promise.all([
    supabase
      .from("fato_trafego")
      .select("data, campanha, investimento, cliques, impressoes, conversoes, receita")
      .gte("data", inicio)
      .lte("data", fim)
      .limit(10000),
    supabase
      .from("fato_venda")
      .select("valor")
      .gte("data", inicio)
      .lte("data", fim)
      .limit(50000),
  ]);
  const linhas = (dataTrafego as LinhaTrafego[]) ?? [];
  const faturamento = (dataVendas ?? []).reduce((soma, v) => soma + v.valor, 0);

  // totais e agregação por campanha
  let investimento = 0;
  let cliques = 0, temCliques = false;
  let impressoes = 0, temImpressoes = false;
  let conversoes = 0, temConversoes = false;
  let receita = 0, temReceita = false;
  const porCampanha = new Map<string, { investimento: number; cliques: number; conversoes: number; receita: number }>();

  for (const l of linhas) {
    investimento += l.investimento;
    if (l.cliques !== null) { cliques += l.cliques; temCliques = true; }
    if (l.impressoes !== null) { impressoes += l.impressoes; temImpressoes = true; }
    if (l.conversoes !== null) { conversoes += l.conversoes; temConversoes = true; }
    if (l.receita !== null) { receita += l.receita; temReceita = true; }
    const c = porCampanha.get(l.campanha) ?? { investimento: 0, cliques: 0, conversoes: 0, receita: 0 };
    c.investimento += l.investimento;
    c.cliques += l.cliques ?? 0;
    c.conversoes += l.conversoes ?? 0;
    c.receita += l.receita ?? 0;
    porCampanha.set(l.campanha, c);
  }
  const campanhas = [...porCampanha.entries()]
    .map(([nome, c]) => ({ nome, ...c }))
    .sort((a, b) => b.investimento - a.investimento);

  const roas = temReceita && investimento > 0 ? receita / investimento : null;
  const cpc = temCliques && cliques > 0 ? investimento / cliques : null;
  const cpm = temImpressoes && impressoes > 0 ? (investimento / impressoes) * 1000 : null;

  const kpis = [
    { rotulo: "Investimento", valor: formatarMoeda(investimento), nota: `${linhas.length.toLocaleString("pt-BR")} registros` },
    {
      rotulo: "ROAS",
      valor: roas !== null ? `${roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×` : "—",
      nota: roas !== null ? `receita de ${formatarMoeda(receita, true)}` : "importe a coluna de receita para desbloquear",
    },
    {
      rotulo: "CPC",
      valor: cpc !== null ? formatarMoeda(cpc) : "—",
      nota: cpc !== null ? `${formatarNumero(cliques)} cliques` : "importe a coluna de cliques",
    },
    {
      rotulo: "Conversões",
      valor: temConversoes ? formatarNumero(conversoes) : "—",
      nota: cpm !== null ? `CPM ${formatarMoeda(cpm)}` : temConversoes ? "" : "importe a coluna de conversões",
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        titulo="Tráfego pago"
        descricao="Investimento e retorno dos anúncios, lado a lado com a venda do período."
      >
        <FiltrosVendas meses={meses} mesAtual={mes} unidades={[]} unidadeAtual="" base="/marketing" />
      </PageHeader>

      <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2">
        {kpis.map((kpi) => (
          <Card key={kpi.rotulo} className="p-5">
            <CardLabel>{kpi.rotulo}</CardLabel>
            <p className="font-display text-[27px] font-medium leading-tight tracking-[-0.02em]">
              {kpi.valor}
            </p>
            {kpi.nota && <p className="mt-1 text-[12px] text-muted-3">{kpi.nota}</p>}
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <CardLabel>Investimento × venda · {formatarMesAno(mes)}</CardLabel>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatarMoeda(investimento)} investidos em anúncios ·{" "}
          {faturamento > 0
            ? `${formatarMoeda(faturamento, faturamento >= 100_000)} vendidos no período (anúncios = ${((investimento / faturamento) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da venda)`
            : "sem vendas importadas neste mês para comparar"}
          .
        </p>
      </Card>

      <Card className="mt-4">
        <CardLabel>Por campanha</CardLabel>
        <Tabela className="mt-2">
          <thead>
            <tr>
              <Th>Campanha</Th>
              <Th className="text-right">Investimento</Th>
              <Th className="text-right">Cliques</Th>
              <Th className="text-right">Conversões</Th>
              <Th className="text-right">Receita</Th>
              <Th className="text-right">ROAS</Th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((c) => (
              <tr key={c.nome}>
                <Td className="max-w-72 truncate font-medium" title={c.nome}>
                  {c.nome}
                </Td>
                <Td className="text-right tabular-nums">{formatarMoeda(c.investimento)}</Td>
                <Td className="text-right tabular-nums">
                  {c.cliques > 0 ? formatarNumero(c.cliques) : "—"}
                </Td>
                <Td className="text-right tabular-nums">
                  {c.conversoes > 0 ? formatarNumero(c.conversoes) : "—"}
                </Td>
                <Td className="text-right tabular-nums">
                  {c.receita > 0 ? formatarMoeda(c.receita) : "—"}
                </Td>
                <Td className="text-right tabular-nums">
                  {c.receita > 0 && c.investimento > 0
                    ? `${(c.receita / c.investimento).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×`
                    : "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Card>

      {quadroConteudo}
    </>
  );
}
