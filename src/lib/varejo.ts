/**
 * Calendário do varejo brasileiro (ESCOPO §3.4): as datas que movem
 * moda e vestuário, pré-carregadas — aparecem na agenda e sobre os
 * gráficos de venda sem que ninguém precise cadastrar.
 */

export interface DataVarejo {
  data: string; // yyyy-mm-dd
  nome: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** N-ésimo dia-da-semana (0=dom) de um mês; ex.: 2º domingo de maio. */
function enesimoDia(ano: number, mes: number, diaSemana: number, n: number): string {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay();
  const dia = 1 + ((diaSemana - primeiro + 7) % 7) + (n - 1) * 7;
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}

export function datasDoVarejo(ano: number): DataVarejo[] {
  // Black Friday: sexta após a 4ª quinta-feira de novembro
  const quartaQuinta = enesimoDia(ano, 11, 4, 4);
  const blackFriday = `${ano}-11-${pad2(Number(quartaQuinta.slice(8, 10)) + 1)}`;

  return [
    { data: `${ano}-03-15`, nome: "Dia do Consumidor" },
    { data: enesimoDia(ano, 5, 0, 2), nome: "Dia das Mães" },
    { data: `${ano}-06-12`, nome: "Dia dos Namorados" },
    { data: enesimoDia(ano, 8, 0, 2), nome: "Dia dos Pais" },
    { data: `${ano}-10-12`, nome: "Dia das Crianças" },
    { data: blackFriday, nome: "Black Friday" },
    { data: `${ano}-12-25`, nome: "Natal" },
    { data: `${ano}-12-31`, nome: "Réveillon" },
  ];
}

/** Datas do varejo dentro de um intervalo [inicio, fim] (yyyy-mm-dd). */
export function datasDoVarejoNoPeriodo(inicio: string, fim: string): DataVarejo[] {
  const anos = new Set([Number(inicio.slice(0, 4)), Number(fim.slice(0, 4))]);
  return [...anos]
    .flatMap(datasDoVarejo)
    .filter((d) => d.data >= inicio && d.data <= fim)
    .sort((a, b) => (a.data < b.data ? -1 : 1));
}
