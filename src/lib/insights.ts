import { formatarData, formatarMesAno, formatarMoeda } from "@/lib/formato";
import type { Ritmo } from "@/lib/metas";
import { mesAnterior, type AgregadosVendas, type ResumoVendas } from "@/lib/vendas";

/**
 * Insights por regras (Fase 2): frases geradas sobre os dados, usadas na
 * "leitura do mês" do Modo Reunião e no painel de Vendas. IA generativa
 * só na Fase 5 — aqui é regra determinística.
 */

export interface Leitura {
  destaques: string[];
  atencao: string[];
}

const DIAS_LONGOS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

function pct(parte: number, todo: number): string {
  return `${((parte / todo) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}%`;
}

function pctDelta(delta: number): string {
  return `${Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function gerarLeitura(entrada: {
  mes: string;
  resumo: ResumoVendas;
  /** Variação % vs mês anterior (null sem base de comparação). */
  delta: number | null;
  /** Variação % vs mesmo mês do ano anterior. */
  deltaAno: number | null;
  agregados: AgregadosVendas;
  /** Unidades com venda, ordenadas da maior para a menor. */
  unidades: { nome: string; valor: number }[];
  meta: { valor: number; ritmo: Ritmo } | null;
}): Leitura {
  const { mes, resumo, delta, deltaAno, agregados, unidades, meta } = entrada;
  const destaques: string[] = [];
  const atencao: string[] = [];

  // ---- meta e ritmo ----
  if (meta) {
    const { ritmo } = meta;
    if (ritmo.atingidoPct >= 100) {
      destaques.push(
        `Meta do mês batida: ${ritmo.atingidoPct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% de ${formatarMoeda(meta.valor, true)}.`,
      );
    } else if (ritmo.diasRestantes === 0) {
      atencao.push(
        `Meta não atingida: faltaram ${formatarMoeda(ritmo.falta)} (${ritmo.atingidoPct.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% de ${formatarMoeda(meta.valor, true)}).`,
      );
    } else if (ritmo.porDia !== null) {
      if (ritmo.porDia > resumo.mediaPorDia) {
        atencao.push(
          `Ritmo abaixo do necessário: a média é ${formatarMoeda(resumo.mediaPorDia)}/dia e a meta pede ${formatarMoeda(ritmo.porDia)}/dia até o fim do mês.`,
        );
      } else {
        destaques.push(
          `No ritmo para bater a meta: ${formatarMoeda(resumo.mediaPorDia)}/dia contra ${formatarMoeda(ritmo.porDia)}/dia necessários.`,
        );
      }
    }
  }

  // ---- melhor dia e concentração semanal ----
  const melhorDiaIdx = agregados.porDia.indexOf(Math.max(...agregados.porDia));
  if (agregados.porDia[melhorDiaIdx] > 0) {
    destaques.push(
      `${formatarData(`${mes}-${String(melhorDiaIdx + 1).padStart(2, "0")}`)} foi o melhor dia do mês, com ${formatarMoeda(agregados.porDia[melhorDiaIdx])}.`,
    );
  }
  const somaSemana = agregados.porDiaSemana.reduce((a, b) => a + b, 0);
  const melhorDow = agregados.porDiaSemana.indexOf(Math.max(...agregados.porDiaSemana));
  if (somaSemana > 0) {
    const nome = DIAS_LONGOS[melhorDow];
    destaques.push(
      `${nome.charAt(0).toUpperCase() + nome.slice(1)}s concentram ${pct(agregados.porDiaSemana[melhorDow], somaSemana)} da venda.`,
    );
  }

  // ---- rede ----
  if (unidades.length > 1) {
    destaques.push(
      `${unidades[0].nome} lidera com ${pct(unidades[0].valor, resumo.faturamento)} do faturamento.`,
    );
    const ultima = unidades[unidades.length - 1];
    atencao.push(
      `${ultima.nome} responde por ${pct(ultima.valor, resumo.faturamento)} do faturamento do período.`,
    );
  }

  // ---- comparativos ----
  if (delta !== null) {
    (delta >= 0 ? destaques : atencao).push(
      `Faturamento ${delta >= 0 ? `${pctDelta(delta)} acima` : `${pctDelta(delta)} abaixo`} de ${formatarMesAno(mesAnterior(mes))}.`,
    );
  }
  if (deltaAno !== null) {
    (deltaAno >= 0 ? destaques : atencao).push(
      `${deltaAno >= 0 ? "Crescimento" : "Queda"} de ${pctDelta(deltaAno)} sobre ${formatarMesAno(mes)} do ano passado.`.replace(
        formatarMesAno(mes),
        formatarMesAno(`${Number(mes.slice(0, 4)) - 1}-${mes.slice(5, 7)}`),
      ),
    );
  }

  // ---- buracos de dados ----
  const diasComVenda = agregados.porDia
    .map((v, i) => (v > 0 ? i : -1))
    .filter((i) => i !== -1);
  if (diasComVenda.length > 1) {
    const buraco =
      diasComVenda[diasComVenda.length - 1] - diasComVenda[0] + 1 - diasComVenda.length;
    if (buraco > 0) {
      atencao.push(
        `${buraco} ${buraco === 1 ? "dia sem venda registrada" : "dias sem venda registrada"} dentro do período — confira se falta planilha.`,
      );
    }
  }

  return { destaques, atencao };
}
