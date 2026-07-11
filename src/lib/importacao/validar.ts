import type { CampoVenda } from "./campos";
import type { Celula } from "./planilha";

/**
 * Validação linha a linha em padrão brasileiro (ESCOPO.md §6):
 * datas dd/mm/aaaa, valores 1.234,56 — e também os formatos que o Excel
 * entrega cru (serial de data, fração de hora). Pura: mesma regra na
 * prévia do navegador e na gravação no servidor.
 */

export interface VendaNormalizada {
  linha_origem: number;
  data: string; // yyyy-mm-dd
  valor: number;
  hora: string | null; // HH:MM
  cupom: string | null;
  quantidade: number | null;
  vendedor: string | null;
  produto: string | null;
  categoria: string | null;
  desconto: number | null;
  canal: string | null;
}

export interface ResultadoValidacao {
  aceitas: VendaNormalizada[];
  ignoradas: { linha: number; motivo: string }[];
  periodoInicio: string | null;
  periodoFim: string | null;
  somaValor: number;
}

const MS_POR_DIA = 86_400_000;
// Época do serial de datas do Excel (1899-12-30, convenção 1900 c/ bug do ano bissexto).
const EPOCA_EXCEL_UTC = Date.UTC(1899, 11, 30);

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dataValida(ano: number, mes: number, dia: number): boolean {
  if (ano < 2000 || ano > 2100 || mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}

/** dd/mm/aaaa · dd/mm/aa · aaaa-mm-dd · serial do Excel → "yyyy-mm-dd" ou null. */
export function interpretarData(celula: Celula): string | null {
  if (celula === null || celula === undefined || celula === "") return null;

  if (typeof celula === "number") {
    // serial do Excel (dias desde 1899-12-30); faixa ~1954–2079
    if (celula < 20000 || celula > 65000) return null;
    const d = new Date(EPOCA_EXCEL_UTC + Math.floor(celula) * MS_POR_DIA);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }

  const texto = String(celula).trim();

  // dd/mm/aaaa ou dd-mm-aaaa (com hora opcional depois)
  let m = texto.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})(?:\s|$)/);
  if (m) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    let ano = Number(m[3]);
    if (ano < 100) ano += 2000;
    return dataValida(ano, mes, dia) ? `${ano}-${pad2(mes)}-${pad2(dia)}` : null;
  }

  // aaaa-mm-dd (ISO, com hora opcional)
  m = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s]|$)/);
  if (m) {
    const ano = Number(m[1]);
    const mes = Number(m[2]);
    const dia = Number(m[3]);
    return dataValida(ano, mes, dia) ? `${ano}-${pad2(mes)}-${pad2(dia)}` : null;
  }

  return null;
}

/** "1.234,56" · "R$ 89,90" · "1234.56" · número cru → number ou null. */
export function interpretarValor(celula: Celula): number | null {
  if (celula === null || celula === undefined || celula === "") return null;
  if (typeof celula === "number") return Number.isFinite(celula) ? celula : null;
  if (typeof celula === "boolean") return null;

  let texto = String(celula).trim().replace(/^r\$\s*/i, "");
  if (texto === "") return null;

  const negativo = /^\(.*\)$/.test(texto) || texto.startsWith("-");
  texto = texto.replace(/[()\s-]/g, "");

  const temVirgula = texto.includes(",");
  const temPonto = texto.includes(".");

  if (temVirgula) {
    // padrão brasileiro: ponto é milhar, vírgula é decimal
    texto = texto.replace(/\./g, "").replace(",", ".");
  } else if (temPonto) {
    // só ponto: decimal americano ("1234.56") ou milhar brasileiro ("1.234")
    const partes = texto.split(".");
    const ultima = partes[partes.length - 1];
    if (partes.length > 2 || (ultima.length === 3 && partes[0].length <= 3)) {
      texto = partes.join(""); // 1.234 / 1.234.567 → milhar
    }
  }

  const n = Number(texto);
  if (!Number.isFinite(n)) return null;
  return negativo ? -n : n;
}

