/**
 * Campos de destino da importação (ESCOPO.md §6).
 * Só data e valor são obrigatórios: cada opcional presente desbloqueia
 * uma análise — o sistema nunca quebra por falta de coluna.
 */

export const CAMPOS_VENDA = [
  "data",
  "valor",
  "hora",
  "cupom",
  "quantidade",
  "vendedor",
  "produto",
  "categoria",
  "desconto",
  "canal",
] as const;
export type CampoVenda = (typeof CAMPOS_VENDA)[number];

export interface DefinicaoCampo {
  campo: CampoVenda;
  rotulo: string;
  obrigatorio: boolean;
  /** O que a coluna desbloqueia — exibido no passo de mapeamento. */
  desbloqueia: string | null;
  /** Nomes de coluna comuns nos relatórios dos ERPs (normalizados). */
  apelidos: string[];
}

export const DEFINICOES_VENDA: DefinicaoCampo[] = [
  {
    campo: "data",
    rotulo: "Data da venda",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["data", "dia", "data venda", "data da venda", "dt venda", "emissao", "data emissao", "dt"],
  },
  {
    campo: "valor",
    rotulo: "Valor (R$)",
    obrigatorio: true,
    desbloqueia: null,
    apelidos: ["valor", "total", "valor total", "vlr", "vl total", "receita", "faturamento", "valor liquido", "total liquido", "valor venda", "valor da venda"],
  },
  {
    campo: "hora",
    rotulo: "Hora",
    obrigatorio: false,
    desbloqueia: "análise por horário e mapa de calor dia × hora",
    apelidos: ["hora", "horario", "hora venda", "hora da venda"],
  },
  {
    campo: "cupom",
    rotulo: "Nº do cupom / pedido",
    obrigatorio: false,
    desbloqueia: "nº de atendimentos e ticket médio real",
    apelidos: ["cupom", "cupom fiscal", "pedido", "numero pedido", "n pedido", "nota", "nf", "documento", "doc", "ticket"],
  },
  {
    campo: "quantidade",
    rotulo: "Quantidade de peças",
    obrigatorio: false,
    desbloqueia: "peças por atendimento (PA) e preço médio por peça",
    apelidos: ["quantidade", "qtde", "qtd", "pecas", "qtde pecas", "itens", "unidades", "quant"],
  },
  {
    campo: "vendedor",
    rotulo: "Vendedor(a)",
    obrigatorio: false,
    desbloqueia: "ranking e metas individuais",
    apelidos: ["vendedor", "vendedora", "funcionario", "colaborador", "atendente", "operador"],
  },
  {
    campo: "produto",
    rotulo: "Produto",
    obrigatorio: false,
    desbloqueia: "curva ABC e análise por coleção",
    apelidos: ["produto", "descricao", "descricao produto", "item", "mercadoria", "modelo", "referencia", "ref"],
  },
  {
    campo: "categoria",
    rotulo: "Categoria",
    obrigatorio: false,
    desbloqueia: "análise por categoria",
    apelidos: ["categoria", "grupo", "secao", "familia", "linha", "departamento", "colecao"],
  },
  {
    campo: "desconto",
    rotulo: "Desconto (R$)",
    obrigatorio: false,
    desbloqueia: "desconto médio",
    apelidos: ["desconto", "desc", "valor desconto", "vlr desconto"],
  },
  {
    campo: "canal",
    rotulo: "Canal",
    obrigatorio: false,
    desbloqueia: "análise por canal (loja, online, atacado)",
    apelidos: ["canal", "origem", "tipo venda", "canal venda"],
  },
];
