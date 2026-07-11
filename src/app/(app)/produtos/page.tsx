import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabela, Th, Td } from "@/components/ui/table";
import { formatarData, formatarMoeda, formatarNumero } from "@/lib/formato";
import { hojeSaoPaulo } from "@/lib/metas";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Produto & Estoque" };

interface LinhaEstoque {
  unidade_id: string;
  produto: string;
  quantidade: number;
  tamanho: string | null;
  cor: string | null;
  custo: number | null;
}

const DIAS_GIRO = 90;

export default async function ProdutosPage() {
  const vazio = (
    <EmptyState
      icon={Package}
      titulo="O que repor, o que remarcar, o que não comprar de novo"
      descricao="Solte a planilha de posição de estoque na Central de Dados — giro, cobertura em dias, curva ABC e grade tamanho/cor aparecem aqui."
      className="min-h-96"
    >
      <Button asChild>
        <Link href="/dados">Importar posição de estoque</Link>
      </Button>
    </EmptyState>
  );

  if (!isSupabaseConfigurado()) {
    return (
      <>
        <PageHeader eyebrow="Produto & Estoque" titulo="Produtos" descricao="Modo prévia." />
        {vazio}
      </>
    );
  }

  const supabase = await createClient();

  // posição mais recente por unidade (cada importação de estoque é um retrato)
  const { data: importacoesEstoque } = await supabase
    .from("importacao")
    .select("id, unidade_id, criado_em, unidade(nome)")
    .eq("tipo_dado", "estoque")
    .eq("status", "concluida")
    .order("criado_em", { ascending: false })
    .limit(50);

  const ultimaPorUnidade = new Map<string, { id: string; criado_em: string; nome: string }>();
  for (const imp of importacoesEstoque ?? []) {
    if (!ultimaPorUnidade.has(imp.unidade_id)) {
      ultimaPorUnidade.set(imp.unidade_id, {
        id: imp.id,
        criado_em: imp.criado_em,
        nome: (imp.unidade as unknown as { nome: string } | null)?.nome ?? "—",
      });
    }
  }
  const idsPosicao = [...ultimaPorUnidade.values()].map((i) => i.id);

  if (idsPosicao.length === 0) {
    return (
      <>
        <PageHeader
          eyebrow="Produto & Estoque"
          titulo="Produtos"
          descricao="Nenhuma posição de estoque importada ainda."
        />
        {vazio}
      </>
    );
  }

  // estoque das posições vigentes + vendas com produto dos últimos 90 dias
  const hoje = hojeSaoPaulo();
  const inicioGiro = new Date(new Date(`${hoje}T00:00:00Z`).getTime() - DIAS_GIRO * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const estoque: LinhaEstoque[] = [];
  for (let de = 0; de < 40_000; de += 1000) {
    const { data } = await supabase
      .from("fato_estoque")
      .select("unidade_id, produto, quantidade, tamanho, cor, custo")
      .in("importacao_id", idsPosicao)
      .order("id")
      .range(de, de + 999);
    if (!data || data.length === 0) break;
    estoque.push(...(data as LinhaEstoque[]));
    if (data.length < 1000) break;
  }

  const vendas: { produto: string | null; quantidade: number | null; valor: number }[] = [];
  for (let de = 0; de < 60_000; de += 1000) {
    const { data } = await supabase
      .from("fato_venda")
      .select("produto, quantidade, valor")
      .gte("data", inicioGiro)
      .not("produto", "is", null)
      .order("id")
      .range(de, de + 999);
    if (!data || data.length === 0) break;
    vendas.push(...data);
    if (data.length < 1000) break;
  }

  // ---- agregações ----
  let pecas = 0;
  let valorCusto = 0;
  let temCusto = false;
  const porProduto = new Map<string, { estoque: number; custo: number }>();
  const porTamanho = new Map<string, number>();
  const porCor = new Map<string, number>();

  for (const e of estoque) {
    pecas += e.quantidade;
    if (e.custo !== null) {
      valorCusto += e.custo * e.quantidade;
      temCusto = true;
    }
    const p = porProduto.get(e.produto) ?? { estoque: 0, custo: 0 };
    p.estoque += e.quantidade;
    p.custo += (e.custo ?? 0) * e.quantidade;
    porProduto.set(e.produto, p);
    if (e.tamanho) porTamanho.set(e.tamanho, (porTamanho.get(e.tamanho) ?? 0) + e.quantidade);
    if (e.cor) porCor.set(e.cor, (porCor.get(e.cor) ?? 0) + e.quantidade);
  }

  const vendaPorProduto = new Map<string, { valor: number; pecas: number }>();
  let faturamento90 = 0;
  for (const v of vendas) {
    if (!v.produto) continue;
    const p = vendaPorProduto.get(v.produto) ?? { valor: 0, pecas: 0 };
    p.valor += v.valor;
    p.pecas += v.quantidade ?? 0;
    vendaPorProduto.set(v.produto, p);
    faturamento90 += v.valor;
  }

  // curva ABC pelo faturamento de 90 dias (A ≤ 80%, B ≤ 95%, C resto)
  const classePorProduto = new Map<string, "A" | "B" | "C">();
  let acumulado = 0;
  for (const [produto, v] of [...vendaPorProduto.entries()].sort((a, b) => b[1].valor - a[1].valor)) {
    acumulado += v.valor;
    const pct = faturamento90 > 0 ? acumulado / faturamento90 : 1;
    classePorProduto.set(produto, pct <= 0.8 ? "A" : pct <= 0.95 ? "B" : "C");
  }

  const linhasTabela = [...porProduto.entries()]
    .map(([produto, e]) => {
      const venda = vendaPorProduto.get(produto);
      const pecasDia = venda && venda.pecas > 0 ? venda.pecas / DIAS_GIRO : null;
      return {
        produto,
        estoque: e.estoque,
        venda90: venda?.valor ?? 0,
        pecasDia,
        cobertura: pecasDia ? e.estoque / pecasDia : null,
        classe: classePorProduto.get(produto) ?? null,
      };
    })
    .sort((a, b) => b.venda90 - a.venda90 || b.estoque - a.estoque)
    .slice(0, 100);

  const semGiro = [...porProduto.keys()].filter((p) => !vendaPorProduto.has(p)).length;
  const posicoes = [...ultimaPorUnidade.values()];

  const kpis = [
    { rotulo: "Peças em estoque", valor: formatarNumero(pecas), nota: `${porProduto.size.toLocaleString("pt-BR")} produtos` },
    {
      rotulo: "Valor de custo",
      valor: temCusto ? formatarMoeda(valorCusto, valorCusto >= 100_000) : "—",
      nota: temCusto ? "estoque a preço de custo" : "importe a coluna de custo para desbloquear",
    },
    {
      rotulo: "Sem giro (90 dias)",
      valor: formatarNumero(semGiro),
      nota: "produtos em estoque sem nenhuma venda",
    },
    {
      rotulo: "Posições vigentes",
      valor: String(posicoes.length),
      nota: posicoes
        .map((p) => `${p.nome} · ${formatarData(p.criado_em.slice(0, 10))}`)
        .slice(0, 2)
        .join(" — "),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Produto & Estoque"
        titulo="Produtos"
        descricao={`Giro dos últimos ${DIAS_GIRO} dias cruzado com a posição de estoque mais recente de cada unidade.`}
      />

      <div className="grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2">
        {kpis.map((kpi) => (
          <Card key={kpi.rotulo} className="p-5">
            <CardLabel>{kpi.rotulo}</CardLabel>
            <p className="font-display text-[27px] font-medium leading-tight tracking-[-0.02em]">
              {kpi.valor}
            </p>
            <p className="mt-1 text-[12px] text-muted-3">{kpi.nota}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardLabel>Curva ABC · giro e cobertura</CardLabel>
        {vendaPorProduto.size === 0 && (
          <p className="mt-1 mb-2 text-[13px] text-muted-foreground">
            Sem vendas com coluna de produto nos últimos {DIAS_GIRO} dias — importe
            vendas com produto para ver giro, cobertura e classe ABC.
          </p>
        )}
        <Tabela className="mt-2">
          <thead>
            <tr>
              <Th>Produto</Th>
              <Th className="text-right">Estoque</Th>
              <Th className="text-right">Venda {DIAS_GIRO}d</Th>
              <Th className="text-right">Peças/dia</Th>
              <Th className="text-right">Cobertura</Th>
              <Th>Classe</Th>
            </tr>
          </thead>
          <tbody>
            {linhasTabela.map((l) => (
              <tr key={l.produto}>
                <Td className="max-w-72 truncate font-medium" title={l.produto}>
                  {l.produto}
                </Td>
                <Td className="text-right tabular-nums">{formatarNumero(l.estoque)}</Td>
                <Td className="text-right tabular-nums">
                  {l.venda90 > 0 ? formatarMoeda(l.venda90) : "—"}
                </Td>
                <Td className="text-right tabular-nums">
                  {l.pecasDia !== null
                    ? l.pecasDia.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
                    : "—"}
                </Td>
                <Td className="text-right tabular-nums">
                  {l.cobertura !== null
                    ? `${Math.round(l.cobertura).toLocaleString("pt-BR")} dias`
                    : "—"}
                </Td>
                <Td>
                  {l.classe ? (
                    <Badge variant={l.classe === "A" ? "ok" : l.classe === "B" ? "info" : "neutro"}>
                      {l.classe}
                    </Badge>
                  ) : (
                    <Badge variant="atencao">sem giro</Badge>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      </Card>

      {(porTamanho.size > 0 || porCor.size > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-4 max-[900px]:grid-cols-1">
          {porTamanho.size > 0 && (
            <Card>
              <CardLabel>Grade · peças por tamanho</CardLabel>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {[...porTamanho.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([tamanho, qtd]) => (
                    <li key={tamanho} className="flex items-center justify-between gap-3">
                      <span>{tamanho}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatarNumero(qtd)}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
          {porCor.size > 0 && (
            <Card>
              <CardLabel>Grade · peças por cor</CardLabel>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                {[...porCor.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 12)
                  .map(([cor, qtd]) => (
                    <li key={cor} className="flex items-center justify-between gap-3">
                      <span>{cor}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {formatarNumero(qtd)}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
