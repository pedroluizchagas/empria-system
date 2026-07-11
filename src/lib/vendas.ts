import type { SupabaseClient } from "@supabase/supabase-js";

/** Consultas e agregações de vendas — usadas em /vendas e no Painel Executivo. */

export interface LinhaVenda {
  data: string; // yyyy-mm-dd
  hora: string | null; // HH:MM:SS
  valor: number;
  quantidade: number | null;
  cupom: string | null;
  vendedor: string | null;
  unidade_id: string;
}

const PAGINA = 1000;
const MAXIMO_LINHAS = 60_000;

export async function buscarVendasPeriodo(
  supabase: SupabaseClient,
  inicio: string,
  fim: string,
  unidadeId?: string,
): Promise<LinhaVenda[]> {
  const linhas: LinhaVenda[] = [];

  for (let de = 0; de < MAXIMO_LINHAS; de += PAGINA) {
    let consulta = supabase
      .from("fato_venda")
      .select("data, hora, valor, quantidade, cupom, vendedor, unidade_id")
      .gte("data", inicio)
      .lte("data", fim)
      .order("data")
      .order("id")
      .range(de, de + PAGINA - 1);
    if (unidadeId) consulta = consulta.eq("unidade_id", unidadeId);

    const { data } = await consulta;
    if (!data || data.length === 0) break;
    linhas.push(...(data as LinhaVenda[]));
    if (data.length < PAGINA) break;
  }

  return linhas;
}

/** Primeiro e último dia com venda registrada (null = sem dados). */
export async function limitesDatas(
  supabase: SupabaseClient,
): Promise<{ primeira: string; ultima: string } | null> {
  const [{ data: primeira }, { data: ultima }] = await Promise.all([
    supabase.from("fato_venda").select("data").order("data").limit(1).maybeSingle(),
    supabase
      .from("fato_venda")
      .select("data")
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!primeira || !ultima) return null;
  return { primeira: primeira.data, ultima: ultima.data };
}

/** Meses "aaaa-mm" entre duas datas, do mais recente para o mais antigo. */
export function mesesEntre(primeira: string, ultima: string): string[] {
  const meses: string[] = [];
  let [ano, mes] = ultima.slice(0, 7).split("-").map(Number);
  const [anoIni, mesIni] = primeira.slice(0, 7).split("-").map(Number);
  while (ano > anoIni || (ano === anoIni && mes >= mesIni)) {
    meses.push(`${ano}-${String(mes).padStart(2, "0")}`);
    mes -= 1;
    if (mes === 0) {
      mes = 12;
      ano -= 1;
    }
  }
  return meses;
}

export function intervaloDoMes(anoMes: string): { inicio: string; fim: string } {
  const [ano, mes] = anoMes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return {
    inicio: `${anoMes}-01`,
    fim: `${anoMes}-${String(ultimoDia).padStart(2, "0")}`,
  };
}

export function mesAnterior(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  return mes === 1
    ? `${ano - 1}-12`
    : `${ano}-${String(mes - 1).padStart(2, "0")}`;
}

export interface ResumoVendas {
  faturamento: number;
  diasComVenda: number;
  mediaPorDia: number;
  /** null = coluna não importada, análise não desbloqueada (princípio 6). */
  pecas: number | null;
  atendimentos: number | null;
  ticketMedio: number | null;
  pa: number | null;
  precoMedioPeca: number | null;
}

export function resumirVendas(linhas: LinhaVenda[]): ResumoVendas {
  let faturamento = 0;
  let pecas = 0;
  let temQuantidade = false;
  const dias = new Set<string>();
  const cupons = new Set<string>();

  for (const linha of linhas) {
    faturamento += linha.valor;
    dias.add(linha.data);
    if (linha.quantidade !== null) {
      temQuantidade = true;
      pecas += linha.quantidade;
    }
    if (linha.cupom !== null) cupons.add(`${linha.data}|${linha.cupom}`);
  }

  const atendimentos = cupons.size > 0 ? cupons.size : null;
  const totalPecas = temQuantidade ? pecas : null;

  return {
    faturamento,
    diasComVenda: dias.size,
    mediaPorDia: dias.size > 0 ? faturamento / dias.size : 0,
    pecas: totalPecas,
    atendimentos,
    ticketMedio: atendimentos ? faturamento / atendimentos : null,
    pa: atendimentos && totalPecas !== null ? totalPecas / atendimentos : null,
    precoMedioPeca: totalPecas ? faturamento / totalPecas : null,
  };
}

/** Dia da semana 0–6 (dom–sáb) de uma data yyyy-mm-dd, sem efeito de fuso. */
export function diaDaSemana(data: string): number {
  return new Date(`${data}T00:00:00Z`).getUTCDay();
}