/** "14:35" · "14h30" · "14" · fração de dia do Excel → "HH:MM" ou null. */
export function interpretarHora(celula: Celula): string | null {
  if (celula === null || celula === undefined || celula === "") return null;

  if (typeof celula === "number") {
    // fração do dia (0 ≤ x < 1) ou serial com fração (data+hora)
    const fracao = celula % 1;
    if (celula >= 0 && celula < 1 && celula !== 0) {
      const minutos = Math.round(celula * 24 * 60);
      return `${pad2(Math.floor(minutos / 60) % 24)}:${pad2(minutos % 60)}`;
    }
    if (celula >= 20000 && fracao > 0) {
      const minutos = Math.round(fracao * 24 * 60);
      return `${pad2(Math.floor(minutos / 60) % 24)}:${pad2(minutos % 60)}`;
    }
    return null;
  }

  const texto = String(celula).trim();
  const m = texto.match(/(\d{1,2})[:h](\d{2})?/i) ?? texto.match(/^(\d{1,2})$/);
  if (!m) return null;
  const horas = Number(m[1]);
  const minutos = Number(m[2] ?? 0);
  if (horas > 23 || minutos > 59) return null;
  return `${pad2(horas)}:${pad2(minutos)}`;
}

function interpretarTexto(celula: Celula): string | null {
  if (celula === null || celula === undefined) return null;
  const texto = String(celula).trim();
  return texto === "" ? null : texto;
}

/**
 * Valida as linhas mapeadas e devolve as vendas normalizadas + o relatório
 * de ignoradas com o motivo de cada uma (nada é descartado em silêncio).
 */
export function validarVendas(
  linhas: { numero: number; celulas: Celula[] }[],
  mapeamento: Partial<Record<CampoVenda, number>>,
): ResultadoValidacao {
  const aceitas: VendaNormalizada[] = [];
  const ignoradas: { linha: number; motivo: string }[] = [];
  let somaValor = 0;

  const pegar = (celulas: Celula[], campo: CampoVenda): Celula => {
    const idx = mapeamento[campo];
    return idx === undefined ? null : celulas[idx] ?? null;
  };

  for (const { numero, celulas } of linhas) {
    const data = interpretarData(pegar(celulas, "data"));
    if (!data) {
      ignoradas.push({ linha: numero, motivo: "data ausente ou inválida" });
      continue;
    }

    const valor = interpretarValor(pegar(celulas, "valor"));
    if (valor === null) {
      ignoradas.push({ linha: numero, motivo: "valor ausente ou inválido" });
      continue;
    }

    // arredonda antes de somar: a prévia tem de bater com o que o banco grava
    const valorCentavos = Math.round(valor * 100) / 100;
    aceitas.push({
      linha_origem: numero,
      data,
      valor: valorCentavos,
      hora: interpretarHora(pegar(celulas, "hora")),
      cupom: interpretarTexto(pegar(celulas, "cupom")),
      quantidade: interpretarValor(pegar(celulas, "quantidade")),
      vendedor: interpretarTexto(pegar(celulas, "vendedor")),
      produto: interpretarTexto(pegar(celulas, "produto")),
      categoria: interpretarTexto(pegar(celulas, "categoria")),
      desconto: interpretarValor(pegar(celulas, "desconto")),
      canal: interpretarTexto(pegar(celulas, "canal")),
    });
    somaValor += valorCentavos;
  }

  let periodoInicio: string | null = null;
  let periodoFim: string | null = null;
  for (const v of aceitas) {
    if (!periodoInicio || v.data < periodoInicio) periodoInicio = v.data;
    if (!periodoFim || v.data > periodoFim) periodoFim = v.data;
  }

  return {
    aceitas,
    ignoradas,
    periodoInicio,
    periodoFim,
    somaValor: Math.round(somaValor * 100) / 100,
  };
}
