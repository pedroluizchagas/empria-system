import type { SupabaseClient } from "@supabase/supabase-js";

/** Metas em cascata (Fase 2): empresa → unidade → vendedor, sempre mensais. */

export interface Meta {
  id: string;
  empresa_id: string;
  /** date do banco: "2026-07-01". */
  ano_mes: string;
  unidade_id: string | null;
  vendedor: string | null;
  valor: number;
}

export async function buscarMetas(
  supabase: SupabaseClient,
  anoMes: string,
): Promise<Meta[]> {
  const { data } = await supabase.from("meta").select("*").eq("ano_mes", `${anoMes}-01`);
  return (data as Meta[]) ?? [];
}

export function metaDaEmpresa(metas: Meta[]): Meta | null {
  return metas.find((m) => m.unidade_id === null && m.vendedor === null) ?? null;
}

export function metaDaUnidade(metas: Meta[], unidadeId: string): Meta | null {
  return metas.find((m) => m.unidade_id === unidadeId && m.vendedor === null) ?? null;
}

/** Hoje no fuso America/Sao_Paulo, como yyyy-mm-dd. */
export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export interface Ritmo {
  atingidoPct: number;
  falta: number;
  /** Dias restantes contando hoje; 0 = mês encerrado. */
  diasRestantes: number;
  /** Quanto vender por dia até o fim do mês para bater a meta. */
  porDia: number | null;
}

/** "Para bater a meta, é preciso vender R$ X/dia até o fim do mês" (ESCOPO §5.1). */
export function calcularRitmo(metaValor: number, realizado: number, anoMes: string): Ritmo {
  const hoje = hojeSaoPaulo();
  const [ano, mes] = anoMes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();

  let diasRestantes: number;
  if (hoje.slice(0, 7) === anoMes) {
    diasRestantes = ultimoDia - Number(hoje.slice(8, 10)) + 1;
  } else if (hoje.slice(0, 7) > anoMes) {
    diasRestantes = 0;
  } else {
    diasRestantes = ultimoDia;
  }

  const falta = Math.max(0, metaValor - realizado);
  return {
    atingidoPct: metaValor > 0 ? (realizado / metaValor) * 100 : 0,
    falta,
    diasRestantes,
    porDia: diasRestantes > 0 && falta > 0 ? falta / diasRestantes : null,
  };
}
