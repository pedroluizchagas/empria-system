/** Formatação em padrão brasileiro (R$, dd/mm/aaaa, fuso America/Sao_Paulo). */

const FUSO = "America/Sao_Paulo";

const fmtMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fmtMoedaInteira = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const fmtNumero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export function formatarMoeda(valor: number, inteira = false): string {
  return (inteira ? fmtMoedaInteira : fmtMoeda).format(valor);
}

export function formatarNumero(valor: number): string {
  return fmtNumero.format(valor);
}

/** "2026-07-11" (date do banco) → "11/07/2026". */
export function formatarData(isoData: string): string {
  const [ano, mes, dia] = isoData.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** timestamptz do banco → "11/07/2026 14:35". */
export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: FUSO,
  }).format(new Date(iso));
}

/** "2026-07" → "julho de 2026". */
export function formatarMesAno(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  const nome = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(ano, mes - 1, 1)));
  return `${nome} de ${ano}`;
}

export const DIAS_SEMANA_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
