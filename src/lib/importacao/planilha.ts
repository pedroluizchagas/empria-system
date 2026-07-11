import type { DefinicaoCampo } from "./campos";

/**
 * Leitura estrutural da planilha já convertida em matriz de células
 * (o parse do arquivo em si fica no cliente, com SheetJS).
 * Pura e sem dependências: roda no navegador (prévia) e no servidor.
 */

export type Celula = string | number | boolean | null;

export interface EstruturaPlanilha {
  /** Índice da linha de cabeçalho na matriz original. */
  linhaCabecalho: number;
  /** Rótulos das colunas ("Coluna 3" quando a célula está vazia). */
  colunas: string[];
  /** Linhas de dados (após o cabeçalho), com o nº da linha no arquivo. */
  linhas: { numero: number; celulas: Celula[] }[];
}

function celulaVazia(c: Celula): boolean {
  return c === null || c === undefined || String(c).trim() === "";
}

/** Remove acentos, baixa a caixa e colapsa separadores — base de todo matching. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_./\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Encontra o cabeçalho: nas primeiras 15 linhas, a que tiver mais células
 * de texto não vazias (relatórios de ERP costumam ter título/filtros antes).
 */
export function detectarEstrutura(matriz: Celula[][]): EstruturaPlanilha | null {
  const limite = Math.min(matriz.length, 15);
  let melhor = -1;
  let melhorPontos = 0;

  for (let i = 0; i < limite; i++) {
    const linha = matriz[i] ?? [];
    const textos = linha.filter((c) => typeof c === "string" && c.trim() !== "").length;
    const preenchidas = linha.filter((c) => !celulaVazia(c)).length;
    // exige ao menos 2 colunas; texto pesa mais que número (títulos de coluna são texto)
    const pontos = textos * 2 + preenchidas;
    if (preenchidas >= 2 && pontos > melhorPontos) {
      melhor = i;
      melhorPontos = pontos;
    }
  }

  if (melhor === -1) return null;

  const cabecalho = matriz[melhor] ?? [];
  const largura = Math.max(cabecalho.length, ...matriz.slice(melhor + 1, melhor + 50).map((l) => l?.length ?? 0));
  const colunas = Array.from({ length: largura }, (_, i) => {
    const c = cabecalho[i];
    return celulaVazia(c) ? `Coluna ${i + 1}` : String(c).trim();
  });

  const linhas = matriz
    .slice(melhor + 1)
    .map((celulas, i) => ({ numero: melhor + 2 + i, celulas: celulas ?? [] }))
    .filter((l) => l.celulas.some((c) => !celulaVazia(c)));

  return { linhaCabecalho: melhor, colunas, linhas };
}

/**
 * Identidade da origem: mesmos cabeçalhos NA MESMA ORDEM ⇒ mesmo modelo.
 * Sensível à ordem de propósito — o mapeamento salvo é por índice de coluna;
 * se a origem reordenar as colunas, tratamos como origem nova e pedimos
 * confirmação de novo, em vez de aplicar índices errados em silêncio.
 */
export function assinaturaColunas(colunas: string[]): string {
  return colunas.map(normalizarTexto).join("|");
}

/**
 * Sugere o mapeamento campo → índice da coluna comparando os cabeçalhos
 * com os apelidos conhecidos. Igualdade exata ganha de "contém".
 */
export function sugerirMapeamento(
  colunas: string[],
  definicoes: DefinicaoCampo[],
): Record<string, number> {
  const normalizadas = colunas.map(normalizarTexto);
  const usadas = new Set<number>();
  const resultado: Record<string, number> = {};

  // 1ª passada: igualdade exata com algum apelido
  for (const def of definicoes) {
    const idx = normalizadas.findIndex((c, i) => !usadas.has(i) && def.apelidos.includes(c));
    if (idx !== -1) {
      resultado[def.campo] = idx;
      usadas.add(idx);
    }
  }

  // 2ª passada: cabeçalho contém o apelido (ex.: "valor total (r$)")
  for (const def of definicoes) {
    if (def.campo in resultado) continue;
    const idx = normalizadas.findIndex(
      (c, i) => !usadas.has(i) && def.apelidos.some((a) => c.includes(a)),
    );
    if (idx !== -1) {
      resultado[def.campo] = idx;
      usadas.add(idx);
    }
  }

  return resultado;
}
