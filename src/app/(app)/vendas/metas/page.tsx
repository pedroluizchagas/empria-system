import type { Metadata } from "next";
import Link from "next/link";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatarMesAno, formatarMoeda } from "@/lib/formato";
import { buscarMetas, hojeSaoPaulo, metaDaEmpresa, metaDaUnidade } from "@/lib/metas";
import { isSupabaseConfigurado } from "@/lib/supabase/config";
import { ehGestor, obterContexto } from "@/lib/supabase/contexto";
import { createClient } from "@/lib/supabase/server";
import { buscarVendasPeriodo, intervaloDoMes, limitesDatas, mesesEntre } from "@/lib/vendas";
import { FiltrosVendas } from "../filtros";
import { MetaInput } from "./meta-input";

export const metadata: Metadata = { title: "Metas" };

function proximoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  return mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;

  if (!isSupabaseConfigurado()) {
    return (
      <>
        <PageHeader eyebrow="Vendas & Metas" titulo="Metas" />
        <EmptyState
          icon={Target}
          titulo="Metas em cascata"
          descricao="Modo prévia — configure o Supabase para definir metas por empresa, unidade e vendedor."
        />
      </>
    );
  }

  const contexto = await obterContexto();
  const gestor = ehGestor(contexto?.pessoa ?? null);
  const supabase = await createClient();

  // meses selecionáveis: próximo mês, mês corrente e o histórico com vendas
  const atual = hojeSaoPaulo().slice(0, 7);
  const limites = await limitesDatas(supabase);
  const meses = [
    ...new Set([
      proximoMes(atual),
      atual,
      ...(limites ? mesesEntre(limites.primeira, limites.ultima) : []),
    ]),
  ].sort((a, b) => (a < b ? 1 : -1));
  const mes = params.mes && meses.includes(params.mes) ? params.mes : atual;
  const { inicio, fim } = intervaloDoMes(mes);

  const { data: dataUnidades } = await supabase
    .from("unidade")
    .select("id, nome")
    .eq("ativa", true)
    .order("nome");
  const unidades = dataUnidades ?? [];

  const [metas, linhas] = await Promise.all([
    buscarMetas(supabase, mes),
    buscarVendasPeriodo(supabase, inicio, fim),
  ]);

  // vendedores que aparecem nas vendas do mês, por unidade
  const vendedoresPorUnidade = new Map<string, Set<string>>();
  for (const linha of linhas) {
    if (!linha.vendedor) continue;
    if (!vendedoresPorUnidade.has(linha.unidade_id)) {
      vendedoresPorUnidade.set(linha.unidade_id, new Set());
    }
    vendedoresPorUnidade.get(linha.unidade_id)!.add(linha.vendedor);
  }

  const metaEmpresa = metaDaEmpresa(metas);
  const somaUnidades = unidades.reduce(
    (soma, u) => soma + (metaDaUnidade(metas, u.id)?.valor ?? 0),
    0,
  );

  if (!gestor) {
    return (
      <>
        <PageHeader eyebrow="Vendas & Metas" titulo="Metas" />
        <Card>
          <p className="text-sm text-muted-foreground">
            Definir metas é uma ação de proprietário ou gerente. A sua meta e o
            seu atingimento aparecem no painel de Vendas.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Vendas & Metas"
        titulo="Metas"
        descricao="Cascata mensal: empresa → unidade → vendedor. O ritmo de atingimento aparece no Painel e em Vendas."
      >
        <FiltrosVendas meses={meses} mesAtual={mes} unidades={[]} unidadeAtual="" base="/vendas/metas" />
        <Button asChild variant="secondary">
          <Link href="/vendas">Voltar a Vendas</Link>
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <Card>
          <CardLabel>Meta da empresa · {formatarMesAno(mes)}</CardLabel>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <MetaInput
              anoMes={mes}
              unidadeId={null}
              vendedor={null}
              valorAtual={metaEmpresa?.valor ?? null}
            />
            {metaEmpresa && somaUnidades > 0 && somaUnidades !== metaEmpresa.valor && (
              <p className="text-[13px] text-warning">
                As metas das unidades somam {formatarMoeda(somaUnidades)} —{" "}
                {somaUnidades > metaEmpresa.valor ? "acima" : "abaixo"} da meta da empresa.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardLabel>Metas por unidade</CardLabel>
          {unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Cadastre unidades na Administração para distribuir metas.
            </p>
          ) : (
            <ul className="mt-1 flex flex-col">
              {unidades.map((u, i) => (
                <li
                  key={u.id}
                  className={`flex flex-wrap items-center justify-between gap-3 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <span className="text-sm font-medium">{u.nome}</span>
                  <MetaInput
                    anoMes={mes}
                    unidadeId={u.id}
                    vendedor={null}
                    valorAtual={metaDaUnidade(metas, u.id)?.valor ?? null}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardLabel>Metas por vendedor</CardLabel>
          {vendedoresPorUnidade.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              Os vendedores aparecem aqui automaticamente quando as planilhas do
              mês trazem a coluna de vendedor.
            </p>
          ) : (
            <div className="mt-1 flex flex-col gap-4">
              {unidades
                .filter((u) => vendedoresPorUnidade.has(u.id))
                .map((u) => (
                  <div key={u.id}>
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.02em] text-muted-2">
                      {u.nome}
                    </p>
                    <ul className="flex flex-col">
                      {[...vendedoresPorUnidade.get(u.id)!].sort().map((vendedor, i) => (
                        <li
                          key={vendedor}
                          className={`flex flex-wrap items-center justify-between gap-3 py-2 ${i > 0 ? "border-t border-border" : ""}`}
                        >
                          <span className="text-sm">{vendedor}</span>
                          <MetaInput
                            anoMes={mes}
                            unidadeId={u.id}
                            vendedor={vendedor}
                            valorAtual={
                              metas.find(
                                (m) => m.unidade_id === u.id && m.vendedor === vendedor,
                              )?.valor ?? null
                            }
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
